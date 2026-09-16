/**
 * DESI BOLT — New Endpoints Test Suite
 * Tests:
 *   1. GET /api/users/:id/orders (User Order History)
 *   2. POST /api/promos/validate (Promo Code Validation & Discount Calculations)
 *   3. GET /api/drivers (Fleet Management / Active Drivers Listing)
 *   4. POST /api/drivers/:id/accept-order (Driver Delivery Acceptance Workflow)
 *   5. PATCH /api/drivers/:id/location (Live Driver GPS Updates)
 *   6. PATCH /api/orders/:id/status (Mark Delivered, Photo Proof, Driver Release, Rating URL)
 */
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db.js';
import { generateToken } from '../auth.js';

describe('DESI BOLT Missing Endpoints Test Suite', () => {
  let app: any;
  let adminToken: string;
  let customerToken: string;
  let otherCustomerToken: string;
  let driverToken: string;
  let emittedEvents: Array<{ event: string; data: any }> = [];

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    app = createApp((event: string, data: any) => {
      emittedEvents.push({ event, data });
    });

    const adminUser = db.users.get('usr_admin_1')!;
    const customerUser = db.users.get('usr_customer_1')!;
    const driverUser = db.users.get('usr_driver_1')!;

    adminToken = generateToken(adminUser);
    customerToken = generateToken(customerUser);
    driverToken = generateToken(driverUser);

    // Create a 2nd customer for isolation tests
    const otherCustomer = {
      id: 'usr_customer_2',
      name: 'Maria Vella',
      email: 'maria@example.com.mt',
      passwordHash: 'hash',
      role: 'customer' as const,
      phone: '+356 9988 7766',
      createdAt: '2026-02-01T10:00:00.000Z',
    };
    db.users.set('usr_customer_2', otherCustomer);
    otherCustomerToken = generateToken(otherCustomer);
  });

  beforeEach(() => {
    db.resetDatabase();
    emittedEvents = [];

    // Re-seed 2nd customer
    db.users.set('usr_customer_2', {
      id: 'usr_customer_2',
      name: 'Maria Vella',
      email: 'maria@example.com.mt',
      passwordHash: 'hash',
      role: 'customer',
      phone: '+356 9988 7766',
      createdAt: '2026-02-01T10:00:00.000Z',
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. GET /api/users/:id/orders (USER ORDER HISTORY)
  // ══════════════════════════════════════════════════════════════════════════

  describe('1. GET /api/users/:id/orders', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/users/usr_customer_1/orders');
      expect(res.status).toBe(401);
    });

    it('should return 403 when customer attempts to view another user orders', async () => {
      const res = await request(app)
        .get('/api/users/usr_customer_1/orders')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('forbidden');
    });

    it('should return 404 when requested user does not exist', async () => {
      const res = await request(app)
        .get('/api/users/usr_non_existent/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('user_not_found');
    });

    it('should allow customer to fetch their own order history with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/users/usr_customer_1/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders).toBeDefined();
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
      expect(res.body.orders[0].orderNumber).toBe('DB-MLT-88329');
    });

    it('should allow admin to view any user order history', async () => {
      const res = await request(app)
        .get('/api/users/usr_customer_1/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter user orders by status correctly', async () => {
      const res = await request(app)
        .get('/api/users/usr_customer_1/orders?status=delivered')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      // Seeded order is 'out_for_delivery', so 'delivered' filter should return 0
      expect(res.body.orders.length).toBe(0);
      expect(res.body.total).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. POST /api/promos/validate (PROMO CODE VALIDATION)
  // ══════════════════════════════════════════════════════════════════════════

  describe('2. POST /api/promos/validate', () => {
    it('should return 400 if promo code is missing or empty', async () => {
      const res = await request(app)
        .post('/api/promos/validate')
        .send({ cartSubtotal: 35.0 });

      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.code).toBe('missing_code');
    });

    it('should return 400 if cartSubtotal is invalid or missing', async () => {
      const res = await request(app)
        .post('/api/promos/validate')
        .send({ code: 'WELCOME20' });

      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.code).toBe('invalid_subtotal');
    });

    it('should return 404 for an unknown promo code', async () => {
      const res = await request(app)
        .post('/api/promos/validate')
        .send({ code: 'INVALID_CODE_999', cartSubtotal: 50.0 });

      expect(res.status).toBe(404);
      expect(res.body.valid).toBe(false);
      expect(res.body.code).toBe('promo_not_found');
    });

    it('should return 400 when cart subtotal is less than min_cart_amount', async () => {
      // WELCOME20 requires min €15.00
      const res = await request(app)
        .post('/api/promos/validate')
        .send({ code: 'WELCOME20', cartSubtotal: 10.0 });

      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.code).toBe('min_amount_not_met');
      expect(res.body.message).toContain('Min €15.00 required');
    });

    it('should calculate percentage discount correctly (WELCOME20 = 20% off)', async () => {
      const res = await request(app)
        .post('/api/promos/validate')
        .send({ code: 'WELCOME20', cartSubtotal: 50.0 });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.code).toBe('WELCOME20');
      expect(res.body.discountType).toBe('percent');
      expect(res.body.discountValue).toBe(20);
      expect(res.body.discountAmount).toBe(10.0); // 20% of 50 = 10
      expect(res.body.finalTotal).toBe(40.0); // 50 - 10 = 40
    });

    it('should calculate fixed EUR discount correctly (SAVE5EUR = €5 off)', async () => {
      const res = await request(app)
        .post('/api/promos/validate')
        .send({ code: 'SAVE5EUR', cartSubtotal: 30.0 });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.discountType).toBe('fixed');
      expect(res.body.discountAmount).toBe(5.0);
      expect(res.body.finalTotal).toBe(25.0); // 30 - 5 = 25
    });

    it('should return 400 when promo code is expired', async () => {
      // Add an expired promo
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      db.promos.set('prm-expired', {
        id: 'prm-expired',
        code: 'EXPIRED10',
        discountType: 'fixed',
        discountValue: 10,
        minCartAmount: 0,
        usageCount: 0,
        active: true,
        expiresAt: pastDate,
        createdAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/promos/validate')
        .send({ code: 'EXPIRED10', cartSubtotal: 30.0 });

      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.code).toBe('promo_expired');
      expect(res.body.message).toBe('Code expired');
    });

    it('should return 400 when max_uses limit is reached', async () => {
      db.promos.set('prm-maxed', {
        id: 'prm-maxed',
        code: 'MAXEDOUT',
        discountType: 'fixed',
        discountValue: 5,
        minCartAmount: 0,
        maxUses: 10,
        usageCount: 10, // fully used
        active: true,
        createdAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/promos/validate')
        .send({ code: 'MAXEDOUT', cartSubtotal: 20.0 });

      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.code).toBe('max_uses_reached');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. GET /api/drivers (LIST ACTIVE DRIVERS)
  // ══════════════════════════════════════════════════════════════════════════

  describe('3. GET /api/drivers', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/drivers');
      expect(res.status).toBe(401);
    });

    it('should return 403 when non-admin customer accesses drivers list', async () => {
      const res = await request(app)
        .get('/api/drivers')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to list all drivers with status, rating, and location', async () => {
      const res = await request(app)
        .get('/api/drivers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.drivers).toBeDefined();
      expect(res.body.drivers.length).toBeGreaterThanOrEqual(3);
      expect(res.body.drivers[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        phone: expect.any(String),
        vehicle: expect.any(String),
        status: expect.any(String),
        currentLocation: expect.objectContaining({
          lat: expect.any(Number),
          lng: expect.any(Number),
        }),
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. POST /api/drivers/:id/accept-order (DRIVER ACCEPTS DELIVERY)
  // ══════════════════════════════════════════════════════════════════════════

  describe('4. POST /api/drivers/:id/accept-order', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/drivers/drv-01/accept-order')
        .send({ orderId: 'ord-88329' });

      expect(res.status).toBe(401);
    });

    it('should return 403 when customer tries to accept order as driver', async () => {
      const res = await request(app)
        .post('/api/drivers/drv-01/accept-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: 'ord-88329' });

      expect(res.status).toBe(403);
    });

    it('should return 400 when orderId is missing', async () => {
      const res = await request(app)
        .post('/api/drivers/drv-01/accept-order')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('missing_order_id');
    });

    it('should return 404 when driver does not exist', async () => {
      const res = await request(app)
        .post('/api/drivers/drv-unknown-99/accept-order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderId: 'ord-88329' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('driver_not_found');
    });

    it('should allow driver to accept order, update status to dispatched, and emit socket event', async () => {
      const res = await request(app)
        .post('/api/drivers/drv-01/accept-order')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ orderId: 'ord-88329', eta: '18 mins' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('dispatched');
      expect(res.body.eta).toBe('18 mins');
      expect(res.body.driver.name).toBe('Josef Vella');

      // Verify order updated in DB
      const order = db.orders.get('ord-88329')!;
      expect(order.status).toBe('dispatched');
      expect(order.driverId).toBe('drv-01');

      // Verify driver status updated in DB
      const driver = db.drivers.get('drv-01')!;
      expect(driver.status).toBe('on_delivery');
      expect(driver.currentOrderId).toBe('ord-88329');

      // Verify socket broadcast
      expect(emittedEvents.some((e) => e.event === 'order:dispatched')).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. PATCH /api/drivers/:id/location (DRIVER GPS LIVE UPDATE)
  // ══════════════════════════════════════════════════════════════════════════

  describe('5. PATCH /api/drivers/:id/location', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .patch('/api/drivers/drv-01/location')
        .send({ latitude: 35.9122, longitude: 14.5042 });

      expect(res.status).toBe(401);
    });

    it('should return 400 when coordinates are missing or invalid', async () => {
      const res = await request(app)
        .patch('/api/drivers/drv-01/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ latitude: 999.0 }); // invalid latitude

      expect(res.status).toBe(400);
    });

    it('should update driver GPS coordinates and broadcast live socket location update', async () => {
      const res = await request(app)
        .patch('/api/drivers/drv-01/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ latitude: 35.915, longitude: 14.508 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.currentLocation).toEqual({ lat: 35.915, lng: 14.508 });

      // Verify DB update
      const driver = db.drivers.get('drv-01')!;
      expect(driver.currentLocation).toEqual({ lat: 35.915, lng: 14.508 });

      // Verify socket events
      expect(emittedEvents.some((e) => e.event === 'driver:location-update')).toBe(true);
      expect(emittedEvents.some((e) => e.event === 'driver:location_changed')).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. PATCH /api/orders/:id/status (DELIVERED STATUS & CONFIRMATION)
  // ══════════════════════════════════════════════════════════════════════════

  describe('6. PATCH /api/orders/:id/status (Mark Delivered)', () => {
    it('should update order to delivered, attach photo, release driver, emit socket, and return rating URL', async () => {
      // Driver was on delivery
      const driver = db.drivers.get('drv-01')!;
      driver.status = 'on_delivery';
      driver.currentOrderId = 'ord-88329';
      db.drivers.set('drv-01', driver);

      const photoUrl = 'https://res.cloudinary.com/desibolt/image/proof_88329.jpg';

      const res = await request(app)
        .patch('/api/orders/ord-88329/status')
        .send({ status: 'delivered', photoUrl });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('delivered');
      expect(res.body.deliveredAt).toBeDefined();
      expect(res.body.deliveryPhoto).toBe(photoUrl);
      expect(res.body.rating_url).toBe('https://desibolt.com/rate/DB-MLT-88329');

      // Verify DB state
      const order = db.orders.get('ord-88329')!;
      expect(order.status).toBe('delivered');
      expect(order.deliveryPhoto).toBe(photoUrl);

      // Verify driver was released to 'available'
      const updatedDriver = db.drivers.get('drv-01')!;
      expect(updatedDriver.status).toBe('available');
      expect(updatedDriver.currentOrderId).toBeNull();

      // Verify socket broadcast
      expect(emittedEvents.some((e) => e.event === 'order:delivered')).toBe(true);
    });

    it('should return 400 for invalid lifecycle status', async () => {
      const res = await request(app)
        .patch('/api/orders/ord-88329/status')
        .send({ status: 'invalid_status_xyz' });

      expect(res.status).toBe(400);
    });
  });
});
