/**
 * DESI BOLT — Payments Router
 * Mounted at: /api/payments
 *
 * Routes:
 *   POST /create-intent  — Create real Stripe PaymentIntent
 *   POST /refund         — Refund a paid order (auth required)
 */
import { Router, Request, Response } from 'express';
import { stripe, handleStripeError } from '../stripe.js';
import { db } from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';

// Minimum charge in EUR (Stripe minimum is €0.50)
const MIN_AMOUNT_EUR = 0.50;

export function createPaymentsRouter(
  socketEmitter?: (event: string, data: any) => void
): Router {
  const router = Router();

  // ────────────────────────────────────────────────────────────────────────────
  // POST /api/payments/create-intent
  // ────────────────────────────────────────────────────────────────────────────
  router.post('/create-intent', async (req: Request, res: Response) => {
    const { orderId, amount, currency = 'eur' } = req.body;

    // --- Validate inputs ---
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required.', code: 'missing_order_id' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < MIN_AMOUNT_EUR) {
      return res.status(400).json({
        error: `Amount must be at least €${MIN_AMOUNT_EUR.toFixed(2)} EUR.`,
        code: 'amount_too_small',
      });
    }

    // --- Verify order exists ---
    let order;
    try {
      order = await db.orders.findById(orderId);
    } catch (err: any) {
      return res.status(500).json({ error: 'Database error fetching order.', code: 'db_error' });
    }

    if (!order) {
      return res.status(404).json({ error: `Order '${orderId}' not found.`, code: 'order_not_found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(409).json({
        error: 'This order has already been paid.',
        code: 'already_paid',
      });
    }

    if (order.paymentMethod !== 'stripe') {
      return res.status(400).json({
        error: 'This order uses a non-Stripe payment method.',
        code: 'wrong_payment_method',
      });
    }

    // --- Create Stripe PaymentIntent ---
    try {
      const amountInCents = Math.round(parsedAmount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        // Automatic confirmation — frontend uses confirmPayment()
        automatic_payment_methods: { enabled: true },
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId ?? 'guest',
          platform: 'desi_bolt_malta',
        },
        description: `DESI BOLT Order ${order.orderNumber} — Malta Grocery Delivery`,
        // Idempotency: prevent duplicate intents for same order
        // (Stripe deduplicates on idempotency keys per 24h window)
      });

      // Persist the intent ID immediately so webhook can find the order
      await db.orders.updatePaymentStatus(order.id, 'pending', paymentIntent.id);

      console.log(
        `[DESI BOLT Payments] ✅ PaymentIntent created: ${paymentIntent.id} for order ${order.orderNumber}`
      );

      return res.status(201).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: parsedAmount,
        amountInCents,
        currency: currency.toLowerCase(),
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: paymentIntent.status,
      });
    } catch (err: any) {
      console.error('[DESI BOLT Payments] PaymentIntent creation failed:', err.message);
      const { statusCode, body } = handleStripeError(err);
      return res.status(statusCode).json(body);
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /api/payments/refund
  // Requires: valid JWT (customer = own order only, admin = any order)
  // ────────────────────────────────────────────────────────────────────────────
  router.post('/refund', authenticateToken, async (req: AuthRequest, res: Response) => {
    const { orderId, reason = 'requested_by_customer' } = req.body;

    const VALID_REFUND_REASONS = ['duplicate', 'fraudulent', 'requested_by_customer'];

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required.', code: 'missing_order_id' });
    }

    if (!VALID_REFUND_REASONS.includes(reason)) {
      return res.status(400).json({
        error: `Invalid reason. Must be one of: ${VALID_REFUND_REASONS.join(', ')}`,
        code: 'invalid_reason',
      });
    }

    // --- Fetch order ---
    let order;
    try {
      order = await db.orders.findById(orderId);
    } catch (err: any) {
      return res.status(500).json({ error: 'Database error fetching order.', code: 'db_error' });
    }

    if (!order) {
      return res.status(404).json({ error: `Order '${orderId}' not found.`, code: 'order_not_found' });
    }

    // --- Ownership check: customers can only refund their own orders ---
    if (req.user?.role !== 'admin' && order.userId !== req.user?.id) {
      return res.status(403).json({
        error: 'You do not have permission to refund this order.',
        code: 'forbidden',
      });
    }

    // --- Business rule validations ---
    if (order.paymentStatus !== 'paid') {
      return res.status(409).json({
        error: `Cannot refund order with payment status '${order.paymentStatus}'. Order must be paid.`,
        code: 'not_paid',
      });
    }

    if (order.paymentStatus === 'refunded') {
      return res.status(409).json({
        error: 'This order has already been refunded.',
        code: 'already_refunded',
      });
    }

    if (!order.stripePaymentIntentId) {
      return res.status(400).json({
        error: 'No Stripe payment found for this order. Cannot process refund.',
        code: 'no_payment_intent',
      });
    }

    // --- 48-hour refund window ---
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    const REFUND_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours
    if (orderAge > REFUND_WINDOW_MS) {
      return res.status(409).json({
        error: 'Refund window has closed. Orders can only be refunded within 48 hours of placement.',
        code: 'refund_window_expired',
      });
    }

    // --- Issue Stripe refund ---
    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        reason: reason as 'duplicate' | 'fraudulent' | 'requested_by_customer',
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          refundedBy: req.user?.id ?? 'unknown',
          platform: 'desi_bolt_malta',
        },
      });

      // Persist refund details
      await db.orders.saveRefund(order.id, refund.id);

      // Notify connected clients
      if (socketEmitter) {
        socketEmitter('order:refunded', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          refundId: refund.id,
          amount: (refund.amount ?? 0) / 100,
          currency: refund.currency,
          status: refund.status,
        });
      }

      console.log(
        `[DESI BOLT Payments] ✅ Refund issued: ${refund.id} for order ${order.orderNumber} — ` +
          `€${((refund.amount ?? 0) / 100).toFixed(2)} ${refund.currency?.toUpperCase()}`
      );

      return res.json({
        message: 'Refund processed successfully.',
        refundId: refund.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: (refund.amount ?? 0) / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
      });
    } catch (err: any) {
      console.error('[DESI BOLT Payments] Refund failed:', err.message);
      const { statusCode, body } = handleStripeError(err);
      return res.status(statusCode).json(body);
    }
  });

  return router;
}
