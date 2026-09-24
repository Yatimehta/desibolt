const fs = require('fs');
const path = require('path');

let pg;
try {
  pg = require('pg');
} catch {
  try {
    pg = require('./server/node_modules/pg');
  } catch {
    console.error('pg module not found');
    process.exit(1);
  }
}

const { Pool } = pg;

// All Authentic DESI BOLT Grocery Products
const authenticProducts = [
  // --- FAMOUS SNACKS & SWEETS ---
  {
    id: 'ss-01',
    sku: 'SS-HLD-ALU-01',
    name: "Haldiram's Aloo Bhujia",
    brand: 'Haldirams',
    category: 'snacks-sweets',
    price: 2.75,
    originalPrice: 3.20,
    unit: '400 g Pack',
    image: '/products/ss-01_haldirams_aloo_bhujia.png',
    stock: 120,
    rating: 4.9,
    reviewCount: 410,
    description: "Crispy spicy potato sev infused with mint, red chillies and secret spices. India's favorite teatime snack.",
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0.18
  },
  {
    id: 'ss-02',
    sku: 'SS-HLD-GJ-02',
    name: "Haldiram's Gulab Jamun (Tin)",
    brand: 'Haldirams',
    category: 'snacks-sweets',
    price: 5.50,
    originalPrice: 6.50,
    unit: '1 kg Tin (~16 pcs)',
    image: '/products/ss-02_haldirams_gulab_jamun.jpg',
    stock: 80,
    rating: 4.9,
    reviewCount: 290,
    description: 'Soft melt-in-the-mouth cottage cheese and milk solid dumplings soaked in rose and cardamom syrup.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0.18
  },

  // --- FAMOUS SPICES & MASALAS ---
  {
    id: 'sm-01',
    sku: 'SM-MDH-DEG-01',
    name: 'MDH Deggi Mirch (Chilli Powder)',
    brand: 'MDH',
    category: 'spices-masalas',
    price: 1.95,
    unit: '100 g Box',
    image: '/products/sm-01_mdh_deggi_mirch.jpg',
    stock: 140,
    rating: 4.9,
    reviewCount: 220,
    description: 'Unique blend of Kashmiri and red chillies providing vibrant glowing red color with mild heat.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'sm-02',
    sku: 'SM-EVR-GRM-02',
    name: 'Everest Shahi Garam Masala',
    brand: 'Everest',
    category: 'spices-masalas',
    price: 2.10,
    unit: '100 g Box',
    image: '/products/sm-02_everest_garam_masala.jpg',
    stock: 95,
    rating: 4.9,
    reviewCount: 140,
    description: 'Fine ground blend of 13 royal spices including cardamom, clove, cinnamon, and nutmeg.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'sm-03',
    sku: 'SM-ELA-POD-03',
    name: 'Green Cardamom Pods (Chhoti Elaichi)',
    brand: 'Kerala Harvest',
    category: 'spices-masalas',
    price: 4.25,
    unit: '100 g (8mm Jumbo)',
    image: '/products/sm-03_cardamom.jpg',
    stock: 60,
    rating: 5.0,
    reviewCount: 98,
    description: 'Grade-A whole green cardamom hand-picked from the hills of Munnar. Extra pungent and fragrant.',
    origin: 'India',
    isOrganic: true,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },

  // --- FAMOUS DAIRY & GHEE ---
  {
    id: 'dp-02',
    sku: 'DP-AML-GHE-02',
    name: 'Amul Pure Cow Ghee (Tin)',
    brand: 'Amul',
    category: 'dairy-paneer',
    price: 11.90,
    originalPrice: 13.50,
    unit: '1 L Tin',
    image: '/products/dp-02_amul_pure_ghee.jpg',
    stock: 60,
    rating: 5.0,
    reviewCount: 210,
    description: 'Traditional golden granulated cow ghee with rich natural aroma. Essential for tadka, sweets, and rotis.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'dp-01',
    sku: 'DP-AML-PAN-01',
    name: 'Amul Malai Fresh Paneer',
    brand: 'Amul',
    category: 'dairy-paneer',
    price: 3.49,
    originalPrice: 3.99,
    unit: '400 g Pack',
    image: '/products/dp-01_amul_paneer.jpg',
    stock: 75,
    rating: 4.9,
    reviewCount: 154,
    description: 'Super soft, creamy cottage cheese made from 100% pure milk. Melts in your mouth.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'dp-03',
    sku: 'DP-BEN-MLK-03',
    name: 'Benna Whole Fresh Milk (Maltese)',
    brand: 'Benna Malta',
    category: 'dairy-paneer',
    price: 1.15,
    unit: '1 L Carton',
    image: '/products/dp-03_benna_milk.jpg',
    stock: 120,
    rating: 4.8,
    reviewCount: 88,
    description: '100% pasteurized fresh Maltese whole cow milk delivered daily.',
    origin: 'Malta',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },

  // --- FAMOUS ATTA & BASMATI RICE ---
  {
    id: 'ar-01',
    sku: 'AR-ASH-ATT-10K',
    name: 'Aashirvaad Superior Sharbati Atta',
    brand: 'Aashirvaad',
    category: 'rice-atta',
    price: 14.50,
    originalPrice: 16.50,
    unit: '10 kg Bag',
    image: '/products/ar-01_aashirvaad_atta.jpg',
    stock: 90,
    rating: 4.9,
    reviewCount: 310,
    description: 'Chakki-ground from golden heavy grains of Madhya Pradesh Sharbati wheat. Rotis stay soft for hours.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'ar-02',
    sku: 'AR-DWT-RCE-02',
    name: 'Daawat Ultima Extra Long Basmati Rice',
    brand: 'Daawat',
    category: 'rice-atta',
    price: 15.80,
    originalPrice: 18.00,
    unit: '5 kg Bag',
    image: '/products/ar-02_daawat_basmati.jpg',
    stock: 80,
    rating: 4.9,
    reviewCount: 245,
    description: 'Aged for 2 years. Grains expand up to 24mm when cooked with magnificent aroma for royal Biryanis.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'ar-03',
    sku: 'AR-IG-RCE-03',
    name: 'India Gate Classic Basmati Rice',
    brand: 'India Gate',
    category: 'rice-atta',
    price: 14.20,
    unit: '5 kg Bag',
    image: '/products/ar-03_india_gate_basmati.jpg',
    stock: 65,
    rating: 4.8,
    reviewCount: 160,
    description: "The world's most celebrated Basmati grain. Fluffy, non-sticky and deeply fragrant.",
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },

  // --- FAMOUS CHAI & BEVERAGES ---
  {
    id: 'bv-01',
    sku: 'BV-WB-TEA-1K',
    name: 'Wagh Bakri Premium CTC Tea',
    brand: 'Wagh Bakri',
    category: 'beverages-tea',
    price: 6.95,
    originalPrice: 7.95,
    unit: '1 kg Pack',
    image: '/products/bv-01_wagh_bakri_tea.jpg',
    stock: 95,
    rating: 4.9,
    reviewCount: 320,
    description: 'Renowned strong blend of premium Assam tea leaves delivering deep color and robust aroma.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'bv-02',
    sku: 'BV-FRT-6PK-02',
    name: 'Frooti Mango Drink (Pack of 6)',
    brand: 'Parle Agro',
    category: 'beverages-tea',
    price: 4.50,
    unit: '6 x 200ml Tetra',
    image: '/products/bv-02_frooti.jpg',
    stock: 85,
    rating: 4.8,
    reviewCount: 115,
    description: 'Rich and refreshing Totapuri mango nectar drink enjoyed ice cold on sunny Malta days.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0.18
  },

  // --- DALS & PULSES ---
  {
    id: 'dl-01',
    sku: 'DL-TAT-TUR-01',
    name: 'Tata Sampann Unpolished Toor Dal',
    brand: 'Tata Sampann',
    category: 'dal-pulses',
    price: 3.20,
    originalPrice: 3.75,
    unit: '1 kg',
    image: '/products/dl-01_tata_toor_dal.jpg',
    stock: 110,
    rating: 4.9,
    reviewCount: 178,
    description: 'Unpolished split pigeon peas naturally high in protein, unadulterated with water, oil or stone polishing.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'dl-02',
    sku: 'DL-24M-MNG-02',
    name: 'Organic Whole Moong Dal (Green Gram)',
    brand: '24 Mantra Organic',
    category: 'dal-pulses',
    price: 2.95,
    unit: '1 kg',
    image: '/products/dl-02_organic_moong.jpg',
    stock: 70,
    rating: 4.8,
    reviewCount: 65,
    description: 'Certified 100% organic whole green gram. Ideal for sprouting, dal tadka, and healthy khichdi.',
    origin: 'India',
    isOrganic: true,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },
  {
    id: 'dl-03',
    sku: 'DL-DES-CHN-03',
    name: 'Desi Brown Chana / Kala Chana',
    brand: 'Desi Direct',
    category: 'dal-pulses',
    price: 2.40,
    unit: '1 kg',
    image: '/products/dl-03_kala_chana.jpg',
    stock: 85,
    rating: 4.7,
    reviewCount: 52,
    description: 'Nutrient-packed whole brown chickpeas. High fiber and iron, perfect for prashad and rich curries.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },

  // --- FROZEN & READY ---
  {
    id: 'ff-01',
    sku: 'FF-HLD-SAM-01',
    name: "Haldiram's Punjabi Samosa (Frozen)",
    brand: 'Haldirams',
    category: 'frozen-ready',
    price: 4.95,
    originalPrice: 5.80,
    unit: 'Pack of 8 (650g)',
    image: '/products/ff-01_haldirams_samosa.jpg',
    stock: 55,
    rating: 4.9,
    reviewCount: 310,
    description: 'Crisp pastry stuffed with spiced potato and green peas, includes tangy mint and tamarind chutneys.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0.18
  },
  {
    id: 'ff-02',
    sku: 'FF-SHN-ALU-02',
    name: 'Shana Aloo Paratha (Frozen)',
    brand: 'Shana',
    category: 'frozen-ready',
    price: 3.80,
    unit: 'Pack of 4 (400g)',
    image: '/products/ff-02_paratha.jpg',
    stock: 65,
    rating: 4.8,
    reviewCount: 130,
    description: 'Authentic layered whole wheat parathas stuffed with seasoned mashed potatoes.',
    origin: 'UK / India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },

  // --- BAKERY & BREADS ---
  {
    id: 'bb-01',
    sku: 'BB-NAAN-GAR-01',
    name: 'Fresh Tandoori Garlic Naan',
    brand: 'Desi Bolt Bakery',
    category: 'bakery-breads',
    price: 2.50,
    unit: 'Pack of 3',
    image: '/products/bb-01_garlic_naan.jpg',
    stock: 60,
    rating: 4.9,
    reviewCount: 180,
    description: 'Clay-oven baked fresh daily in Malta, brushed with melted butter, roasted garlic and fresh coriander.',
    origin: 'Malta',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'bb-02',
    sku: 'BB-BRT-RSK-02',
    name: 'Britannia Premium Elaichi Rusk',
    brand: 'Britannia',
    category: 'bakery-breads',
    price: 2.25,
    unit: '400 g Pack',
    image: '/products/bb-02_britannia_rusk.jpg',
    stock: 90,
    rating: 4.8,
    reviewCount: 95,
    description: 'Twice-baked crispy wheat toasts subtly flavored with real green cardamom. Made for morning chai dipping.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },

  // --- FRESH PRODUCE ---
  {
    id: 'fp-01',
    sku: 'FP-TOM-MLT-01',
    name: 'Maltese Farm Fresh Tomatoes',
    brand: 'Malta Fresh Farms',
    category: 'fresh-produce',
    price: 1.85,
    originalPrice: 2.20,
    unit: '1 kg',
    image: '/products/fp-01_tomatoes.jpg',
    stock: 140,
    rating: 4.8,
    reviewCount: 94,
    description: 'Vine-ripened, locally grown juicy Maltese red tomatoes. Perfect for curries, salads, and fresh salsa.',
    origin: 'Malta',
    isOrganic: true,
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0
  },
  {
    id: 'fp-02',
    sku: 'FP-COR-02',
    name: 'Fresh Coriander (Cilantro / Dhaniya)',
    brand: 'Malta Green Farms',
    category: 'fresh-produce',
    price: 0.95,
    unit: '1 Bunch (~150g)',
    image: '/products/fp-02_coriander.jpg',
    stock: 85,
    rating: 4.9,
    reviewCount: 120,
    description: 'Crisp, highly aromatic fresh coriander leaves for garnishing and chutney.',
    origin: 'Malta',
    isOrganic: true,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },
  {
    id: 'fp-03',
    sku: 'FP-CHL-03',
    name: 'Indian Green Chillies (Hari Mirch)',
    brand: 'Desi Direct',
    category: 'fresh-produce',
    price: 1.45,
    unit: '250 g',
    image: '/products/fp-03_green_chillies.jpg',
    stock: 95,
    rating: 4.7,
    reviewCount: 65,
    description: 'Pungent, spicy fresh Indian green chillies with sharp heat and vibrant aroma.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },
  {
    id: 'fp-04',
    sku: 'FP-GIN-04',
    name: 'Fresh Ginger Root (Adrak)',
    brand: 'Desi Direct',
    category: 'fresh-produce',
    price: 1.80,
    originalPrice: 2.10,
    unit: '500 g',
    image: '/products/fp-04_ginger.jpg',
    stock: 60,
    rating: 4.8,
    reviewCount: 42,
    description: 'Plump, fiber-rich fresh ginger root for daily chai, curries, and remedies.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },
  {
    id: 'fp-05',
    sku: 'FP-OKR-05',
    name: 'Fresh Okra / Bhindi (Lady Finger)',
    brand: 'Malta Fresh Farms',
    category: 'fresh-produce',
    price: 2.80,
    originalPrice: 3.20,
    unit: '500 g',
    image: '/products/fp-05_okra.jpg',
    stock: 45,
    rating: 4.9,
    reviewCount: 88,
    description: 'Tender, crisp young green bhindi. Great for kurkuri bhindi or stuffed masala okra.',
    origin: 'Malta',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },
  {
    id: 'fp-06',
    sku: 'FP-MNG-ALPH-06',
    name: 'Alphonso Mangoes (Imported Box)',
    brand: 'Ratnagiri Gold',
    category: 'fresh-produce',
    price: 18.50,
    originalPrice: 22.00,
    unit: 'Box of 6 (~1.8 kg)',
    image: '/products/fp-06_alphonso_mango.jpg',
    stock: 25,
    rating: 5.0,
    reviewCount: 110,
    description: 'Air-flown GI-tagged Ratnagiri Alphonso mangoes. Incomparable sweetness and floral bouquet.',
    origin: 'India',
    isOrganic: true,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0
  },

  // --- HOUSEHOLD & CARE ---
  {
    id: 'hc-01',
    sku: 'HC-ZED-INC-01',
    name: 'Zed Black Premium Agarbatti (Incense)',
    brand: 'Zed Black',
    category: 'household-care',
    price: 2.10,
    unit: 'Pack of 120 Sticks',
    image: '/products/hc-01_agarbatti.jpg',
    stock: 80,
    rating: 4.9,
    reviewCount: 75,
    description: 'Sandalwood and Champa infused long-burning incense sticks for a peaceful, divine home aroma.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0.18
  },
  {
    id: 'hc-02',
    sku: 'HC-MDM-SOP-02',
    name: 'Medimix Ayurvedic 18-Herb Soap',
    brand: 'Medimix',
    category: 'household-care',
    price: 3.50,
    unit: 'Pack of 3 (125g each)',
    image: '/products/hc-02_medimix_soap.jpg',
    stock: 70,
    rating: 4.8,
    reviewCount: 110,
    description: 'Time-tested Ayurvedic classic formulation enriched with 18 herbs to nourish and protect skin naturally.',
    origin: 'India',
    isOrganic: false,
    isVegetarian: true,
    isBestSeller: false,
    vatRate: 0.18
  }
];

async function main() {
  console.log('🚀 Importing Clean Authentic DESI BOLT Grocery Catalog into PostgreSQL...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:desibolt_pg_pwd_2026@127.0.0.1:5432/desibolt'
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM products;');

    for (const p of authenticProducts) {
      await client.query(
        `INSERT INTO products 
          (sku, name, brand, category_id, price, original_price, unit, image_url, stock, rating, review_count, description, origin, is_organic, is_vegetarian, is_best_seller, vat_rate, is_active)
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, true);`,
        [
          p.sku,
          p.name,
          p.brand,
          p.category,
          p.price,
          p.originalPrice || null,
          p.unit,
          p.image,
          p.stock,
          p.rating,
          p.reviewCount,
          p.description,
          p.origin,
          p.isOrganic,
          p.isVegetarian,
          p.isBestSeller,
          p.vatRate
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully imported ${authenticProducts.length} authentic products into PostgreSQL!\n`);

    const res = await client.query('SELECT count(*) as total FROM products;');
    console.log(`📊 Total Products in DB:`, res.rows[0].total);

    const sample = await client.query('SELECT name, brand, price, unit, image_url FROM products ORDER BY name ASC;');
    console.table(sample.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
