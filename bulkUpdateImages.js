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

  // Strategy 1: Explicit DATABASE_URL if defined
  if (process.env.DATABASE_URL) {
    strategies.push({
      name: 'DATABASE_URL environment variable',
      config: { connectionString: process.env.DATABASE_URL }
    });
  }

  // Strategy 2: Unix domain socket (Linux / Ubuntu server default)
  if (process.platform === 'linux' && fs.existsSync('/var/run/postgresql')) {
    strategies.push({
      name: 'Unix Domain Socket (/var/run/postgresql)',
      config: { database: 'desibolt', host: '/var/run/postgresql', user: 'postgres' }
    });
  }

  // Strategy 3: Standard localhost with user credentials
  strategies.push({
    name: 'Localhost standard connection',
    config: {
      database: process.env.PGDATABASE || 'desibolt',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      host: process.env.PGHOST || '127.0.0.1',
      port: Number(process.env.PGPORT) || 5432
    }
  });

  // Strategy 4: Localhost without password
  strategies.push({
    name: 'Localhost default without password',
    config: {
      database: 'desibolt',
      user: 'postgres',
      host: '127.0.0.1',
      port: 5432
    }
  });

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

  throw new Error('Could not connect to PostgreSQL using standard connection methods. Please verify PostgreSQL is running or set DATABASE_URL.');
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
    skippedCount: 0,
    errorCount: 0,
    updatedProducts: [],
    skippedProducts: [],
    errors: []
  };

  try {
    // Step 3: Fetch existing products from DB
    console.log('📦 Fetching products table from database...');
    const dbRes = await client.query('SELECT id, sku, name, brand, image_url FROM products;');
    let dbProducts = dbRes.rows;
    console.log(`✅ Found ${dbProducts.length} existing products in database.\n`);

    console.log('🚀 Processing and matching products...');
    console.log('----------------------------------------------------------------');

    // Step 4: Begin Transaction
    await client.query('BEGIN');

    for (let i = 0; i < csvProducts.length; i++) {
      const item = csvProducts[i];
      const productName = item['Product Name'];
      const newImageUrl = item['Image URL'];

      if (!newImageUrl) {
        results.skippedCount++;
        results.skippedProducts.push({
          productName,
          brand: item['Brand'],
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
        results.skippedCount++;
        results.skippedProducts.push({
          productName,
          brand: item['Brand'],
          reason: 'No matching product found in DESI BOLT database table'
        });
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

  // Step 6: Save Results to JSON file
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(results, null, 2), 'utf8');

  // Step 7: Final Report
  console.log('================================================================');
  console.log('📊 FINAL BULK UPDATE SUMMARY REPORT');
  console.log('================================================================');
  console.log(`  • Total Products in CSV:     ${results.totalCsvRecords}`);
  console.log(`  • Successfully Updated:       ${results.updatedCount}`);
  console.log(`  • Skipped / Unmatched:        ${results.skippedCount}`);
  console.log(`  • Errors Encountered:         ${results.errorCount}`);
  console.log(`  • Full Report Saved To:       ${path.basename(OUTPUT_JSON_PATH)}`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
