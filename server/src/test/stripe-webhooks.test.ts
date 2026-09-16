import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db.js';
import { generateMockStripeWebhook } from './generators.js';

describe('DESI BOLT Stripe Webhooks Verification Suite', () => {
  let app: any;
  let emittedEvents: Array<{ event: string; data: any }> = [];

  beforeAll(() => {
    // Force in-memory DB mode for all tests
    process.env.NODE_ENV = 'test';
    app = createApp((event: string, data: any) => {
      emittedEvents.push({ event, data });
    });
  });

  beforeEach(() => {
    db.resetDatabase();
    emittedEvents = [];
  });

  it('should handle payment_intent.succeeded and update order paymentStatus to "paid"', async () => {
    const order = db.orders.get('ord-88329')!;
    order.paymentStatus = 'pending';
    order.stripePaymentIntentId = 'pi_test_success_123';

    const webhookPayload = {
      ...generateMockStripeWebhook('payment_intent.succeeded', 'pi_test_success_123'),
      id: 'evt_test_succeeded_001'
    };

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 't=1600000000,v1=mock_signature')
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(res.body.eventType).toBe('payment_intent.succeeded');
    expect(res.body.eventId).toBe('evt_test_succeeded_001');

    // Verify order was marked paid in database
    const updatedOrder = db.orders.get('ord-88329');
    expect(updatedOrder?.paymentStatus).toBe('paid');

    // Verify socket notification was emitted
    expect(emittedEvents.some((e) => e.event === 'order:paid')).toBe(true);
  });

  it('should handle payment_intent.payment_failed and update order paymentStatus to "failed"', async () => {
    const order = db.orders.get('ord-88329')!;
    order.stripePaymentIntentId = 'pi_test_fail_456';

    const webhookPayload = generateMockStripeWebhook('payment_intent.payment_failed', 'pi_test_fail_456');

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 't=1600000000,v1=mock_signature')
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    const updatedOrder = db.orders.get('ord-88329');
    expect(updatedOrder?.paymentStatus).toBe('failed');
    expect(emittedEvents.some((e) => e.event === 'order:payment_failed')).toBe(true);
  });

  it('should handle charge.refunded and update order paymentStatus to "refunded"', async () => {
    const order = db.orders.get('ord-88329')!;
    order.stripePaymentIntentId = 'pi_test_refund_789';

    const webhookPayload = generateMockStripeWebhook('charge.refunded', 'pi_test_refund_789');

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 't=1600000000,v1=mock_signature')
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    const updatedOrder = db.orders.get('ord-88329');
    expect(updatedOrder?.paymentStatus).toBe('refunded');
    expect(emittedEvents.some((e) => e.event === 'order:refunded')).toBe(true);
  });

  it('should gracefully acknowledge unknown Stripe event types without error', async () => {
    const genericEvent = {
      id: 'evt_generic_123',
      type: 'customer.subscription.created',
      data: { object: {} }
    };

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 't=1600000000,v1=mock_signature')
      .send(genericEvent);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
