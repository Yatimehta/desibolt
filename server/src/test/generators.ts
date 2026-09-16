import { Product, User, Order, DeliveryAddress } from '../types.js';

/**
 * Test Data Generator for DESI BOLT E-Commerce Backend
 */

export const generateMockProduct = (overrides?: Partial<Product>): Product => {
  const id = `prod-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    name: 'Organic Kesar Mangoes Box',
    brand: 'Gir Harvest',
    category: 'fresh-produce',
    price: 16.50,
    originalPrice: 19.50,
    unit: 'Box of 6 (~1.5kg)',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600',
    stock: 50,
    inStock: true,
    rating: 4.9,
    reviewCount: 45,
    description: 'Fresh GI-tagged sweet Kesar mangoes delivered in Malta.',
    origin: 'India',
    isOrganic: true,
    isVegetarian: true,
    isBestSeller: true,
    discountPercent: 15,
    vatRate: 0,
    sku: `SKU-MNG-${Math.floor(1000 + Math.random() * 9000)}`,
    ...overrides
  };
};

export const generateMockUser = (overrides?: Partial<User>): User => {
  const id = `usr-test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    name: 'Stefan Zammit',
    email: `stefan_${Date.now()}@example.com.mt`,
    passwordHash: '$2a$10$7vN8K9QWp9e6qG2aYn4zLeO6mP8xK5wJ3kL2mQ1wE4rT7yU0iO.Pa', // DesiBolt@2026
    role: 'customer',
    phone: '+356 7911 2233',
    createdAt: new Date().toISOString(),
    ...overrides
  };
};

export const generateMockAddress = (overrides?: Partial<DeliveryAddress>): DeliveryAddress => {
  return {
    fullName: 'Stefan Zammit',
    phone: '+356 7911 2233',
    email: 'stefan@example.com.mt',
    street: '15, Triq Il-Kbira, Apt 2',
    locality: 'Sliema',
    postalCode: 'SLM 1540',
    notes: 'Please ring bell #2',
    coordinates: { lat: 35.9122, lng: 14.5042 },
    ...overrides
  };
};

export const generateMockOrder = (overrides?: Partial<Order>): Order => {
  const id = `ord-test-${Date.now()}`;
  return {
    id,
    orderNumber: `DB-MLT-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: 'usr-test-1',
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    items: [
      {
        productId: 'fp-01',
        name: 'Maltese Farm Fresh Tomatoes',
        price: 1.85,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
        unit: '1 kg',
        vatRate: 0
      }
    ],
    subtotal: 3.70,
    vatAmount: 0.0,
    deliveryFee: 2.50,
    discount: 0.0,
    total: 6.20,
    address: generateMockAddress(),
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    stripePaymentIntentId: `pi_test_${Date.now()}`,
    deliverySlot: 'instant_bolt',
    estimatedDeliveryTime: '20 mins',
    driver: {
      name: 'Josef Vella',
      phone: '+356 7944 8833',
      vehicle: 'DESI BOLT Eco-Scooter #14',
      plateNumber: 'BOLT-77-MT',
      currentLocation: { lat: 35.8978, lng: 14.4795 }
    },
    ...overrides
  };
};

export const generateMockStripeWebhook = (
  eventType: 'payment_intent.succeeded' | 'payment_intent.payment_failed' | 'charge.refunded',
  paymentIntentId: string,
  amount: number = 2500
) => {
  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2024-12-18',
    created: Math.floor(Date.now() / 1000),
    type: eventType,
    data: {
      object: eventType.startsWith('charge')
        ? {
            id: `ch_test_${Date.now()}`,
            object: 'charge',
            amount,
            amount_refunded: amount,
            currency: 'eur',
            payment_intent: paymentIntentId,
            refunded: true,
            status: 'succeeded'
          }
        : {
            id: paymentIntentId,
            object: 'payment_intent',
            amount,
            currency: 'eur',
            status: eventType === 'payment_intent.succeeded' ? 'succeeded' : 'requires_payment_method',
            metadata: {
              source: 'desi_bolt_checkout'
            }
          }
    }
  };
};
