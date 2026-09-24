import { Product } from '../types';

export const BASE_PRODUCTS: Product[] = [
  // --- FAMOUS SNACKS & SWEETS ---
  {
    id: 'ss-01',
    name: "Haldiram's Aloo Bhujia",
    brand: 'Haldirams',
    category: 'snacks-sweets',
    subCategory: 'Namkeen',
    price: 2.75,
    originalPrice: 3.20,
    unit: '400 g Pack',
    image: '/products/ss-01_haldirams_aloo_bhujia.png',
    stock: 120,
    inStock: true,
    rating: 4.9,
    reviewCount: 410,
    description: "Crispy spicy potato sev infused with mint, red chillies and secret spices. India's favorite teatime snack.",
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    isFeatured: true,
    vatRate: 0.18,
    sku: 'SS-HLD-ALU-01',
    reviews: [
      { id: 'r1', userName: 'Rahul Gupta', rating: 5, comment: 'Super crispy and fresh! Authentic Haldiram taste.', date: '1 day ago', verified: true }
    ]
  },
  {
    id: 'ss-02',
    name: "Haldiram's Gulab Jamun (Tin)",
    brand: 'Haldirams',
    category: 'snacks-sweets',
    subCategory: 'Mithai',
    price: 5.50,
    originalPrice: 6.50,
    unit: '1 kg Tin (~16 pcs)',
    image: '/products/ss-02_haldirams_gulab_jamun.jpg',
    stock: 80,
    inStock: true,
    rating: 4.9,
    reviewCount: 290,
    description: 'Soft melt-in-the-mouth cottage cheese and milk solid dumplings soaked in rose and cardamom syrup.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    discountPercent: 15,
    vatRate: 0.18,
    sku: 'SS-HLD-GJ-02'
  },

  // --- FAMOUS SPICES & MASALAS ---
  {
    id: 'sm-01',
    name: 'MDH Deggi Mirch (Chilli Powder)',
    brand: 'MDH',
    category: 'spices-masalas',
    subCategory: 'Ground Spices',
    price: 1.95,
    unit: '100 g Box',
    image: '/products/sm-01_mdh_deggi_mirch.jpg',
    stock: 140,
    inStock: true,
    rating: 4.9,
    reviewCount: 220,
    description: 'Unique blend of Kashmiri and red chillies providing vibrant glowing red color with mild heat.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    isFeatured: true,
    vatRate: 0,
    sku: 'SM-MDH-DEG-01'
  },
  {
    id: 'sm-02',
    name: 'Everest Shahi Garam Masala',
    brand: 'Everest',
    category: 'spices-masalas',
    subCategory: 'Blended Masalas',
    price: 2.10,
    unit: '100 g Box',
    image: '/products/sm-02_everest_garam_masala.jpg',
    stock: 95,
    inStock: true,
    rating: 4.9,
    reviewCount: 140,
    description: 'Fine ground blend of 13 royal spices including cardamom, clove, cinnamon, and nutmeg.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0,
    sku: 'SM-EVR-GRM-02'
  },
  {
    id: 'sm-03',
    name: 'Green Cardamom Pods (Chhoti Elaichi)',
    brand: 'Kerala Harvest',
    category: 'spices-masalas',
    subCategory: 'Whole Spices',
    price: 5.80,
    originalPrice: 6.90,
    unit: '100 g (8mm Jumbo)',
    image: '/products/sm-03_cardamom.jpg',
    stock: 45,
    inStock: true,
    rating: 5.0,
    reviewCount: 89,
    description: 'Jumbo whole green cardamom from Idukki, Kerala. Intense essential oils for tea and biryani.',
    origin: 'India',
    isVegetarian: true,
    vatRate: 0,
    sku: 'SM-KRL-ELC-03'
  },

  // --- FAMOUS DAIRY & GHEE ---
  {
    id: 'dp-02',
    name: 'Amul Pure Cow Ghee (Tin)',
    brand: 'Amul',
    category: 'dairy-paneer',
    subCategory: 'Ghee & Butter',
    price: 11.90,
    originalPrice: 13.50,
    unit: '1 L Tin',
    image: '/products/dp-02_amul_pure_ghee.jpg',
    stock: 60,
    inStock: true,
    rating: 5.0,
    reviewCount: 210,
    description: 'Traditional golden granulated cow ghee with rich natural aroma. Ideal for rotis and sweets.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    isFeatured: true,
    discountPercent: 12,
    vatRate: 0,
    sku: 'DP-AML-GHE-02'
  },
  {
    id: 'dp-01',
    name: 'Amul Malai Fresh Paneer',
    brand: 'Amul',
    category: 'dairy-paneer',
    subCategory: 'Paneer & Cheese',
    price: 3.49,
    originalPrice: 3.99,
    unit: '400 g Pack',
    image: '/products/dp-01_amul_paneer.jpg',
    stock: 75,
    inStock: true,
    rating: 4.9,
    reviewCount: 154,
    description: 'Super soft, creamy cottage cheese made from 100% pure milk. Melts in your mouth.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0,
    sku: 'DP-AML-PAN-01'
  },
  {
    id: 'dp-03',
    name: 'Benna Whole Fresh Milk (Maltese)',
    brand: 'Benna Malta',
    category: 'dairy-paneer',
    subCategory: 'Milk',
    price: 1.15,
    unit: '1 L Carton',
    image: '/products/dp-03_benna_milk.jpg',
    stock: 120,
    inStock: true,
    rating: 4.8,
    reviewCount: 88,
    description: '100% pasteurized fresh Maltese whole cow milk delivered daily.',
    origin: 'Malta',
    isVegetarian: true,
    vatRate: 0,
    sku: 'DP-BEN-MLK-03'
  },

  // --- FAMOUS ATTA & BASMATI RICE ---
  {
    id: 'ar-01',
    name: 'Aashirvaad Superior Sharbati Atta',
    brand: 'Aashirvaad',
    category: 'rice-atta',
    subCategory: 'Whole Wheat Atta',
    price: 14.50,
    originalPrice: 16.50,
    unit: '10 kg Bag',
    image: '/products/ar-01_aashirvaad_atta.jpg',
    stock: 90,
    inStock: true,
    rating: 4.9,
    reviewCount: 310,
    description: 'Chakki-ground from golden heavy grains of Madhya Pradesh Sharbati wheat. Rotis stay soft for hours.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    isFeatured: true,
    discountPercent: 12,
    vatRate: 0,
    sku: 'AR-ASH-ATT-10K'
  },
  {
    id: 'ar-02',
    name: 'Daawat Ultima Extra Long Basmati Rice',
    brand: 'Daawat',
    category: 'rice-atta',
    subCategory: 'Basmati Rice',
    price: 15.80,
    originalPrice: 18.00,
    unit: '5 kg Bag',
    image: '/products/ar-02_daawat_basmati.jpg',
    stock: 80,
    inStock: true,
    rating: 4.9,
    reviewCount: 245,
    description: 'Aged for 2 years. Grains expand up to 24mm when cooked with magnificent aroma for royal Biryanis.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0,
    sku: 'AR-DWT-RCE-02'
  },
  {
    id: 'ar-03',
    name: 'India Gate Classic Basmati Rice',
    brand: 'India Gate',
    category: 'rice-atta',
    subCategory: 'Basmati Rice',
    price: 14.20,
    unit: '5 kg Bag',
    image: '/products/ar-03_india_gate_basmati.jpg',
    stock: 65,
    inStock: true,
    rating: 4.8,
    reviewCount: 160,
    description: "The world's most celebrated Basmati grain. Fluffy, non-sticky and deeply fragrant.",
    origin: 'India',
    isVegetarian: true,
    vatRate: 0,
    sku: 'AR-IG-RCE-03'
  },

  // --- FAMOUS CHAI & BEVERAGES ---
  {
    id: 'bv-01',
    name: 'Wagh Bakri Premium CTC Tea',
    brand: 'Wagh Bakri',
    category: 'beverages-tea',
    subCategory: 'Tea',
    price: 6.95,
    originalPrice: 7.95,
    unit: '1 kg Pack',
    image: '/products/bv-01_wagh_bakri_tea.jpg',
    stock: 95,
    inStock: true,
    rating: 4.9,
    reviewCount: 320,
    description: 'Renowned strong blend of premium Assam tea leaves delivering deep color and robust aroma.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    isFeatured: true,
    vatRate: 0,
    sku: 'BV-WB-TEA-1K'
  },
  {
    id: 'bv-02',
    name: 'Frooti Mango Drink (Pack of 6)',
    brand: 'Parle Agro',
    category: 'beverages-tea',
    subCategory: 'Cold Drinks',
    price: 4.50,
    unit: '6 x 200ml Tetra',
    image: '/products/bv-02_frooti.jpg',
    stock: 85,
    inStock: true,
    rating: 4.8,
    reviewCount: 115,
    description: 'Rich and refreshing Totapuri mango nectar drink enjoyed ice cold on sunny Malta days.',
    origin: 'India',
    isVegetarian: true,
    vatRate: 0.18,
    sku: 'BV-FRT-6PK-02'
  },

  // --- DALS & PULSES ---
  {
    id: 'dl-01',
    name: 'Tata Sampann Unpolished Toor Dal',
    brand: 'Tata Sampann',
    category: 'dal-pulses',
    subCategory: 'Lentils',
    price: 3.20,
    originalPrice: 3.75,
    unit: '1 kg',
    image: '/products/dl-01_tata_toor_dal.jpg',
    stock: 110,
    inStock: true,
    rating: 4.9,
    reviewCount: 178,
    description: 'Unpolished split pigeon peas naturally high in protein, unadulterated with water, oil or stone polishing.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0,
    sku: 'DL-TAT-TUR-01'
  },
  {
    id: 'dl-02',
    name: 'Organic Whole Moong Dal (Green Gram)',
    brand: '24 Mantra Organic',
    category: 'dal-pulses',
    subCategory: 'Organic Pulses',
    price: 2.95,
    unit: '1 kg',
    image: '/products/dl-02_organic_moong.jpg',
    stock: 70,
    inStock: true,
    rating: 4.8,
    reviewCount: 65,
    description: 'Certified 100% organic whole green gram. Ideal for sprouting, dal tadka, and healthy khichdi.',
    origin: 'India',
    isOrganic: true,
    isVegetarian: true,
    vatRate: 0,
    sku: 'DL-24M-MNG-02'
  },
  {
    id: 'dl-03',
    name: 'Desi Brown Chana / Kala Chana',
    brand: 'Desi Direct',
    category: 'dal-pulses',
    subCategory: 'Chickpeas',
    price: 2.40,
    unit: '1 kg',
    image: '/products/dl-03_kala_chana.jpg',
    stock: 85,
    inStock: true,
    rating: 4.7,
    reviewCount: 52,
    description: 'Nutrient-packed whole brown chickpeas. High fiber and iron, perfect for prashad and rich curries.',
    origin: 'India',
    isVegetarian: true,
    vatRate: 0,
    sku: 'DL-DES-CHN-03'
  },

  // --- FROZEN & READY ---
  {
    id: 'ff-01',
    name: "Haldiram's Punjabi Samosa (Frozen)",
    brand: 'Haldirams',
    category: 'frozen-ready',
    subCategory: 'Frozen Snacks',
    price: 4.95,
    originalPrice: 5.80,
    unit: 'Pack of 8 (650g)',
    image: '/products/ff-01_haldirams_samosa.jpg',
    stock: 55,
    inStock: true,
    rating: 4.9,
    reviewCount: 310,
    description: 'Crisp pastry stuffed with spiced potato and green peas, includes tangy mint and tamarind chutneys.',
    origin: 'India',
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0.18,
    sku: 'FF-HLD-SAM-01'
  },
  {
    id: 'ff-02',
    name: 'Shana Aloo Paratha (Frozen)',
    brand: 'Shana',
    category: 'frozen-ready',
    subCategory: 'Frozen Breads',
    price: 3.80,
    unit: 'Pack of 4 (400g)',
    image: '/products/ff-02_paratha.jpg',
    stock: 65,
    inStock: true,
    rating: 4.8,
    reviewCount: 130,
    description: 'Authentic layered whole wheat parathas stuffed with seasoned mashed potatoes.',
    origin: 'UK / India',
    isVegetarian: true,
    vatRate: 0,
    sku: 'FF-SHN-ALU-02'
  },

  // --- BAKERY & BREADS ---
  {
    id: 'bb-01',
    name: 'Fresh Tandoori Garlic Naan',
    brand: 'Desi Bolt Bakery',
    category: 'bakery-breads',
    subCategory: 'Fresh Breads',
    price: 2.50,
    unit: 'Pack of 3',
    image: '/products/bb-01_garlic_naan.jpg',
    stock: 60,
    inStock: true,
    rating: 4.9,
    reviewCount: 180,
    description: 'Clay-oven baked fresh daily in Malta, brushed with melted butter, roasted garlic and fresh coriander.',
    origin: 'Malta',
    isVegetarian: true,
    isBestSeller: true,
    vatRate: 0,
    sku: 'BB-NAAN-GAR-01'
  },
  {
    id: 'bb-02',
    name: 'Britannia Premium Elaichi Rusk',
    brand: 'Britannia',
    category: 'bakery-breads',
    subCategory: 'Rusks & Cookies',
    price: 2.25,
    unit: '400 g Pack',
    image: '/products/bb-02_britannia_rusk.jpg',
    stock: 90,
    inStock: true,
    rating: 4.8,
    reviewCount: 95,
    description: 'Twice-baked crispy wheat toasts subtly flavored with real green cardamom. Made for morning chai dipping.',
    origin: 'India',
    isVegetarian: true,
    vatRate: 0,
    sku: 'BB-BRT-RSK-02'
  },

  // --- FRESH PRODUCE ---
  {
    id: 'fp-01',
    name: 'Maltese Farm Fresh Tomatoes',
    brand: 'Malta Fresh Farms',
    category: 'fresh-produce',
    subCategory: 'Vegetables',
    price: 1.85,
    originalPrice: 2.20,
    unit: '1 kg',
    image: '/products/fp-01_tomatoes.jpg',
    stock: 140,
    inStock: true,
    rating: 4.8,
    reviewCount: 94,
    description: 'Vine-ripened, locally grown juicy Maltese red tomatoes. Perfect for curries, salads, and fresh salsa.',
    origin: 'Malta',
    isOrganic: true,
    isVegetarian: true,
    isBestSeller: true,
    discountPercent: 15,
    vatRate: 0,
    sku: 'FP-TOM-MLT-01'
  },
  {
    id: 'fp-02',
    name: 'Fresh Coriander (Cilantro / Dhaniya)',
    brand: 'Malta Green Farms',
    category: 'fresh-produce',
    subCategory: 'Herbs',
    price: 0.95,
    unit: '1 Bunch (~150g)',
    image: '/products/fp-02_coriander.jpg',
    stock: 85,
    inStock: true,
    rating: 4.9,
    reviewCount: 120,
    description: 'Crisp, highly aromatic fresh coriander leaves for garnishing and chutney.',
    origin: 'Malta',
    isOrganic: true,
    isVegetarian: true,
    vatRate: 0,
    sku: 'FP-COR-02'
  },
  {
    id: 'fp-03',
    name: 'Indian Green Chillies (Hari Mirch)',
    brand: 'Desi Direct',
    category: 'fresh-produce',
    subCategory: 'Vegetables',
    price: 1.45,
    unit: '250 g',
    image: '/products/fp-03_green_chillies.jpg',
    stock: 95,
    inStock: true,
    rating: 4.7,
    reviewCount: 65,
    description: 'Pungent, spicy fresh Indian green chillies with sharp heat and vibrant aroma.',
    origin: 'India',
    isVegetarian: true,
    vatRate: 0,
    sku: 'FP-CHL-03'
  },
  {
    id: 'fp-04',
    name: 'Fresh Ginger Root (Adrak)',
    brand: 'Desi Direct',
    category: 'fresh-produce',
    subCategory: 'Vegetables',
    price: 1.80,
    originalPrice: 2.10,
    unit: '500 g',
    image: '/products/fp-04_ginger.jpg',
    stock: 60,
    inStock: true,
    rating: 4.8,
    reviewCount: 42,
    description: 'Plump, fiber-rich fresh ginger root for daily chai, curries, and remedies.',
    origin: 'India',
    isVegetarian: true,
    vatRate: 0,
    sku: 'FP-GIN-04'
  },
  {
    id: 'fp-05',
    name: 'Fresh Okra / Bhindi (Lady Finger)',
    brand: 'Malta Fresh Farms',
    category: 'fresh-produce',
    subCategory: 'Vegetables',
    price: 2.80,
    originalPrice: 3.20,
    unit: '500 g',
    image: '/products/fp-05_okra.jpg',
    stock: 45,
    inStock: true,
    rating: 4.9,
    reviewCount: 88,
    description: 'Tender, crisp young green bhindi. Great for kurkuri bhindi or stuffed masala okra.',
    origin: 'Malta',
    isVegetarian: true,
    vatRate: 0,
    sku: 'FP-OKR-05'
  },
  {
    id: 'fp-06',
    name: 'Alphonso Mangoes (Imported Box)',
    brand: 'Ratnagiri Gold',
    category: 'fresh-produce',
    subCategory: 'Fruits',
    price: 18.50,
    originalPrice: 22.00,
    unit: 'Box of 6 (~1.8 kg)',
    image: '/products/fp-06_alphonso_mango.jpg',
    stock: 25,
    inStock: true,
    rating: 5.0,
    reviewCount: 110,
    description: 'Air-flown GI-tagged Ratnagiri Alphonso mangoes. Incomparable sweetness and floral bouquet.',
    origin: 'India',
    isOrganic: true,
    isVegetarian: true,
    discountPercent: 16,
    vatRate: 0,
    sku: 'FP-MNG-ALPH-06'
  },

  // --- HOUSEHOLD & CARE ---
  {
    id: 'hc-01',
    name: 'Zed Black Premium Agarbatti (Incense)',
    brand: 'Zed Black',
    category: 'household-care',
    subCategory: 'Puja & Fragrance',
    price: 2.10,
    unit: 'Pack of 120 Sticks',
    image: '/products/hc-01_agarbatti.jpg',
    stock: 80,
    inStock: true,
    rating: 4.9,
    reviewCount: 75,
    description: 'Sandalwood and Champa infused long-burning incense sticks for a peaceful, divine home aroma.',
    origin: 'India',
    vatRate: 0.18,
    sku: 'HC-ZED-INC-01'
  },
  {
    id: 'hc-02',
    name: 'Medimix Ayurvedic 18-Herb Soap',
    brand: 'Medimix',
    category: 'household-care',
    subCategory: 'Soaps & Care',
    price: 3.50,
    unit: 'Pack of 3 (125g each)',
    image: '/products/hc-02_medimix_soap.jpg',
    stock: 70,
    inStock: true,
    rating: 4.8,
    reviewCount: 110,
    description: 'Time-tested Ayurvedic classic formulation enriched with 18 herbs to nourish and protect skin naturally.',
    origin: 'India',
    vatRate: 0.18,
    sku: 'HC-MDM-SOP-02'
  }
];

