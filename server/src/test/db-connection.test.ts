import { db } from '../db.js';

describe('DESI BOLT Database Connection & Query Test Suite', () => {
  beforeAll(() => {
    // Force in-memory DB mode for all tests
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    db.setConnectionState(true);
    db.resetDatabase();
  });

  it('should verify active database connection and return healthy metrics', async () => {
    const health = await db.getHealth();
    expect(health.status).toBe('connected');
    expect(health.database).toBe('desibolt_malta_pg');
    expect(health.latencyMs).toBeLessThan(100);
    expect(health.poolSize).toBeGreaterThanOrEqual(1);
  });

  it('should successfully execute parameterized query', async () => {
    const result = await db.query('SELECT * FROM products WHERE id = $1', ['fp-01']);
    expect(result.rowCount).toBeDefined();
  });

  it('should throw connection error when database goes offline', async () => {
    db.setConnectionState(false);

    await expect(db.query('SELECT 1')).rejects.toThrow('Database connection failed: ECONNREFUSED');
    
    const health = await db.getHealth();
    expect(health.status).toBe('disconnected');
  });

  it('should re-establish connection after recovery', async () => {
    db.setConnectionState(false);
    expect((await db.getHealth()).status).toBe('disconnected');

    // Recovery
    db.setConnectionState(true);
    const health = await db.getHealth();
    expect(health.status).toBe('connected');
  });
});
