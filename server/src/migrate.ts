/**
 * DESI BOLT — PostgreSQL Migration Runner
 * Run: npm run migrate
 * CI:  DATABASE_URL=... npm run migrate
 */

import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌  DATABASE_URL is not set. Set it in your .env file or environment.');
    process.exit(1);
  }

  // Locate migrate.sql (works from src/ or dist/)
  const candidates = [
    path.resolve(currentDir, '../../migrate.sql'),
    path.resolve(currentDir, '../migrate.sql'),
    path.resolve(process.cwd(), 'migrate.sql'),
  ];
  const migratePath = candidates.find((p) => fs.existsSync(p));

  if (!migratePath) {
    console.error('❌  migrate.sql not found. Expected at project root.');
    process.exit(1);
  }

  console.log(`📄  Reading migration from: ${migratePath}`);
  const sql = fs.readFileSync(migratePath, 'utf-8');

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  const client = await pool.connect().catch((err) => {
    console.error('❌  Could not connect to PostgreSQL:', err.message);
    process.exit(1);
  });

  try {
    console.log('🐘  Connected to PostgreSQL. Running migration…');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅  Migration applied successfully!');
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
