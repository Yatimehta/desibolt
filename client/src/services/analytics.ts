/**
 * DESI BOLT — Production Analytics & Event Tracking Service
 * Supports Google Analytics 4 (GA4), Stripe Payment Tracking, and E-commerce Conversion Tracking.
 */
import { Product, CartItem, Order } from '../types';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-DESIBOLT2026';

class AnalyticsService {
  private isInitialized = false;

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    window.dataLayer = window.dataLayer || [];
    const gtag = (...args: any[]) => {
      window.dataLayer.push(args);
    };
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      cookie_flags: 'max-age=7200;secure;samesite=none',
    });

    this.isInitialized = true;
    console.log(`[DESI BOLT Analytics] 📊 Initialized GA4 with ID: ${GA_MEASUREMENT_ID}`);
  }

  trackPageView(path: string, title?: string) {
    if (!window.gtag) return;
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }

  trackAddToCart(product: Product, quantity: number = 1) {
    if (!window.gtag) return;
    window.gtag('event', 'add_to_cart', {
      currency: 'EUR',
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_brand: product.brand,
          item_category: product.category,
          price: product.price,
          quantity,
        },
      ],
    });
    console.log(`[Analytics] 🛒 Tracked Add To Cart: ${product.name} (x${quantity})`);
  }

  trackRemoveFromCart(product: Product, quantity: number = 1) {
    if (!window.gtag) return;
    window.gtag('event', 'remove_from_cart', {
      currency: 'EUR',
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity,
        },
      ],
    });
  }

  trackBeginCheckout(items: CartItem[], totalValue: number) {
    if (!window.gtag) return;
    window.gtag('event', 'begin_checkout', {
      currency: 'EUR',
      value: totalValue,
      items: items.map((it) => ({
        item_id: it.product.id,
        item_name: it.product.name,
        price: it.product.price,
        quantity: it.quantity,
      })),
    });
    console.log(`[Analytics] 💳 Tracked Begin Checkout (€${totalValue.toFixed(2)})`);
  }

  trackPurchase(order: Order) {
    if (!window.gtag) return;
    window.gtag('event', 'purchase', {
      transaction_id: order.orderNumber,
      value: order.total,
      currency: 'EUR',
      tax: order.vatAmount,
      shipping: order.deliveryFee,
      items: order.items.map((it) => ({
        item_id: it.productId,
        item_name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
    });
    console.log(`[Analytics] 🏆 Tracked Purchase Order #${order.orderNumber} (€${order.total.toFixed(2)})`);
  }

  trackStripePaymentEvent(action: 'created' | 'confirmed' | 'failed' | 'refunded', intentId: string, amount: number) {
    if (!window.gtag) return;
    window.gtag('event', `stripe_payment_${action}`, {
      event_category: 'Stripe Payment',
      payment_intent_id: intentId,
      value: amount,
      currency: 'EUR',
    });
    console.log(`[Analytics] ⚡️ Stripe Event (${action}): ${intentId} (€${amount.toFixed(2)})`);
  }
}

export const analytics = new AnalyticsService();
