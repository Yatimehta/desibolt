import os
import re
import json
import ssl
import csv
import gzip
import html
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd

# SSL Context
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

def fetch_url(url, timeout=12):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as res:
            return res.read().decode('utf-8', errors='ignore')
    except Exception:
        return ''

def fetch_gz_url(url, timeout=15):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as res:
            content = res.read()
            try:
                return gzip.decompress(content).decode('utf-8', errors='ignore')
            except Exception:
                return content.decode('utf-8', errors='ignore')
    except Exception:
        return ''

def is_valid_image(url):
    if not url or not url.startswith('http'):
        return False
    # Quick HEAD/GET check for valid image
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=5) as res:
            return res.status == 200
    except Exception:
        return True # Fallback if CDN blocks head requests

def resolve_nuxt_data(data, idx, depth=0):
    if depth > 10:
        return idx
    if isinstance(idx, int) and 0 <= idx < len(data):
        val = data[idx]
        if isinstance(val, dict):
            return {k: resolve_nuxt_data(data, v, depth+1) for k, v in val.items()}
        elif isinstance(val, list):
            return [resolve_nuxt_data(data, v, depth+1) for v in val]
        return val
    elif isinstance(idx, dict):
        return {k: resolve_nuxt_data(data, v, depth+1) for k, v in idx.items()}
    elif isinstance(idx, list):
        return [resolve_nuxt_data(data, v, depth+1) for v in idx]
    return idx

def parse_lidl_product_page(url, page_html=None):
    if not page_html:
        page_html = fetch_url(url)
    if not page_html:
        return None

    product_data = {}
    breadcrumbs = []
    
    # Check JSON-LD
    scripts = re.findall(r'<script[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>', page_html, re.DOTALL)
    for s in scripts:
        try:
            data = json.loads(s)
            if isinstance(data, dict):
                if data.get('@type') == 'Product':
                    product_data = data
                elif data.get('@type') == 'BreadcrumbList':
                    breadcrumbs = [item.get('name') for item in data.get('itemListElement', []) if item.get('name')]
        except Exception:
            pass

    # Check Nuxt State
    nuxt_product = {}
    m_nuxt = re.search(r'<script[^>]*id=\"__NUXT_DATA__\"[^>]*>(.*?)</script>', page_html, re.DOTALL)
    if m_nuxt:
        try:
            nuxt_arr = json.loads(m_nuxt.group(1))
            for i, item in enumerate(nuxt_arr):
                if isinstance(item, dict) and ('canonicalUrl' in item or 'itemId' in item) and 'keyfacts' in item:
                    nuxt_product = resolve_nuxt_data(nuxt_arr, i)
                    break
        except Exception:
            pass

    # 1. Product Name
    name = (nuxt_product.get('keyfacts', {}).get('title') or 
            nuxt_product.get('info', {}).get('title') or 
            product_data.get('name') or '')
    if not name:
        m = re.search(r'<title>(.*?)</title>', page_html)
        if m:
            name = m.group(1).split('|')[0].split('-')[0].strip()
    name = html.unescape(name).strip()

    # 2. Description
    desc = (nuxt_product.get('keyfacts', {}).get('description') or 
            nuxt_product.get('info', {}).get('description') or 
            product_data.get('description') or '')
    if desc:
        desc = re.sub(r'<[^>]+>', ' ', html.unescape(desc)).strip()
        desc = re.sub(r'\s+', ' ', desc)
    else:
        m = re.search(r'<meta[^>]*name=[\"\']description[\"\'][^>]*content=[\"\'](.*?)[\"\']', page_html, re.I)
        if m:
            desc = html.unescape(m.group(1)).strip()

    # 3. Image URL
    image_url = ''
    images = product_data.get('image', [])
    if isinstance(images, list) and images:
        image_url = images[0]
    elif isinstance(images, str):
        image_url = images
    
    if not image_url and isinstance(nuxt_product.get('media'), dict):
        nuxt_imgs = nuxt_product.get('media', {}).get('images', [])
        if nuxt_imgs and isinstance(nuxt_imgs[0], dict):
            image_url = nuxt_imgs[0].get('url', '')
    
    if not image_url:
        m = re.search(r'<meta[^>]*property=[\"\']og:image[\"\'][^>]*content=[\"\'](.*?)[\"\']', page_html, re.I)
        if m:
            image_url = m.group(1)

    # 4. Price
    price = ''
    if isinstance(nuxt_product.get('price'), dict):
        p_val = nuxt_product['price'].get('price')
        if p_val:
            price = f"{float(p_val):.2f}"
    
    if not price:
        offers = product_data.get('offers', {})
        if isinstance(offers, dict) and 'price' in offers and offers['price']:
            price = f"{float(offers['price']):.2f}"
        elif isinstance(offers, list) and offers and 'price' in offers[0] and offers[0]['price']:
            price = f"{float(offers[0]['price']):.2f}"

    if not price:
        m_price = re.search(r'(\d+[\.,]\d{2})\s*€|€\s*(\d+[\.,]\d{2})', page_html)
        if m_price:
            p_str = (m_price.group(1) or m_price.group(2)).replace(',', '.')
            price = f"{float(p_str):.2f}"

    # 5. Size / Weight
    size = ''
    if isinstance(nuxt_product.get('price'), dict):
        packaging = nuxt_product['price'].get('packaging')
        if isinstance(packaging, dict) and 'text' in packaging:
            size = str(packaging['text']).strip()
        elif isinstance(packaging, str):
            size = packaging.strip()

    if not size:
        m_size = re.search(r'(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|ltr|cl|pk|pcs|piece|pieces|slice|slices|pack))\b', name + ' ' + desc, re.I)
        if m_size:
            size = m_size.group(1)

    # 6. Category
    raw_cat = (nuxt_product.get('category') or 
               (' > '.join(breadcrumbs[1:]) if len(breadcrumbs) > 1 else (breadcrumbs[0] if breadcrumbs else '')))
    
    # Map to Priority Categories if applicable
    category = classify_category(name, desc, raw_cat)

    if not name:
        return None

    return {
        'Product Name': name,
        'Brand Name': '', # To be matched
        'Category': category,
        'Price': f"€{price}" if price and not price.startswith('€') else (price if price else "In Store"),
        'Size': size,
        'Image URL': image_url,
        'Lidl URL': url,
        'Description': desc
    }

