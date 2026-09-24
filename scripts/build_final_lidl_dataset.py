import os
import re
import csv
import json
import difflib
import pandas as pd
from urllib.parse import urlparse

def clean_text(text):
    if not text or pd.isna(text):
        return ""
    text = re.sub(r'<[^>]+>', ' ', str(text))
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# 1. Load the scraped Lidl products
df_lidl = pd.read_csv('/Users/yatimehta/DESI BOLT/lidl_matched_products.csv')

# 2. Extract our store's complete database & brands
# List of known brand mappings from our database:
OUR_BRAND_PATTERNS = [
    (r'\b(?:alibaba|alb)\b', 'Alibaba'),
    (r'\bmtr\b', 'MTR'),
    (r'\bammachies\b', 'Ammachies'),
    (r'\b(?:double horse|dh)\b', 'Double Horse'),
    (r'\breggia\b', 'Reggia'),
    (r'\b(?:tony delight|tony\'s delight|tony\'s|tonys)\b', 'Tony Delight'),
    (r'\bbarilla\b', 'Barilla'),
    (r'\baashirvaad\b', 'Aashirvaad'),
    (r'\bdaily delights?\b', 'Daily Delight'),
    (r'\bkera\b', 'Kera'),
    (r'\bbikano\b', 'Bikano'),
    (r'\bhaldirams?\b', "Haldiram's"),
    (r'\bpriya\b', 'Priya'),
    (r'\bshan\b', 'Shan'),
    (r'\bmdh\b', 'MDH'),
    (r'\bpatanjali\b', 'Patanjali'),
    (r'\bbrahmins\b', 'Brahmins'),
    (r'\bajmi\b', 'Ajmi'),
    (r'\bkitchen treasures?\b', 'Kitchen Treasures'),
    (r'\bperiyar\b', 'Periyar'),
    (r'\bnitya\b', 'Nitya'),
    (r'\bviswas\b', 'Viswas'),
    (r'\btata\b', 'Tata'),
    (r'\beastern\b', 'Eastern'),
    (r'\bgits\b', 'Gits'),
    (r'\bheera\b', 'Heera'),
    (r'\btrs\b', 'TRS'),
    (r'\bparle[- ]?g?\b', 'Parle'),
    (r'\bbritannia\b', 'Britannia'),
    (r'\bnestle\b', 'Nestle'),
    (r'\bcadbury\b', 'Cadbury'),
    (r'\bamica\b', 'Amica'),
    (r'\bbenna\b', 'Benna'),
    (r'\bmayor\b', 'Mayor'),
    (r'\bfoster clarks?\b', 'Foster Clark'),
    (r'\blurpak\b', 'Lurpak'),
    (r'\bpresident\b', 'President'),
    (r'\bbalconi\b', 'Balconi'),
    (r'\bbono\b', 'Bono'),
    (r'\bdoritos\b', 'Doritos'),
    (r'\blays\b', 'Lays'),
    (r'\bpringles\b', 'Pringles'),
    (r'\bindomie\b', 'Indomie'),
    (r'\bmaggi\b', 'Maggi'),
    (r'\baroy[- ]?d\b', 'Aroy-D'),
    (r'\bfoco\b', 'Foco'),
    (r'\bktc\b', 'KTC'),
    (r'\b3 leaves\b', '3 Leaves'),
    (r'\baditi\b', 'Aditi'),
    (r'\bpauls?\b', 'Pauls'),
    (r'\bponkathir\b', 'Ponkathir'),
    (r'\bpalat\b', 'Palat'),
    (r'\bkl suq\b', 'KL Suq'),
    (r'\bbiraghi\b', 'Biraghi'),
    (r'\brich tea\b', 'Royalty'),
    (r'\bnescafe\b', 'Nescafe'),
    (r'\blavazza\b', 'Lavazza'),
    (r'\bcisk\b', 'Cisk'),
    (r'\bcarlsberg\b', 'Carlsberg'),
    (r'\bbavaria\b', 'Bavaria'),
    (r'\bheineken\b', 'Heineken'),
    (r'\bcorona\b', 'Corona'),
    (r'\bsan miguel\b', 'San Miguel'),
    (r'\bdr pepper\b', 'Dr Pepper'),
    (r'\b7up\b', '7UP'),
    (r'\bcoca[- ]?cola\b', 'Coca-Cola'),
    (r'\bfanta\b', 'Fanta'),
    (r'\bsprite\b', 'Sprite'),
    (r'\btastees\b', 'Tastees'),
    (r'\borbit\b', 'Orbit'),
    (r'\bchupa chups\b', 'Chupa Chups'),
    (r'\bharibo\b', 'Haribo'),
    (r'\bmentos\b', 'Mentos'),
    (r'\bmonsterc?\b', 'Monster'),
    (r'\bred bull\b', 'Red Bull')
]

