/**
 * DESI BOLT — Stripe Client Singleton
 *
 * Single initialisation point shared by payments.ts and webhooks/stripe.ts.
 * Stripe recommends one instance per process to benefit from connection reuse.
 *
 * In test mode (NODE_ENV=test) or when STRIPE_SECRET_KEY is absent a lightweight
 * stub is exported so that importing app.ts in test files never throws.
 */
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const IS_TEST = process.env.NODE_ENV === 'test';

if (!STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.error('[DESI BOLT Stripe] ❌ STRIPE_SECRET_KEY is not set in production!');
}

// ---------------------------------------------------------------------------
// Real client (production / local dev with real keys)
// ---------------------------------------------------------------------------

function createStripeClient(): Stripe {
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
    maxNetworkRetries: 2,
    appInfo: {
      name: 'DESI BOLT Malta',
      version: '1.0.0',
      url: 'https://desibolt.com',
    },
  });
}

// ---------------------------------------------------------------------------
// Stub (test / no-key mode) — same shape, all methods throw descriptive errors
// ---------------------------------------------------------------------------

function createStripeStub(): Stripe {
  const notConfigured = (name: string) => () => {
    throw new Error(`[DESI BOLT Stripe] ${name} called but STRIPE_SECRET_KEY is not set.`);
  };

  return {
    paymentIntents: { create: notConfigured('paymentIntents.create') },
    refunds: { create: notConfigured('refunds.create') },
    webhooks: {
      constructEvent: notConfigured('webhooks.constructEvent'),
    },
  } as unknown as Stripe;
}

export const stripe: Stripe = STRIPE_SECRET_KEY && !IS_TEST
  ? createStripeClient()
  : createStripeStub();

/**
 * Convert a Stripe error into a structured API response payload.
 * Returns { statusCode, body: { error, code } }
 */
export function handleStripeError(err: any): { statusCode: number; body: { error: string; code: string } } {
  if (err.type === 'StripeCardError') {
    // Card was declined
    return {
      statusCode: 402,
      body: { error: err.message, code: err.code ?? 'card_declined' },
    };
  }
  if (err.type === 'StripeRateLimitError') {
    return {
      statusCode: 429,
      body: { error: 'Too many requests to payment provider. Please try again shortly.', code: 'rate_limit' },
    };
  }
  if (err.type === 'StripeInvalidRequestError') {
    return {
      statusCode: 400,
      body: { error: err.message, code: err.code ?? 'invalid_request' },
    };
  }
  if (err.type === 'StripeAPIError' || err.type === 'StripeConnectionError') {
    return {
      statusCode: 502,
      body: { error: 'Payment provider is temporarily unavailable. Please try again.', code: 'api_error' },
    };
  }
  if (err.type === 'StripeAuthenticationError') {
    console.error('[DESI BOLT Stripe] ❌ Authentication failed — check STRIPE_SECRET_KEY');
    return {
      statusCode: 500,
      body: { error: 'Payment configuration error.', code: 'auth_error' },
    };
  }
  // Unknown / generic
  return {
    statusCode: 500,
    body: { error: err.message ?? 'An unexpected payment error occurred.', code: 'unknown_error' },
  };
}
