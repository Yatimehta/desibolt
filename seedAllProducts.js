const fs = require('fs');
const path = require('path');
const pg = require('pg');
const { Pool } = pg;

async function run() {
  const pool = new Pool({
    database: 'desibolt',
    host: '/var/run/postgresql',
    user: 'postgres'
  });
  const client = await pool.connect();

  console.log('🌱 Seeding Indian Groceries + Lidl Catalog into PostgreSQL...');

  const productsRaw = fs.readFileSync(path.join(__dirname, 'client/src/data/products.ts'), 'utf8');
  
  // Extract products from TS file via regex
  const matches = productsRaw.matchAll(/\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*brand:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],(?:[\s\S]*?price:\s*([\d\.]+),)?(?:[\s\S]*?unit:\s*['"]([^'"]+)['"],)?(?:[\s\S]*?image:\s*['"]([^'"]+)['"],)?(?:[\s\S]*?stock:\s*(\d+),)?(?:[\s\S]*?description:\s*['"]([^'"]+)['"],)?(?:[\s\S]*?sku:\s*['"]([^'"]+)['"])?/g);

  let insertedCount = 0;
  await client.query('BEGIN');

  for (const m of matches) {
    const id = m[1];
    const name = m[2];
    const brand = m[3] || 'DESI BOLT';
    const category = m[4] || 'snacks-sweets';
    const price = parseFloat(m[5] || '3.50');
    const unit = m[6] || '1 unit';
    const image = m[7] || '';
    const stock = parseInt(m[8] || '100', 10);
    const desc = m[9] || '';
    const sku = m[10] || `DB-${id.toUpperCase()}`;

    await client.query(
      `INSERT INTO products 
        (sku, name, brand, category_id, price, unit, image_url, stock, rating, review_count, description, origin, is_organic, is_vegetarian, is_best_seller, vat_rate, is_active)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, 4.9, 150, $9, 'India', false, true, true, 0.00, true)
       ON CONFLICT (sku) DO UPDATE 
       SET name = EXCLUDED.name, brand = EXCLUDED.brand, image_url = EXCLUDED.image_url, price = EXCLUDED.price, updated_at = NOW();`,
      [sku, name, brand, category, price, unit, image, stock, desc]
    );
    insertedCount++;
  }

  await client.query('COMMIT');
  client.release();
  await pool.end();

  console.log(`✅ Seeded / updated ${insertedCount} core Indian grocery catalog products.`);
}

run().catch(console.error);