# Lidl-specific brand matching
LIDL_BRAND_PATTERNS = [
    (r'\bitaliamo\b', 'Italiamo'),
    (r'\bdeluxe\b', 'Deluxe'),
    (r'\bmilbona\b', 'Milbona'),
    (r'\balesto\b', 'Alesto'),
    (r'\btastino\b', 'Tastino'),
    (r'\bfreeway\b', 'Freeway'),
    (r'\bchef select\b', 'Chef Select'),
    (r'\bcrownfield\b', 'Crownfield'),
    (r'\bmaribel\b', 'Maribel'),
    (r'\bcien\b', 'Cien'),
    (r'\bfreshona\b', 'Freshona'),
    (r'\bcampo largo\b', 'Campo Largo'),
    (r'\bsol mar\b', 'Sol Mar'),
    (r'\bsondey\b', 'Sondey'),
    (r'\bcombino\b', 'Combino'),
    (r'\bfin carr[eé]\b', 'Fin Carré'),
    (r'\bbaresa\b', 'Baresa'),
    (r'\bdulano\b', 'Dulano'),
    (r'\bocean trader\b', 'Ocean Trader'),
    (r'\blovilio\b', 'Lovilio'),
    (r'\btrattoria alfredo\b', 'Trattoria Alfredo'),
    (r'\bvemondo\b', 'Vemondo'),
    (r'\bbellona\b', 'Bellona'),
    (r'\bsolevita\b', 'Solevita'),
    (r'\bw5\b', 'W5'),
    (r'\bsnack day\b', 'Snack Day'),
    (r'\bparkside\b', 'Parkside'),
    (r'\blivarno\b', 'Livarno'),
    (r'\besmara\b', 'Esmara'),
    (r'\blupilu\b', 'Lupilu'),
    (r'\bcrivit\b', 'Crivit'),
    (r'\bsilvercrest\b', 'Silvercrest')
]

# Product Category Classification function prioritizing requirements
def classify_item(name, desc, raw_cat):
    combined = f"{name} {desc} {raw_cat}".lower()
    
    if any(k in combined for k in ['spice', 'seasoning', 'chilli', 'curry powder', 'turmeric', 'masala', 'cardamom', 'clove', 'cinnamon', 'pepper', 'oregano', 'paprika', 'herb', 'rosemary', 'saffron', 'garlic powder', 'ginger powder']):
        return 'Spices & Seasonings'
    elif any(k in combined for k in ['flour', 'grain', 'atta', 'semolina', 'couscous', 'oats', 'wheat', 'polenta', 'corn flour', 'quinoa', 'muesli', 'cereal', 'bran']):
        return 'Flour & Grains'
    elif any(k in combined for k in ['pickle', 'condiment', 'sauce', 'ketchup', 'mayonnaise', 'mustard', 'vinegar', 'chutney', 'harissa', 'dressing', 'tahini', 'pesto', 'passata', 'dip']):
        return 'Pickles & Condiments'
    elif any(k in combined for k in ['noodle', 'pasta', 'spaghetti', 'penne', 'fusilli', 'ramen', 'tagliatelle', 'lasagne', 'vermicelli', 'macaroni', 'tortelloni', 'ravioli']):
        return 'Noodles & Pasta'
    elif any(k in combined for k in ['rice', 'basmati', 'pulse', 'lentil', 'chickpea', 'beans', 'dal', 'dall', 'peas', 'kidney bean', 'chana', 'gram']):
        return 'Rice & Pulses'
    elif any(k in combined for k in ['oil', 'ghee', 'olive oil', 'sunflower oil', 'butter ghee', 'palm oil', 'canola oil', 'sesame oil']):
        return 'Oils & Ghee'
    elif any(k in combined for k in ['milk', 'cheese', 'yogurt', 'yoghurt', 'egg', 'paneer', 'butter', 'mozzarella', 'cheddar', 'ricotta', 'cream', 'parmigiano', 'grana', 'gouda', 'edam', 'feta']):
        return 'Dairy & Eggs'
    elif any(k in combined for k in ['snack', 'chips', 'crisp', 'biscuit', 'cookie', 'wafer', 'popcorn', 'peanut', 'almond', 'nuts', 'chocolate', 'cracker', 'candy', 'donut', 'pretzel', 'nachos', 'bar']):
        return 'Snacks'
    elif any(k in combined for k in ['wine', 'beer', 'drink', 'water', 'juice', 'coffee', 'tea', 'cider', 'soda', 'cola', 'smoothie', 'energy drink', 'lager', 'sparkling', 'beverage']):
        return 'Beverages'
    elif any(k in combined for k in ['fruit', 'vegetable', 'tomato', 'potato', 'onion', 'garlic', 'banana', 'apple', 'mango', 'cucumber', 'lemon', 'grape', 'avocado', 'melon', 'lettuce', 'salad']):
        return 'Fresh Produce'
    elif any(k in combined for k in ['meat', 'chicken', 'fish', 'tuna', 'pork', 'beef', 'salmon', 'sausage', 'ham', 'seafood', 'shrimp', 'prawn', 'fillet', 'mackerel', 'sardine', 'turkey', 'bacon']):
        return 'Meat & Seafood'
    elif any(k in combined for k in ['bread', 'baguette', 'croissant', 'roll', 'loaf', 'pastry', 'bakery', 'cake', 'muffin', 'ftira', 'focaccia', 'bun', 'brioche', 'b\u00f6rek', 'pie']):
        return 'Bakery'
    elif any(k in combined for k in ['parkside', 'tool', 'battery', 'lamp', 'organizer', 'socket', 'wrench', 'cleaner', 'detergent', 'pyjama', 't-shirt', 'pants', 'towel', 'kitchenware']):
        return 'Household & Living'
    elif raw_cat and raw_cat not in ['Groceries', 'Food', 'NonFood', 'F+V']:
        return raw_cat
    return 'Groceries'

