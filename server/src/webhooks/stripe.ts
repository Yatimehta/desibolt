/**
 * DESI BOLT — Stripe Webhook Handler
 * Mounted at: /api/webhooks
 *
 * IMPORTANT: This router must receive the RAW request body (Buffer) for
 * signature verification. The app.ts must apply express.raw() BEFORE
 * express.json() for this path — which it already does.
 *
 * Route:
 *   POST /stripe  — Receive + verify Stripe webhook events
 */
import { Router, Request, Response } from 'express';
import { stripe } from '../stripe.js';
import { db } from '../db.js';

import { sendAdminWebhookLog, sendAdminErrorAlert } from '../services/email.js';

export function createStripeWebhookRouter(
  socketEmitter?: (event: string, data: any) => void
): Router {
  const router = Router();

  router.post('/stripe', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // ── Signature verification ─────────────────────────────────────────────
    let event: import('stripe').Stripe.Event;

    if (webhookSecret) {
      // Production path: full HMAC verification
      if (!sig) {
        console.warn('[DESI BOLT Webhook] ⚠️  Missing stripe-signature header — rejecting.');
        return res.status(400).json({ error: 'Missing Stripe webhook signature.', code: 'missing_signature' });
      }

      try {
        // req.body must be a Buffer (raw) — enforced by express.raw() in app.ts
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        console.error('[DESI BOLT Webhook] ❌ Signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook signature invalid: ${err.message}`, code: 'invalid_signature' });
      }
    } else {
      // Dev / test path: no secret configured — parse raw JSON (webhooks.test.ts uses this)
      if (process.env.NODE_ENV === 'production') {
        console.error('[DESI BOLT Webhook] ❌ STRIPE_WEBHOOK_SECRET not set in production!');
        return res.status(500).json({ error: 'Webhook secret not configured.', code: 'config_error' });
      }
      try {
        event = (Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf-8')) : req.body) as any;
      } catch (e: any) {
        return res.status(400).json({ error: `Webhook payload parsing failed: ${e.message}`, code: 'parse_error' });
      }
    }

    // ── Event dispatching ─────────────────────────────────────────────────
    console.log(`[DESI BOLT Webhook] 📨 Received event: ${event.type} (id: ${event.id})`);
    sendAdminWebhookLog(event.type, (event.data?.object as any)?.id || 'unknown', event.data?.object).catch(() => {});

    try {
      switch (event.type) {
        // ── Payment succeeded ──────────────────────────────────────────────
        case 'payment_intent.succeeded': {
          const pi = event.data.object as import('stripe').Stripe.PaymentIntent;

          let order = await db.orders.findByStripeIntentId(pi.id);
          if (!order && pi.metadata?.orderId) {
            order = await db.orders.findById(pi.metadata.orderId);
          }

          if (order) {
            await db.orders.updatePaymentStatus(order.id, 'paid', pi.id);
            if (socketEmitter) {
              socketEmitter('order:paid', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                paymentIntentId: pi.id,
                amount: pi.amount / 100,
                currency: pi.currency,
              });
            }
            console.log(`[DESI BOLT Webhook] ✅ Order ${order.orderNumber} marked PAID.`);
          } else {
            console.warn(`[DESI BOLT Webhook] ⚠️  No order found for intent: ${pi.id}`);
          }
          break;
        }

        // ── Payment failed ─────────────────────────────────────────────────
        case 'payment_intent.payment_failed': {
          const pi = event.data.object as import('stripe').Stripe.PaymentIntent;
          const failureMessage = pi.last_payment_error?.message ?? 'Unknown reason';

          const order = await db.orders.findByStripeIntentId(pi.id);
          if (order) {
            await db.orders.updatePaymentStatus(order.id, 'failed');
            if (socketEmitter) {
              socketEmitter('order:payment_failed', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                paymentIntentId: pi.id,
                failureMessage,
                failureCode: pi.last_payment_error?.code,
              });
            }
            console.warn(
              `[DESI BOLT Webhook] ❌ Payment failed for order ${order.orderNumber}: ${failureMessage}`
            );
          }
          break;
        }

        // ── Charge refunded ────────────────────────────────────────────────
        case 'charge.refunded': {
          const charge = event.data.object as import('stripe').Stripe.Charge;
          const refundId = (charge.refunds?.data?.[0] as any)?.id ?? null;

          const order = await db.orders.findByStripeIntentId(charge.payment_intent as string);
          if (order) {
            if (refundId) {
              await db.orders.saveRefund(order.id, refundId);
            } else {
              await db.orders.updatePaymentStatus(order.id, 'refunded');
            }
            if (socketEmitter) {
              socketEmitter('order:refunded', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                refundId,
                amountRefunded: charge.amount_refunded / 100,
                currency: charge.currency,
              });
            }
            console.log(`[DESI BOLT Webhook] 💸 Order ${order.orderNumber} refunded.`);
          }
          break;
        }

        // ── Dispute opened (log & alert only — no auto-action) ────────────
        case 'charge.dispute.created': {
          const dispute = event.data.object as import('stripe').Stripe.Dispute;
          console.error(
            `[DESI BOLT Webhook] ⚠️  DISPUTE OPENED: ${dispute.id} — ` +
              `Amount: €${(dispute.amount / 100).toFixed(2)} — Reason: ${dispute.reason}. ` +
              `Respond at: https://dashboard.stripe.com/disputes/${dispute.id}`
          );
          sendAdminErrorAlert('Stripe Dispute Opened', `Dispute ID: ${dispute.id}, Reason: ${dispute.reason}`).catch(() => {});
          break;
        }

        // ── PaymentIntent cancelled ────────────────────────────────────────
        case 'payment_intent.canceled': {
          const pi = event.data.object as import('stripe').Stripe.PaymentIntent;
          const order = await db.orders.findByStripeIntentId(pi.id);
          if (order && order.paymentStatus === 'pending') {
            await db.orders.updatePaymentStatus(order.id, 'failed');
            console.log(`[DESI BOLT Webhook] 🚫 PaymentIntent cancelled for order ${order.orderNumber}.`);
          }
          break;
        }

        default:
          // Acknowledge all other event types silently
          console.log(`[DESI BOLT Webhook] ℹ️  Unhandled event type: ${event.type} — acknowledged.`);
          break;
      }
    } catch (err: any) {
      // Log handler errors but still return 200 so Stripe doesn't retry
      console.error(`[DESI BOLT Webhook] ❌ Handler error for ${event.type}:`, err.message);
    }

    // Always acknowledge receipt — never return 5xx to Stripe (causes infinite retries)
    return res.json({ received: true, eventType: event.type, eventId: event.id });
  });

  return router;
}