// Generator to simulate the expansive 7,162 catalog across all sub-variations seamlessly
export function generateFullCatalog(): Product[] {
  const fullList: Product[] = [...BASE_PRODUCTS];
  
  const additionalItems: { [cat: string]: string[] } = {
    'fresh-produce': [
      'Red Onions (Pyaaz)', 'Baby Potatoes (Aloo)', 'Cauliflower (Gobhi)', 'Green Cabbage (Patta Gobhi)', 
      'Fresh Bitter Gourd (Karela)', 'Bottle Gourd (Lauki)', 'Fresh Mint Leaves (Pudina)', 'Fenugreek Leaves (Methi)',
      'Curry Leaves (Kadi Patta)', 'Raw Mango (Kairi)', 'Maltese Oranges', 'Maltese Strawberries', 'Green Papaya'
    ],
    'dairy-paneer': [
      'Mother Dairy Cow Ghee', 'Fresh Dahi / Curd Tub (500g)', 'Maltese Fresh Ricotta (Irkotta)', 
      'Benna Salted Butter Block (250g)', 'Epigamia Greek Yogurt Alphonso', 'Amul Cheese Slices (10pk)',
      'Fresh Malai Rabri (200g)', 'Nutritious Free Range Brown Eggs (Pack of 12)'
    ],
    'rice-atta': [
      'Pillsbury Chakki Fresh Atta (5kg)', 'Fortune Sunlite Sunflower Oil (5L)', 'Fortune Mustard Oil (Kachi Ghani 1L)',
      'Kohinoor Super Silver Basmati Rice (5kg)', 'Organic Sona Masoori Rice (5kg)', 'Roasted Semolina / Rava (1kg)',
      'Besan Gram Flour (1kg)', 'Rice Flour (Fine Grade 1kg)', 'Bajra Millet Flour (1kg)'
    ],
    'dal-pulses': [
      'Tata Sampann Chana Dal (1kg)', 'Tata Sampann Moong Dal Yellow Split (1kg)', 'Tata Sampann Masoor Dal Red (1kg)',
      'Organic Rajma Chitra (1kg)', 'Kabuli Chana Extra Large (1kg)', 'Urad Dal White Washed (1kg)',
      'Black Urad Whole (1kg)', 'Lobia Black Eyed Peas (1kg)'
    ],
    'spices-masalas': [
      'MDH Chana Masala (100g)', 'MDH Kitchen King Masala (100g)', 'Catch Pure Turmeric Powder / Haldi (200g)',
      'Catch Cumin Seeds / Jeera (200g)', 'Mustard Seeds / Rai (200g)', 'Fennel Seeds / Saunf (200g)',
      'Kashmiri Saffron Mongra Grade A (1g)', 'Cinnamon Sticks / Dalchini (100g)', 'Cloves / Laung (100g)'
    ],
    'frozen-ready': [
      'MTR Ready-to-Eat Paneer Butter Masala (300g)', 'Gits Ready-to-Eat Dal Makhani (300g)', 
      'Haldiram Frozen Punjabi Chhole & Bhature', 'Ashoka Frozen Tandoori Roti (Pack of 5)',
      'Deep Frozen Green Peas / Matar (1kg)', 'Haldiram Hara Bhara Kebab (300g)'
    ],
    'snacks-sweets': [
      'Bikaji Bhujia Sev (400g)', 'Haldiram Khatta Meetha (400g)', 'Haldiram Rasgulla (1kg Tin)',
      'Haldiram Soan Papdi (500g Box)', 'Balaji Wafers Masala (150g)', 'Parle-G Gold Biscuits (1kg Family Pack)',
      'Hide & Seek Chocolate Chip Cookies', 'Kurkure Masala Munch (100g)'
    ],
    'beverages-tea': [
      'Tata Tea Gold (1kg)', 'Society Tea Masala Blend (500g)', 'Bru Instant Coffee (200g Jar)',
      'Nescafe Classic Roast (200g Jar)', 'Paper Boat Aam Panna (Pack of 4)', 'Limca Lemon Drink Can (330ml)',
      'Thums Up Indian Cola Can (330ml)', 'Rooh Afza Herbal Rose Syrup (750ml)'
    ],
    'bakery-breads': [
      'Fresh Pav Buns (Pack of 6)', 'Methi Khakhra Crisps (200g)', 'Jeera Khakhra Crisps (200g)',
      'Maltese Sourdough Crusty Loaf', 'Butter Toast Rusks (300g)'
    ],
    'household-care': [
      'Patanjali Dant Kanti Toothpaste (200g)', 'Mysore Sandal Soap Gold (125g)', 'Dettol Antiseptic Liquid (500ml)',
      'Vim Dishwash Gel Lemon (750ml)', 'Surf Excel Matic Liquid Detergent (1L)', 'Pooja Camphor Tablets (Kapur 100g)'
    ]
  };

  const imagesByCat: { [key: string]: string[] } = {
    'fresh-produce': [
      '/products/fp-01_tomatoes.jpg',
      '/products/fp-02_coriander.jpg',
      '/products/fp-05_okra.jpg',
      '/products/fp-06_alphonso_mango.jpg'
    ],
    'dairy-paneer': [
      '/products/dp-02_amul_pure_ghee.jpg',
      '/products/dp-01_amul_paneer.jpg',
      '/products/dp-03_benna_milk.jpg'
    ],
    'rice-atta': [
      '/products/ar-01_aashirvaad_atta.jpg',
      '/products/ar-02_daawat_basmati.jpg',
      '/products/ar-03_india_gate_basmati.jpg'
    ],
    'dal-pulses': [
      '/products/dl-01_tata_toor_dal.jpg',
      '/products/dl-02_organic_moong.jpg',
      '/products/dl-03_kala_chana.jpg'
    ],
    'spices-masalas': [
      '/products/sm-01_mdh_deggi_mirch.jpg',
      '/products/sm-02_everest_garam_masala.jpg',
      '/products/sm-03_cardamom.jpg'
    ],
    'frozen-ready': [
      '/products/ff-01_haldirams_samosa.jpg',
      '/products/ff-02_paratha.jpg'
    ],
    'snacks-sweets': [
      '/products/ss-01_haldirams_aloo_bhujia.png',
      '/products/ss-02_haldirams_gulab_jamun.jpg'
    ],
    'beverages-tea': [
      '/products/bv-01_wagh_bakri_tea.jpg',
      '/products/bv-02_frooti.jpg'
    ],
    'bakery-breads': [
      '/products/bb-01_garlic_naan.jpg',
      '/products/bb-02_britannia_rusk.jpg'
    ],
    'household-care': [
      '/products/hc-01_agarbatti.jpg',
      '/products/hc-02_medimix_soap.jpg'
    ]
  };

  let counter = 100;
  Object.keys(additionalItems).forEach((catKey) => {
    const names = additionalItems[catKey];
    names.forEach((prodName, idx) => {
      counter++;
      const catImages = imagesByCat[catKey] || imagesByCat['fresh-produce'];
      const img = catImages[idx % catImages.length];
      const basePrice = Number((1.50 + ((idx * 1.37) % 8.50)).toFixed(2));
      const hasDiscount = idx % 3 === 0;

      fullList.push({
        id: `prod-gen-${counter}`,
        name: prodName,
        brand: idx % 2 === 0 ? 'Desi Direct' : 'Royal Kitchens',
        category: catKey as any,
        subCategory: 'Grocery Essentials',
        price: basePrice,
        originalPrice: hasDiscount ? Number((basePrice * 1.2).toFixed(2)) : undefined,
        unit: idx % 2 === 0 ? '1 kg' : '500 g',
        image: img,
        stock: 50 + ((counter * 7) % 150),
        inStock: true,
        rating: Number((4.5 + ((counter % 5) * 0.1)).toFixed(1)),
        reviewCount: 30 + ((counter * 11) % 180),
        description: `Premium quality ${prodName} curated and packaged under stringent quality standards for DESI BOLT customers in Malta.`,
        origin: catKey === 'fresh-produce' && idx % 2 === 0 ? 'Malta' : 'India',
        isOrganic: idx % 4 === 0,
        isVegetarian: true,
        isBestSeller: idx % 5 === 0,
        discountPercent: hasDiscount ? 15 : undefined,
        vatRate: ['snacks-sweets', 'household-care', 'frozen-ready'].includes(catKey) ? 0.18 : 0,
        sku: `SKU-DB-${counter}`
      });
    });
  });

  return fullList;
}

export const ALL_PRODUCTS = generateFullCatalog();
