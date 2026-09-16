import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db.js';
import { generateToken } from '../auth.js';

describe('DESI BOLT Error Handling & Edge Cases Test Suite', () => {
  let app: any;
  let adminToken: string;

  beforeAll(() => {
    // Force in-memory DB mode for all tests
    process.env.NODE_ENV = 'test';
    app = createApp();
    const adminUser = db.users.get('usr_admin_1')!;
    adminToken = generateToken(adminUser);
  });

  beforeEach(() => {
    db.resetDatabase();
  });

  it('should return 404 with structured error message for unknown endpoints', async () => {
    const res = await request(app).get('/api/unknown-service-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('should return 404 when querying non-existent product ID', async () => {
    const res = await request(app).get('/api/products/non-existent-sku-999');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found');
  });

  it('should return 404 when querying non-existent order ID', async () => {
    const res = await request(app).get('/api/orders/ord-non-existent-999');
    expect(res.status).toBe(404);
  });

  it('should return 400 when creating an order without items or delivery address', async () => {
    const res = await request(app).post('/api/orders').send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when requesting quantity exceeding product inventory stock', async () => {
    const res = await request(app).post('/api/cart/validate').send({
      items: [
        { productId: 'fp-01', quantity: 99999 } // Exceeds available stock
      ]
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Insufficient stock');
  });

  it('should return 400 when updating order with invalid lifecycle status', async () => {
    const res = await request(app)
      .patch('/api/orders/ord-88329/status')
      .send({ status: 'invalid_random_status' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid status');
  });

  it('should return 422 when admin attempts to create product with zero or negative price', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Free Item Bug',
        category: 'fresh-produce',
        price: -5.0,
        unit: '1 kg'
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain('greater than zero');
  });
});
