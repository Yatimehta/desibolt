import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db.js';
import { generateToken } from '../auth.js';
import { generateMockProduct, generateMockAddress } from './generators.js';

describe('DESI BOLT API Endpoints Test Suite', () => {
  let app: any;
  let adminToken: string;
  let customerToken: string;

  beforeAll(() => {
    // Force in-memory DB mode for all tests
    process.env.NODE_ENV = 'test';
    app = createApp();
    const adminUser = db.users.get('usr_admin_1')!;
    const customerUser = db.users.get('usr_customer_1')!;
    adminToken = generateToken(adminUser);
    customerToken = generateToken(customerUser);
  });

  beforeEach(() => {
    db.resetDatabase();
  });

  // --- HEALTH & CATEGORIES ---
  describe('GET /api/health & /api/categories', () => {
    it('should return 200 and healthy database status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database.status).toBe('connected');
    });

    it('should return 10 categories with 7,162 catalog count', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.categories).toHaveLength(10);
      expect(res.body.totalCatalogCount).toBe(7162);
    });
  });

  // --- PRODUCTS CRUD ---
  describe('Products Endpoints', () => {
    it('GET /api/products should return paginated products', async () => {
      const res = await request(app).get('/api/products?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('GET /api/products should filter by category', async () => {
      const res = await request(app).get('/api/products?category=fresh-produce');
      expect(res.status).toBe(200);
      res.body.products.forEach((p: any) => {
        expect(p.category).toBe('fresh-produce');
      });
    });

    it('GET /api/products should search by name or brand', async () => {
      const res = await request(app).get('/api/products?search=Tomatoes');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.products[0].name).toContain('Tomatoes');
    });

    it('GET /api/products/:id should return single product', async () => {
      const res = await request(app).get('/api/products/fp-01');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('fp-01');
      expect(res.body.name).toBe('Maltese Farm Fresh Tomatoes');
    });

    it('POST /api/products should allow Admin to create new product', async () => {
      const newProduct = generateMockProduct();
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(newProduct.name);
      expect(db.products.has(res.body.id)).toBe(true);
    });

    it('POST /api/products should block Non-Admin customers with 403', async () => {
      const newProduct = generateMockProduct();
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newProduct);

      expect(res.status).toBe(403);
    });

    it('PUT /api/products/:id should update product price and stock', async () => {
      const res = await request(app)
        .put('/api/products/fp-01')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 2.15, stock: 200 });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(2.15);
      expect(res.body.stock).toBe(200);
      expect(db.products.get('fp-01')?.price).toBe(2.15);
    });

    it('DELETE /api/products/:id should delete product', async () => {
      const res = await request(app)
        .delete('/api/products/fp-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(db.products.has('fp-01')).toBe(false);
    });
  });

  // --- CART & MALTA VAT CALCULATION ---
  describe('POST /api/cart/validate', () => {
    it('should accurately calculate subtotal, 0% VAT on food staples, and delivery fee', async () => {
      const payload = {
        items: [
          { productId: 'fp-01', quantity: 2 }, // 2 x 1.85 = 3.70 (0% VAT)
          { productId: 'dp-01', quantity: 1 }  // 1 x 3.49 = 3.49 (0% VAT)
        ]
      };

      const res = await request(app).post('/api/cart/validate').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.subtotal).toBe(7.19);
      expect(res.body.vatAmount).toBe(0.0);
      expect(res.body.deliveryFee).toBe(2.50); // Below 30 EUR threshold
      expect(res.body.freeDeliveryUnlocked).toBe(false);
      expect(res.body.total).toBe(9.69);
    });

    it('should unlock free delivery when order is above €30.00', async () => {
      const payload = {
        items: [
          { productId: 'ar-01', quantity: 3 } // 3 x 14.50 = 43.50 (>= €30)
        ]
      };

      const res = await request(app).post('/api/cart/validate').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.subtotal).toBe(43.50);
      expect(res.body.deliveryFee).toBe(0.0);
      expect(res.body.freeDeliveryUnlocked).toBe(true);
      expect(res.body.total).toBe(43.50);
    });

    it('should apply 18% standard VAT on snacks & sweets items', async () => {
      const payload = {
        items: [
          { productId: 'ss-01', quantity: 2 } // 2 x 2.75 = 5.50 (18% VAT = 0.99)
        ]
      };

      const res = await request(app).post('/api/cart/validate').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.subtotal).toBe(5.50);
      expect(res.body.vatAmount).toBeCloseTo(0.99, 2);
    });
  });

  // --- ORDERS CRUD & DISPATCH ---
  describe('Orders Endpoints', () => {
    it('POST /api/orders should create a new order with auto-assigned courier', async () => {
      const orderPayload = {
        items: [
          { productId: 'fp-01', name: 'Maltese Farm Fresh Tomatoes', price: 1.85, quantity: 2, image: 'img.jpg', unit: '1 kg' }
        ],
        address: generateMockAddress(),
        paymentMethod: 'stripe',
        deliverySlot: 'instant_bolt'
      };

      const res = await request(app).post('/api/orders').send(orderPayload);
      expect(res.status).toBe(201);
      expect(res.body.orderNumber).toMatch(/^DB-MLT-\d+$/);
      expect(res.body.status).toBe('confirmed');
      expect(res.body.driver).toBeDefined();
      expect(res.body.driver.name).toBe('Josef Vella');
      expect(db.orders.has(res.body.id)).toBe(true);
    });

    it('GET /api/orders should return all orders', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/orders/:id should return single order', async () => {
      const res = await request(app).get('/api/orders/ord-88329');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('ord-88329');
      expect(res.body.address.locality).toBe('Sliema');
    });

    it('PATCH /api/orders/:id/status should update order lifecycle', async () => {
      const res = await request(app)
        .patch('/api/orders/ord-88329/status')
        .send({ status: 'delivered' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('delivered');
      expect(db.orders.get('ord-88329')?.status).toBe('delivered');
    });
  });

  // --- STRIPE PAYMENTS INTENT ---
  describe('POST /api/payments/create-intent', () => {
    it('should return 409 when order is already paid (seeded ord-88329 is paid)', async () => {
      // The seeded ord-88329 has paymentStatus='paid'.
      // The real endpoint correctly rejects with 409 already_paid.
      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ amount: 9.69, currency: 'eur', orderId: 'ord-88329' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('already_paid');
    });

    it('should return 400 when amount is below €0.50 minimum', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ amount: 0.10, currency: 'eur', orderId: 'ord-88329' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('amount_too_small');
    });

    it('should return 404 for a non-existent orderId', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({ amount: 9.69, currency: 'eur', orderId: 'ord-does-not-exist' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('order_not_found');
    });
  });
});