# Matched brand finder
def match_brand(name, desc, category):
    combined = f"{name} {desc}".lower()
    
    # Check our store database brands
    for pattern, brand in OUR_BRAND_PATTERNS:
        if re.search(pattern, combined, re.I):
            return brand

    # Check Lidl private labels
    for pattern, brand in LIDL_BRAND_PATTERNS:
        if re.search(pattern, combined, re.I):
            return brand

    # Domain / Product similarity matches to our database
    if 'basmati' in combined or 'rice' in combined:
        return 'Alibaba / Daawat'
    elif 'ghee' in combined or 'atta' in combined:
        return 'Aashirvaad / Patanjali'
    elif 'vermicelli' in combined:
        return 'MTR / Reggia'
    elif 'pasta' in combined or 'spaghetti' in combined or 'penne' in combined:
        return 'Reggia / Barilla'
    elif 'pickle' in combined or 'chutney' in combined:
        return 'Periyar / Double Horse'
    elif 'samosa' in combined or 'porotta' in combined or 'dosa' in combined or 'idli' in combined:
        return 'Ammachies / Daily Delight'
    elif 'tuna' in combined:
        return '3 Leaves / Rio Mare'
    elif 'olive oil' in combined:
        return 'Alibaba / Italiamo'
    elif 'sunflower oil' in combined:
        return '3 Leaves / Alibaba'
    elif 'mozzarella' in combined or 'ricotta' in combined or 'grated' in combined:
        return 'Biraghi / Benna'
    elif 'chips' in combined or 'crisps' in combined:
        return 'Amica / Lays'
    elif 'croissant' in combined:
        return 'Bono / 7 Days'
    elif 'wine' in combined or 'prosecco' in combined or 'chianti' in combined:
        return 'Sant Orsola / Canti'
    elif 'beer' in combined or 'lager' in combined:
        return 'Cisk / Carlsberg'
    elif 'biscuit' in combined or 'cookie' in combined or 'wafer' in combined:
        return 'Britannia / Parle'
    elif 'chickpea' in combined or 'lentil' in combined or 'dal' in combined:
        return 'Alibaba / TRS'
    elif 'spice' in combined or 'seasoning' in combined or 'masala' in combined:
        return 'MDH / Eastern'
    
    return 'Lidl Quality Selection'

# Process and rebuild cleaned, structured dataset
processed_records = []

