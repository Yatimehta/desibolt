import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db.js';

describe('DESI BOLT Authentication & Authorization Test Suite', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    db.resetDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new customer with hashed password and return valid JWT', async () => {
      const payload = {
        name: 'Graziella Vella',
        email: 'graziella@desibolt.mt',
        password: 'SecurePassword123!',
        phone: '+356 9988 7766'
      };

      const res = await request(app).post('/api/auth/register').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('graziella@desibolt.mt');
      expect(res.body.user.role).toBe('customer');

      // Verify user in database has hashed password, not plaintext
      const savedUser = (Array.from(db.users.values()) as any[]).find((u: any) => u.email === 'graziella@desibolt.mt');
      expect(savedUser).toBeDefined();
      expect(savedUser?.passwordHash).not.toBe('SecurePassword123!');
    });

    it('should reject registration if email is already taken with 409 Conflict', async () => {
      const payload = {
        name: 'Duplicate Alex',
        email: 'alex@example.com.mt', // Existing seeded email
        password: 'Password123'
      };

      const res = await request(app).post('/api/auth/register').send(payload);
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('should validate email format and minimum password length with 422', async () => {
      const invalidPayload = {
        name: 'Invalid Test',
        email: 'not-an-email',
        password: '123' // < 6 chars
      };

      const res = await request(app).post('/api/auth/register').send(invalidPayload);
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login seeded user with correct password and return JWT', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'alex@example.com.mt',
        password: 'DesiBolt@2026'
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('alex@example.com.mt');
    });

    it('should reject login with incorrect password with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'alex@example.com.mt',
        password: 'WrongPassword999'
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    });

    it('should reject login for non-existent email with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@example.com',
        password: 'AnyPassword'
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile (Protected Route)', () => {
    it('should allow access with valid Bearer token', async () => {
      // First login
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'admin@desibolt.com',
        password: 'DesiBolt@2026'
      });
      const token = loginRes.body.token;

      // Access profile
      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.user.email).toBe('admin@desibolt.com');
      expect(profileRes.body.user.role).toBe('admin');
    });

    it('should block access without Bearer token with 401', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    it('should block access with malformed/tampered token with 403', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_tampered_jwt_token');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Invalid authentication token');
    });
  });
});