def classify_category(name, desc, raw_cat):
    combined = f"{name} {desc} {raw_cat}".lower()
    
    if any(w in combined for w in ['spice', 'seasoning', 'chilli', 'curry powder', 'turmeric', 'masala', 'cardamom', 'clove', 'cinnamon', 'pepper', 'oregano', 'paprika', 'herb']):
        return 'Spices & Seasonings'
    elif any(w in combined for w in ['flour', 'grain', 'atta', 'semolina', 'couscous', 'oat', 'wheat', 'polenta', 'corn flour', 'quinoa', 'muesli']):
        return 'Flour & Grains'
    elif any(w in combined for w in ['pickle', 'condiment', 'sauce', 'ketchup', 'mayonnaise', 'mustard', 'vinegar', 'chutney', 'harissa', 'dressing', 'tahini']):
        return 'Pickles & Condiments'
    elif any(w in combined for w in ['noodle', 'pasta', 'spaghetti', 'penne', 'fusilli', 'ramen', 'tagliatelle', 'lasagne', 'vermicelli', 'macaroni']):
        return 'Noodles & Pasta'
    elif any(w in combined for w in ['rice', 'basmati', 'pulse', 'lentil', 'chickpea', 'beans', 'dal', 'dall', 'peas', 'kidney beans']):
        return 'Rice & Pulses'
    elif any(w in combined for w in ['oil', 'ghee', 'olive oil', 'sunflower oil', 'butter ghee', 'palm oil']):
        return 'Oils & Ghee'
    elif any(w in combined for w in ['milk', 'cheese', 'yogurt', 'yoghurt', 'egg', 'paneer', 'butter', 'mozzarella', 'cheddar', 'ricotta', 'cream']):
        return 'Dairy & Eggs'
    elif any(w in combined for w in ['snack', 'chips', 'crisp', 'biscuit', 'cookie', 'wafer', 'croissant', 'popcorn', 'peanut', 'almond', 'nuts', 'chocolate', 'cracker', 'candy']):
        return 'Snacks'
    elif any(w in combined for w in ['drink', 'water', 'juice', 'coffee', 'tea', 'beer', 'wine', 'cider', 'soda', 'cola', 'smoothie', 'energy drink']):
        return 'Beverages'
    elif any(w in combined for w in ['fruit', 'vegetable', 'tomato', 'potato', 'onion', 'garlic', 'banana', 'apple', 'mango', 'cucumber', 'lemon']):
        return 'Fresh Produce'
    elif any(w in combined for w in ['meat', 'chicken', 'fish', 'tuna', 'pork', 'beef', 'salmon', 'sausage', 'ham', 'seafood', 'shrimp', 'prawn']):
        return 'Meat & Seafood'
    elif any(w in combined for w in ['bread', 'baguette', 'pretzel', 'roll', 'loaf', 'pastry', 'bakery', 'cake', 'muffin']):
        return 'Bakery'
    elif raw_cat:
        return raw_cat
    return 'Groceries'
