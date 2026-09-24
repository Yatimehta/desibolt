import csv

csv_path = '/Users/yatimehta/DESI BOLT/lidl_best_product_images.csv'
sql_path = '/Users/yatimehta/DESI BOLT/scripts/update_lidl_product_images.sql'

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

def escape_sql(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

header_sql = """-- ============================================================================
-- DESI BOLT — PostgreSQL Lidl Product Images Match & Update Script
-- ============================================================================
-- Purpose:
--   1. Create staging table for the 316 Lidl verified product images.
--   2. Preview matches with DESI BOLT 'products' table (by Brand & Product Name).
--   3. Safely update 'products.image_url' inside a transaction (BEGIN ... COMMIT).
--   4. Run post-update verification and report metrics.
-- ============================================================================

-- Step 1: Create Staging Temporary Table
CREATE TEMP TABLE IF NOT EXISTS temp_lidl_images (
    product_name       TEXT,
    brand              TEXT,
    image_url          TEXT,
    image_description  TEXT
);

TRUNCATE TABLE temp_lidl_images;

-- Step 2: Load 316 Verified Products into Staging Table
INSERT INTO temp_lidl_images (product_name, brand, image_url, image_description) VALUES
"""

val_lines = []
for r in rows:
    p_name = escape_sql(r.get('Product Name', '').strip())
    p_brand = escape_sql(r.get('Brand', '').strip())
    p_img = escape_sql(r.get('Image URL', '').strip())
    p_desc = escape_sql(r.get('Image Description', '').strip())
    val_lines.append(f"({p_name}, {p_brand}, {p_img}, {p_desc})")

body_sql = ',\n'.join(val_lines) + ';\n\n'

footer_sql = """-- ============================================================================
-- Step 3: PREVIEW MATCHES (Before Making Any Changes)
-- ============================================================================
-- Shows matched items between DESI BOLT 'products' table and Lidl dataset:
SELECT 
    p.id AS product_id,
    p.sku,
    p.name AS current_desi_bolt_name,
    p.brand AS current_brand,
    p.image_url AS old_image_url,
    l.product_name AS lidl_matched_name,
    l.image_url AS new_lidl_image_url,
    l.image_description
FROM products p
JOIN temp_lidl_images l
    ON (
        LOWER(TRIM(p.brand)) = LOWER(TRIM(l.brand))
        OR l.brand = 'Lidl'
        OR p.brand = 'DESI BOLT'
    )
    AND (
        p.name ILIKE '%' || TRIM(l.product_name) || '%'
        OR l.product_name ILIKE '%' || TRIM(p.name) || '%'
    )
ORDER BY p.name ASC;

-- Summary of Match Counts
SELECT 
    (SELECT COUNT(*) FROM temp_lidl_images) AS total_lidl_products_in_csv,
    COUNT(DISTINCT p.id) AS matched_desi_bolt_products
FROM products p
JOIN temp_lidl_images l
    ON (
        LOWER(TRIM(p.brand)) = LOWER(TRIM(l.brand))
        OR l.brand = 'Lidl'
        OR p.brand = 'DESI BOLT'
    )
    AND (
        p.name ILIKE '%' || TRIM(l.product_name) || '%'
        OR l.product_name ILIKE '%' || TRIM(p.name) || '%'
    );


-- ============================================================================
-- Step 4: TRANSACTIONAL UPDATE
-- ============================================================================
BEGIN;

-- Perform the image_url update with updated_at timestamp
WITH matched_updates AS (
    SELECT DISTINCT ON (p.id)
        p.id AS product_id,
        l.image_url AS new_image_url
    FROM products p
    JOIN temp_lidl_images l
        ON (
            LOWER(TRIM(p.brand)) = LOWER(TRIM(l.brand))
            OR l.brand = 'Lidl'
            OR p.brand = 'DESI BOLT'
        )
        AND (
            p.name ILIKE '%' || TRIM(l.product_name) || '%'
            OR l.product_name ILIKE '%' || TRIM(p.name) || '%'
        )
    WHERE l.image_url IS NOT NULL AND l.image_url != ''
)
UPDATE products p
SET 
    image_url = mu.new_image_url,
    updated_at = NOW()
FROM matched_updates mu
WHERE p.id = mu.product_id;

-- ============================================================================
-- Step 5: VERIFICATION QUERIES (Review inside Transaction before COMMIT)
-- ============================================================================

-- Check updated products with their new URLs:
SELECT 
    p.id,
    p.sku,
    p.name,
    p.brand,
    p.image_url,
    p.updated_at
FROM products p
WHERE p.updated_at >= NOW() - INTERVAL '1 minute'
ORDER BY p.updated_at DESC
LIMIT 20;

-- Commit the transaction:
COMMIT;
-- Note: If you ever want to cancel after reviewing, run: ROLLBACK;

-- Clean up temporary staging table:
DROP TABLE IF EXISTS temp_lidl_images;

-- Final Status:
SELECT 'Lidl Product Images Migration Completed Successfully' AS status;
"""

with open(sql_path, 'w', encoding='utf-8') as f:
    f.write(header_sql + body_sql + footer_sql)

print(f"Successfully generated {sql_path}")
