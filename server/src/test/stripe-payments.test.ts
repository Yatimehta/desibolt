/**
 * DESI BOLT — Stripe Payments Endpoint Test Suite
 * Tests POST /api/payments/create-intent and POST /api/payments/refund
 * Uses in-memory DB (NODE_ENV=test) — Stripe SDK is mocked via jest.mock
 */
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db.js';
import { generateToken } from '../auth.js';

// ── Mock the Stripe SDK so no real API calls are made ──────────────────────
jest.mock('../stripe.js', () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
  handleStripeError: jest.fn((err: any) => ({
    statusCode: 402,
    body: { error: err.message, code: err.code ?? 'card_declined' },
  })),
}));

// Pull typed references to mocked functions
import { stripe } from '../stripe.js';
const mockCreateIntent = stripe.paymentIntents.create as jest.Mock;
const mockCreateRefund = stripe.refunds.create as jest.Mock;

describe('DESI BOLT Stripe Payments Test Suite', () => {
  let app: any;
  let adminToken: string;
  let customerToken: string;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    app = createApp();
    const adminUser = db.users.get('usr_admin_1')!;
    const customerUser = db.users.get('usr_customer_1')!;
    adminToken = generateToken(adminUser);
    customerToken = generateToken(customerUser);
  });

  beforeEach(() => {
    db.resetDatabase();
    jest.clearAllMocks();
  });

  // ── POST /api/payments/create-intent ────────────────────────────────────

  describe('POST /api/payments/create-intent', () => {
    it('should create a PaymentIntent and return clientSecret for a valid order', async () => {
      // Attach order to the seeded customer so it has a userId
      const order = db.orders.get('ord-88329')!;
      order.userId = 'usr_customer_1';
      order.paymentStatus = 'pending';
      db.orders.set('ord-88329', order);

      mockCreateIntent.mockResolvedValueOnce({
        id: 'pi_test_abc123',
        client_secret: 'pi_test_abc123_secret_xyz',
        amount: 969,
        currency: 'eur',
        status: 'requires_payment_method',
      });

      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'ord-88329', amount: 9.69, currency: 'eur' });

      expect(res.status).toBe(201);
      expect(res.body.clientSecret).toBe('pi_test_abc123_secret_xyz');
      expect(res.body.paymentIntentId).toBe('pi_test_abc123');
      expect(res.body.amountInCents).toBe(969);
      expect(res.body.currency).toBe('eur');
      expect(res.body.orderId).toBe('ord-88329');

      // Verify Stripe was called with correct parameters
      expect(mockCreateIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 969,
          currency: 'eur',
          metadata: expect.objectContaining({
            orderId: 'ord-88329',
            orderNumber: 'DB-MLT-88329',
          }),
        })
      );
    });

    it('should return 400 when amount is below €0.50 minimum', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'ord-88329', amount: 0.25, currency: 'eur' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('€0.50');
      expect(res.body.code).toBe('amount_too_small');
      expect(mockCreateIntent).not.toHaveBeenCalled();
    });

    it('should return 400 when orderId is missing', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ amount: 9.69 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('missing_order_id');
    });

    it('should return 404 when orderId does not exist', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'ord-does-not-exist', amount: 9.69 });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('order_not_found');
    });

    it('should return 409 when order is already paid', async () => {
      // ord-88329 is seeded with paymentStatus='paid'
      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'ord-88329', amount: 9.69 });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('already_paid');
      expect(mockCreateIntent).not.toHaveBeenCalled();
    });

    it('should propagate Stripe card_declined errors with 402', async () => {
      const order = db.orders.get('ord-88329')!;
      order.paymentStatus = 'pending';
      db.orders.set('ord-88329', order);

      const stripeErr = Object.assign(new Error('Your card was declined.'), {
        type: 'StripeCardError',
        code: 'card_declined',
      });
      mockCreateIntent.mockRejectedValueOnce(stripeErr);

      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ orderId: 'ord-88329', amount: 9.69 });

      expect(res.status).toBe(402);
      expect(res.body.code).toBe('card_declined');
    });
  });

  // ── POST /api/payments/refund ────────────────────────────────────────────

  describe('POST /api/payments/refund', () => {
    beforeEach(() => {
      // Set up ord-88329 as paid + owned by customer + has an intent ID
      const order = db.orders.get('ord-88329')!;
      order.paymentStatus = 'paid';
      order.userId = 'usr_customer_1';
      order.stripePaymentIntentId = 'pi_test_refund_ready';
      // Make order 1 hour old (within 48h window)
      order.createdAt = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      db.orders.set('ord-88329', order);
    });

    it('should successfully refund a paid order as the owning customer', async () => {
      mockCreateRefund.mockResolvedValueOnce({
        id: 're_test_xyz789',
        amount: 969,
        currency: 'eur',
        status: 'succeeded',
        reason: 'requested_by_customer',
      });

      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: 'ord-88329', reason: 'requested_by_customer' });

      expect(res.status).toBe(200);
      expect(res.body.refundId).toBe('re_test_xyz789');
      expect(res.body.orderId).toBe('ord-88329');
      expect(res.body.status).toBe('succeeded');

      // Verify order status updated in DB
      const updatedOrder = db.orders.get('ord-88329')!;
      expect(updatedOrder.paymentStatus).toBe('refunded');

      // Verify Stripe was called with correct payment_intent
      expect(mockCreateRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_intent: 'pi_test_refund_ready',
          reason: 'requested_by_customer',
        })
      );
    });

    it('should allow admin to refund any order', async () => {
      mockCreateRefund.mockResolvedValueOnce({
        id: 're_test_admin_456',
        amount: 969,
        currency: 'eur',
        status: 'succeeded',
        reason: 'fraudulent',
      });

      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderId: 'ord-88329', reason: 'fraudulent' });

      expect(res.status).toBe(200);
      expect(res.body.refundId).toBe('re_test_admin_456');
    });

    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app)
        .post('/api/payments/refund')
        .send({ orderId: 'ord-88329' });

      expect(res.status).toBe(401);
      expect(mockCreateRefund).not.toHaveBeenCalled();
    });

    it('should return 400 when orderId is missing', async () => {
      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'requested_by_customer' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('missing_order_id');
    });

    it('should return 409 when order is not in paid status', async () => {
      const order = db.orders.get('ord-88329')!;
      order.paymentStatus = 'pending';
      db.orders.set('ord-88329', order);

      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: 'ord-88329' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('not_paid');
      expect(mockCreateRefund).not.toHaveBeenCalled();
    });

    it('should return 409 when refund window has expired (>48h old order)', async () => {
      const order = db.orders.get('ord-88329')!;
      order.paymentStatus = 'paid';
      // Make order 49 hours old
      order.createdAt = new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString();
      db.orders.set('ord-88329', order);

      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: 'ord-88329' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('refund_window_expired');
      expect(mockCreateRefund).not.toHaveBeenCalled();
    });

    it('should return 400 when orderId has no Stripe payment intent', async () => {
      const order = db.orders.get('ord-88329')!;
      order.stripePaymentIntentId = undefined;
      db.orders.set('ord-88329', order);

      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: 'ord-88329' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('no_payment_intent');
    });

    it('should return 400 on invalid refund reason', async () => {
      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: 'ord-88329', reason: 'i_changed_my_mind' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('invalid_reason');
    });
  });
});