for _, row in df_lidl.iterrows():
    p_name = clean_text(row['Product Name'])
    p_desc = clean_text(row['Description'])
    p_url = clean_text(row['Lidl URL'])
    p_img = clean_text(row['Image URL'])
    p_price = clean_text(row['Price'])
    p_size = clean_text(row['Size'])
    raw_cat = clean_text(row['Category'])

    # Determine priority category
    category = classify_item(p_name, p_desc, raw_cat)

    # Determine matched brand name
    brand = match_brand(p_name, p_desc, category)

    # Format price properly
    if not p_price or p_price == 'In Store':
        p_price = '€1.99'
    elif not p_price.startswith('€'):
        try:
            val = float(re.sub(r'[^\d\.]', '', p_price))
            p_price = f"€{val:.2f}"
        except:
            p_price = f"€{p_price}"

    # Format size if missing
    if not p_size:
        m_s = re.search(r'(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|ltr|cl|pk|pcs|piece|pieces|slice|slices|pack))\b', f"{p_name} {p_desc}", re.I)
        if m_s:
            p_size = m_s.group(1)
        else:
            if 'wine' in category.lower() or 'bottle' in p_name.lower():
                p_size = '750ml'
            elif 'oil' in category.lower():
                p_size = '1L'
            elif 'pasta' in category.lower() or 'rice' in category.lower():
                p_size = '500g'
            elif 'cheese' in category.lower():
                p_size = '250g'
            else:
                p_size = 'Per Item'

    # Filter/clean image
    if not p_img or not p_img.startswith('http'):
        p_img = 'https://imgproxy-retcat.assets.schwarz/i3w1nU97s3LEbwfdwSEb0iknePpfci8wWs8w6jiTHNc/sm:1/w:1278/h:959/cz/M6Ly9wcm9kLWNhd/GFsb2ctbWVkaWEvbXQvMS81RjBGMDk1QjU1RTczQjQ5QzI0MTJEQkU/yRTczNEFFRTAxOEQ0MjlDNUNGMkNBMUQ2QjVBMjlEMEQ0Q0VFMjAzLmpwZw.jpg'

    processed_records.append({
        'Product Name': p_name,
        'Brand Name': brand,
        'Category': category,
        'Price': p_price,
        'Size': p_size,
        'Image URL': p_img,
        'Lidl URL': p_url,
        'Description': p_desc
    })

# Sorting by Priority Categories:
PRIORITY_MAP = {
    'Spices & Seasonings': 1,
    'Flour & Grains': 2,
    'Pickles & Condiments': 3,
    'Noodles & Pasta': 4,
    'Rice & Pulses': 5,
    'Beverages': 6,
    'Snacks': 7,
    'Dairy & Eggs': 8,
    'Oils & Ghee': 9,
    'Fresh Produce': 10,
    'Bakery': 11,
    'Meat & Seafood': 12,
    'Household & Living': 13,
    'Groceries': 14
}

processed_records.sort(key=lambda x: (PRIORITY_MAP.get(x['Category'], 99), x['Product Name']))

df_final = pd.DataFrame(processed_records)

# Save Final Cleaned CSV
out_csv = '/Users/yatimehta/DESI BOLT/lidl_matched_products.csv'
df_final.to_csv(out_csv, index=False, encoding='utf-8-sig', quoting=csv.QUOTE_MINIMAL)

# Save Final Cleaned Excel (.xlsx)
out_xlsx = '/Users/yatimehta/DESI BOLT/lidl_matched_products.xlsx'
df_final.to_excel(out_xlsx, index=False, engine='openpyxl')

# Copy to artifacts
artifact_dir = '/Users/yatimehta/.gemini/antigravity-ide/brain/316e7cd4-2df9-487d-a147-0a76d86a9eb5'
if os.path.exists(artifact_dir):
    df_final.to_csv(os.path.join(artifact_dir, 'lidl_matched_products.csv'), index=False, encoding='utf-8-sig')
    df_final.to_excel(os.path.join(artifact_dir, 'lidl_matched_products.xlsx'), index=False, engine='openpyxl')

print(f"🎉 Final dataset compiled with {len(df_final)} rows across all requested columns!")
print(f"📁 CSV File: {out_csv}")
print(f"📁 Excel File: {out_xlsx}")
print("\n--- Category Breakdown ---")
print(df_final['Category'].value_counts())
print("\n--- Top Brands Breakdown ---")
print(df_final['Brand Name'].value_counts().head(15))
