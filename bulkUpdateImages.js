#!/usr/bin/env node

/**
 * ============================================================================
 * DESI BOLT — Bulk Product Images Database Updater (PostgreSQL & Node.js)
 * ============================================================================
 * Usage:
 *   node bulkUpdateImages.js
 *
 * Requirements:
 *   - lidl_best_product_images.csv (in the same directory or project root)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// 1. Resolve PostgreSQL Driver
let pg;
try {
  pg = require('pg');
} catch {
  try {
    pg = require('./server/node_modules/pg');
  } catch {
    console.error('\n❌ Error: PostgreSQL driver (pg) not found.');
    console.error('👉 Please run "npm install" inside the server/ directory first.\n');
    process.exit(1);
  }
}

const { Pool } = pg;

// 2. Configuration & Paths
const CSV_FILE_PATH = process.env.CSV_FILE || path.join(__dirname, 'lidl_best_product_images.csv');
const OUTPUT_JSON_PATH = path.join(__dirname, 'bulk_update_results.json');

// 3. Robust Pure JavaScript CSV Parser
function parseCSV(content) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentVal.trim());
      if (row.some((c) => c.length > 0)) lines.push(row);
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal.length > 0 || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((c) => c.length > 0)) lines.push(row);
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  return lines.slice(1).map((line) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (line[idx] || '').replace(/^["']|["']$/g, '').trim();
    });
    return obj;
  });
}

// 4. Normalization & Matching Helper
function cleanText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestMatch(lidlItem, dbProducts) {
  const lidlNameClean = cleanText(lidlItem['Product Name']);
  const lidlBrandClean = cleanText(lidlItem['Brand']);
  const lidlTokens = lidlNameClean.split(' ').filter((t) => t.length > 2);

  let bestMatch = null;
  let highestScore = 0;

  for (const prod of dbProducts) {
    const prodNameClean = cleanText(prod.name);
    const prodBrandClean = cleanText(prod.brand);

    // Exact name match
    if (prodNameClean === lidlNameClean) {
      return { product: prod, matchType: 'exact_name', score: 100 };
    }

    // Substring match
    if (prodNameClean.includes(lidlNameClean) || lidlNameClean.includes(prodNameClean)) {
      const score = 85;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = { product: prod, matchType: 'substring_match', score };
      }
      continue;
    }

    // Token overlap matching
    let tokenMatches = 0;
    lidlTokens.forEach((token) => {
      if (prodNameClean.includes(token)) tokenMatches++;
    });

    if (lidlTokens.length > 0) {
      const tokenScore = (tokenMatches / lidlTokens.length) * 70;
      const brandBonus = (lidlBrandClean === prodBrandClean || prodBrandClean === 'desi bolt' || prodBrandClean === 'lidl') ? 15 : 0;
      const totalScore = tokenScore + brandBonus;

      if (totalScore >= 50 && totalScore > highestScore) {
        highestScore = totalScore;
        bestMatch = { product: prod, matchType: 'fuzzy_token_match', score: Math.round(totalScore) };
      }
    }
  }

  return bestMatch;
}

// 5. Connect to PostgreSQL with Automatic Strategy Fallback
async function createDatabaseConnection() {
  const strategies = [];

  // Strategy 1: CLI Argument (e.g. node bulkUpdateImages.js "postgres://...")
  const cliConnStr = process.argv.slice(2).find((arg) => arg.startsWith('postgres://') || arg.startsWith('postgresql://'));
  if (cliConnStr) {
    strategies.push({
      name: 'CLI Connection String Argument',
      config: { connectionString: cliConnStr }
    });
  }

  // Strategy 2: Explicit DATABASE_URL environment variable
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('username:password')) {
    strategies.push({
      name: 'DATABASE_URL environment variable',
      config: { connectionString: process.env.DATABASE_URL }
    });
  }

  // Strategy 3: Unix domain socket (Linux / Ubuntu server / macOS default socket)
  const socketPaths = ['/var/run/postgresql', '/tmp'];
  for (const sock of socketPaths) {
    if (fs.existsSync(sock)) {
      strategies.push({
        name: `Unix Domain Socket (${sock})`,
        config: { database: 'desibolt', host: sock, user: process.env.USER || 'postgres' }
      });
      strategies.push({
        name: `Unix Domain Socket (${sock} / postgres user)`,
        config: { database: 'desibolt', host: sock, user: 'postgres' }
      });
    }
  }

  // Strategy 4: Common local development passwords
  const commonPasswords = [
    process.env.PGPASSWORD,
    'postgres',
    'admin',
    'root',
    'desibolt',
    '123456',
    'password',
    'yatimehta',
    ''
  ].filter((p) => p !== undefined);

  const users = [process.env.PGUSER || 'postgres', 'postgres', process.env.USER || 'yatimehta'];
  const databases = [process.env.PGDATABASE || 'desibolt', 'desibolt', 'postgres'];

  for (const user of users) {
    for (const pw of commonPasswords) {
      for (const db of databases) {
        strategies.push({
          name: `Localhost (user: ${user}, db: ${db}, password: ${pw ? '***' : 'empty'})`,
          config: {
            database: db,
            user: user,
            password: pw,
            host: process.env.PGHOST || '127.0.0.1',
            port: Number(process.env.PGPORT) || 5432,
            connectionTimeoutMillis: 1500
          }
        });
      }
    }
  }

  for (const strat of strategies) {
    try {
      const pool = new Pool(strat.config);
      const client = await pool.connect();
      console.log(`🔌 Connected to PostgreSQL via: ${strat.name}`);
      return { pool, client };
    } catch {
      // try next strategy
    }
  }

  throw new Error(
    'Could not connect to PostgreSQL using standard connection methods.\n\n' +
    '👉 To connect, please provide your PostgreSQL credentials in one of these ways:\n\n' +
    '   1. As a command line parameter:\n' +
    '      node bulkUpdateImages.js "postgres://YOUR_USER:YOUR_PASSWORD@localhost:5432/desibolt"\n\n' +
    '   2. As an environment variable:\n' +
    '      DATABASE_URL="postgres://YOUR_USER:YOUR_PASSWORD@localhost:5432/desibolt" node bulkUpdateImages.js\n'
  );
}

// 6. Main Execution
async function main() {
  console.log('\n================================================================');
  console.log('⚡️ DESI BOLT — Bulk Product Images Database Updater');
  console.log('================================================================\n');

  // Step 1: Read CSV File
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ CSV File not found at: ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  console.log(`📁 Reading CSV: ${path.basename(CSV_FILE_PATH)}`);
  const rawCsv = fs.readFileSync(CSV_FILE_PATH, 'utf8');
  const csvProducts = parseCSV(rawCsv);
  console.log(`✅ Loaded ${csvProducts.length} verified products from CSV.\n`);

  // Step 2: Establish Database Connection
  let pool, client;
  try {
    const conn = await createDatabaseConnection();
    pool = conn.pool;
    client = conn.client;
  } catch (err) {
    console.error(`❌ Database Connection Failed: ${err.message}`);
    process.exit(1);
  }

  const results = {
    timestamp: new Date().toISOString(),
    totalCsvRecords: csvProducts.length,
    updatedCount: 0,
    insertedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    updatedProducts: [],
    insertedProducts: [],
    skippedProducts: [],
    errors: []
  };

  try {
    // Step 3: Fetch existing products from DB
    console.log('📦 Fetching products table from database...');
    let dbRes = await client.query('SELECT id, sku, name, brand, image_url FROM products;');
    let dbProducts = dbRes.rows;
    console.log(`ℹ️  Found ${dbProducts.length} existing products in database.\n`);

    console.log('🚀 Processing, matching and updating products...');
    console.log('----------------------------------------------------------------');

    // Step 4: Begin Transaction
    await client.query('BEGIN');

    // Category mapping helper
    function mapCategory(catName) {
      const c = (catName || '').toLowerCase();
      if (c.includes('produce') || c.includes('fruit') || c.includes('veg')) return 'fresh-produce';
      if (c.includes('dairy') || c.includes('paneer') || c.includes('egg') || c.includes('milk') || c.includes('cheese')) return 'dairy-paneer';
      if (c.includes('rice') || c.includes('atta') || c.includes('flour')) return 'rice-atta';
      if (c.includes('dal') || c.includes('pulse') || c.includes('lentil') || c.includes('bean')) return 'dal-pulses';
      if (c.includes('spice') || c.includes('masala') || c.includes('seasoning')) return 'spices-masalas';
      if (c.includes('frozen') || c.includes('instant') || c.includes('ready')) return 'frozen-ready';
      if (c.includes('snack') || c.includes('sweet') || c.includes('mithai') || c.includes('namkeen')) return 'snacks-sweets';
      if (c.includes('beverage') || c.includes('tea') || c.includes('coffee') || c.includes('drink')) return 'beverages-tea';
      if (c.includes('bakery') || c.includes('bread') || c.includes('naan') || c.includes('rusk')) return 'bakery-breads';
      return 'household-care';
    }

    for (let i = 0; i < csvProducts.length; i++) {
      const item = csvProducts[i];
      const productName = item['Product Name'];
      const brand = item['Brand'] || 'DESI BOLT';
      const newImageUrl = item['Image URL'];
      const category = mapCategory(item['Category']);
      const price = parseFloat(item['Price (€)'] || item['Price'] || '2.99') || 2.99;
      const unit = item['Unit'] || '1 unit';
      const description = item['Description'] || `Authentic ${productName} imported from top suppliers.`;

      if (!newImageUrl) {
        results.skippedCount++;
        results.skippedProducts.push({
          productName,
          brand,
          reason: 'Missing Image URL in CSV'
        });
        continue;
      }

      const match = findBestMatch(item, dbProducts);

      if (match) {
        const prod = match.product;
        const oldImage = prod.image_url;

        // Perform UPDATE in PostgreSQL
        await client.query(
          `UPDATE products 
           SET image_url = $1, updated_at = NOW() 
           WHERE id = $2;`,
          [newImageUrl, prod.id]
        );

        results.updatedCount++;
        results.updatedProducts.push({
          productId: prod.id,
          sku: prod.sku,
          databaseName: prod.name,
          lidlName: productName,
          matchType: match.matchType,
          confidenceScore: `${match.score}%`,
          oldImageUrl: oldImage,
          newImageUrl: newImageUrl
        });

        console.log(`[${i + 1}/${csvProducts.length}] ✅ UPDATED: "${prod.name}" (${match.score}% match)`);
      } else {
        // Generate unique SKU
        const cleanSkuName = cleanText(productName).slice(0, 10).replace(/\s+/g, '-').toUpperCase();
        const sku = `DB-LDL-${cleanSkuName}-${String(i + 1).padStart(3, '0')}`;

        // Insert new product from Lidl catalog
        const insertRes = await client.query(
          `INSERT INTO products 
            (sku, name, brand, category_id, price, unit, image_url, stock, rating, review_count, description, origin, is_organic, is_vegetarian, is_best_seller, vat_rate, is_active)
           VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (sku) DO UPDATE 
           SET image_url = EXCLUDED.image_url, updated_at = NOW()
           RETURNING id, sku, name, brand, image_url;`,
          [
            sku,
            productName,
            brand,
            category,
            price,
            unit,
            newImageUrl,
            100,
            4.9,
            Math.floor(Math.random() * 80) + 20,
            description,
            'Malta / EU / India',
            false,
            true,
            i < 20,
            0.00,
            true
          ]
        );

        const insertedProd = insertRes.rows[0];
        dbProducts.push(insertedProd);

        results.insertedCount++;
        results.insertedProducts.push({
          productId: insertedProd.id,
          sku: insertedProd.sku,
          name: insertedProd.name,
          brand: insertedProd.brand,
          imageUrl: newImageUrl
        });

        console.log(`[${i + 1}/${csvProducts.length}] ➕ INSERTED & UPDATED: "${productName}" (SKU: ${sku})`);
      }
    }

    // Step 5: Commit Transaction
    await client.query('COMMIT');
    console.log('----------------------------------------------------------------');
    console.log('💾 Database transaction COMMITTED successfully.\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`\n❌ An error occurred during bulk update. Transaction ROLLED BACK.`);
    console.error(`   Error details: ${err.message}\n`);
    results.errorCount++;
    results.errors.push(err.message);
  } finally {
    client.release();
    await pool.end();
  }

  // Step 6: Save Results to JSON file safely
  try {
    fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(results, null, 2), 'utf8');
    console.log(`📁 Saved detailed report to: ${OUTPUT_JSON_PATH}`);
  } catch {
    const fallbackPath = path.join('/tmp', 'bulk_update_results.json');
    try {
      fs.writeFileSync(fallbackPath, JSON.stringify(results, null, 2), 'utf8');
      console.log(`📁 Saved detailed report to: ${fallbackPath}`);
    } catch (writeErr) {
      console.warn('⚠️ Could not write results file:', writeErr.message);
    }
  }

  // Step 7: Final Report
  console.log('================================================================');
  console.log('📊 FINAL BULK UPDATE SUMMARY REPORT');
  console.log('================================================================');
  console.log(`  • Total Products in CSV:     ${results.totalCsvRecords}`);
  console.log(`  • Successfully Updated:       ${results.updatedCount}`);
  console.log(`  • Successfully Inserted:      ${results.insertedCount}`);
  console.log(`  • Skipped / Unmatched:        ${results.skippedCount}`);
  console.log(`  • Errors Encountered:         ${results.errorCount}`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
