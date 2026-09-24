import os
import re
import csv
import json
import gzip
import time
import urllib.request
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
from scrape_lidl_matcher import parse_lidl_product_page, is_valid_image, fetch_gz_url, fetch_url, HEADERS, ctx

# 1. LOAD OUR PRODUCT DATABASE PROVIDED BY THE USER
OUR_PRODUCTS_RAW = """Name,Product Type,Unit of Measure,Sales Price,Customer Taxes,Cost,Internal Reference,Barcode,Product Category,Point of Sale Category,Available in POS,Vendors/Vendor,Vendors/Price,Vendor Taxes,BCRS Containers per Unit
 Bengan Bharta450g,Storable Product,Units,2.1,E-0%,1.35,,8050519876247,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Biraghi grated granax 100g,Storable Product,Units,2.2,E-0%,1.64,,8002004217554,Frozen,Frozen,1.0,,,0% EXEMPT,0.0
 Chick Peas 1kg alibaba,Storable Product,Units,2.8,E-0%,1.93,,8050519870559,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Chilli Crushed 100g alb,Storable Product,Units,1.3,E-0%,0.8200000000000001,,8050519872119,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Chilli Crushed 100g alibaba,Storable Product,Units,1.3,E-0%,0.8200000000000001,,,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Falooda almond drinks 290ml alb,Storable Product,Units,1.5,E-0%,1.02,,8050519873338,Beverage,Beverage,1.0,,,0% EXEMPT,0.0
 Gram Flour 1kg alb,Storable Product,Units,2.2,E-0%,1.44,,8050519879026,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Grated coconut 400g tony delight,Storable Product,Units,3.5,E-0%,1.59,,8906054101996,Frozen,Frozen,1.0,,,0% EXEMPT,0.0
 MTR VERMICELLI 440GM,Storable Product,Units,2.25,E-0%,1.35,,8901042962535,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Nachoz Chutney&lime 40g,Storable Product,Units,0.5,E-0%,0.27,,8941154031330,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
 PALLMALLRED CIGG CARD,Storable Product,Units,5.5,F-18%,0.0,,PMCARD,Others,,1.0,,,18% G,0.0
 Penne ziti rigate 34 500g reggia pasta,Storable Product,Units,1.3,E-0%,0.86,,8008857300344,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Periyar garlic pickle 400g,Storable Product,Units,2.9,E-0%,1.7,,665244213748,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Pineapple Essence 28ml,Storable Product,Units,0.64,E-0%,0.4,,8050519877596,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Rose Water 190ml alibaba,Storable Product,Units,1.0,E-0%,0.59,,8050519877527,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Ruginet Rust remover 75ml,Storable Product,Units,3.5,F-18%,2.2,,5353801120169,Household,Household,1.0,,,18% G,0.0
 S5 /Strawberry ,Storable Product,Units,4.0,E-0%,2.5,,789456123,Vegetables,Vegetables,1.0,,,0% EXEMPT,0.0
 SPIC AND SPAN MUSHIO 1LTR,Storable Product,Units,1.9,F-18%,1.19,,8008970035314,Household,Household,1.0,,,18% G,0.0
 Sambar Powder 140g Double horse,Storable Product,Units,0.99,E-0%,1.6,,8904011501247,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Semolina Coarse 1.5kg,Storable Product,Units,4.1,E-0%,2.55,,8056994271201,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 Vanilla Essence 28ml,Storable Product,Units,0.45,E-0%,0.31,,8050519877565,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 bangus whole fish,Storable Product,Units,10.6,E-0%,6.25,,Fb1,Frozen,Frozen,1.0,,,0% EXEMPT,0.0
 candles melita,Storable Product,Units,2.2,F-18%,1.4,,5353801007057,Household,Household,1.0,,,18% G,0.0
 cantina sant evasio moscato,Storable Product,Units,7.0,E-0%,5.7,,8029483000118,Beverage,Beverage,1.0,,,0% EXEMPT,0.0
 certex handwash blue 500ml 6,Storable Product,Units,2.8,F-18%,1.7,,5025416991174,Household,Household,1.0,,,18% G,0.0
 garlic pickle 400 periyar,Storable Product,Units,2.5,E-0%,1.7,,,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 meat masala Double horse,Storable Product,Units,2.3,E-0%,1.6,,,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
 patanjali ghee 500g,Storable Product,Units,11.75,E-0%,7.82,,634654802354,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
1 hour idli dosa podi 1kg,Storable Product,Units,3.2,E-0%,2.8,,8904011505269,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
1l tittex  piatti ,Storable Product,Units,1.99,E-0%,1.44,,8011380002272,Household,Household,1.0,,,0% EXEMPT,0.0
2 & 2 FOR MEN SPRAY,Storable Product,Units,7.99,F-18%,5.42,,8435160603426,Household,Household,1.0,,,18% G,0.0
2 PM NOODLES KOREAN RAMEN ,Storable Product,Units,1.95,E-0%,1.5,,950600024240,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
2pm Noodles,Storable Product,Units,1.1,E-0%,0.75,,9506000024073,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
2pm Noodles 1*5,Storable Product,Units,5.0,E-0%,3.25,,9506000024097,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
2pm korean ramen 1ps,Storable Product,Units,1.1,E-0%,0.89,,9506000024196,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
3 LEAVES TUNA CHUNKS 80GM,Storable Product,Units,1.0,E-0%,0.0,,5350477006575,Grocery,,1.0,,,0% EXEMPT,0.0
3 LEAVES TUNA CHUNKS IN SUNFLOWER OIL,Storable Product,Units,1.6,E-0%,0.0,,5350477006582,Grocery,,1.0,,,0% EXEMPT,0.0
3 leaves 1l sunflower oil,Storable Product,Units,1.9,E-0%,1.35,,5350477999976,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
3 leaves 5l sunflower oil,Storable Product,Units,9.5,E-0%,6.5,,5350477000825,Household,Household,1.0,,,0% EXEMPT,0.0
3 leaves red kidney beans 400g,Storable Product,Units,1.4,E-0%,0.8,,5350477001747,Household,Household,1.0,,,0% EXEMPT,0.0
3 leaves sweet corn 150g,Storable Product,Units,1.0,E-0%,0.9500000000000001,,3l,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
3Leaves 80g,Storable Product,Units,1.0,E-0%,0.79,,5350477999952,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
3Leaves green sliced olives 900g,Storable Product,Units,3.8,E-0%,2.8,,5350477999846,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
3Leaves sliced kalamon olives,Storable Product,Units,2.85,E-0%,1.2,,5350477000573,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
3leaves cannellini beans 400g,Storable Product,Units,1.1,E-0%,0.7000000000000001,,5350477001730,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
3leaves capers 220g,Storable Product,Units,2.45,E-0%,1.4,,5350477001273,Household,Household,1.0,,,0% EXEMPT,0.0
3leaves corned beef 198g ,Storable Product,Units,2.6,E-0%,1.5,,5350477000139,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
3leaves honey 500ml,Storable Product,Units,4.9,E-0%,3.98,,5350477000016,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
3leaves sweetcorn,Storable Product,Units,1.4,E-0%,1.0,,5350477000092,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
4 IN 1 INDIAN SPICE SEASONING MIX ,Consumable,Units,2.6,E-0%,2.0,,5055257852259,Grocery,,1.0,GRISCTI IMPORTS LTD,2.0,0% EXEMPT,0.0
4 IN 1 ITALIAN HERB SEASONING MIX ,Storable Product,Units,2.6,E-0%,2.0,,5055257876927,Grocery,,1.0,GRISCTI IMPORTS LTD,2.0,0% EXEMPT,0.0
40 Fabric Plasters,Storable Product,Units,3.5,R5-5%,1.25,,5031413902839,Household,Household,1.0,,,5% G,0.0
42 protien chips ,Storable Product,Units,1.2,E-0%,0.99,,8594197511576,Household,Household,1.0,,,0% EXEMPT,0.0
4brd fish fillet 380g,Storable Product,Units,4.0,E-0%,3.2,,5397199003932,Frozen,Frozen,1.0,,,0% EXEMPT,0.0
4l voila amorbidente talco /azzura,Storable Product,Units,4.4,F-18%,3.49,,5353801020124,Household,Household,1.0,,,18% G,0.0
4l voila floor lav ,Storable Product,Units,4.5,F-18%,3.49,,5353801000140,Household,Household,1.0,,,18% G,0.0
4l voila laudary marsilgia,Storable Product,Units,4.5,F-18%,3.49,,5353801201042,Household,Household,1.0,,,18% G,0.0
4l voila laundary classico ,Storable Product,Units,4.5,F-18%,3.49,,5353801000041,Household,Household,1.0,,,18% G,0.0
4l voila laundary nero*4,Storable Product,Units,4.5,F-18%,3.49,,5353801720192,Household,Household,1.0,,,18% G,0.0
4l voila laundry blue,Storable Product,Units,4.5,F-18%,3.49,,5353801420139,Household,Household,1.0,,,18% G,0.0
4up 50cl1,Storable Product,Units,1.8,E-0%,1.2,,87170719,Beverage,Beverage,1.0,,,0% EXEMPT,0.0
50/50 britannia,Storable Product,Units,3.7,E-0%,2.28,,6291007906417,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
50/50 britannia 62g,Storable Product,Units,0.6,E-0%,0.0,,8901063136694,Bakery,,1.0,,,0% EXEMPT,0.0
50/50 britannia 62g,Storable Product,Units,0.6,E-0%,0.5,,8901063136700,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
5060402906459,Storable Product,Units,1.6,F-18%,0.0,,9004380223005,Beverage,,1.0,,,18% G,0.0
555 FRIED SARDINES   TAUSI 155g ,Storable Product,Units,1.0,E-0%,0.78,,748485200675,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
555 fried SARDINES HOT AND SPICY 155g ,Storable Product,Units,1.0,E-0%,0.78,,748485200668,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
555 sardines  155gm,Storable Product,Units,1.1,E-0%,0.6,,748485200019,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
7 DAYS BAKE ROLL PIZZA 80GM,Storable Product,Units,0.99,E-0%,0.0,,7622202016028,Bakery,,1.0,,,0% EXEMPT,0.0
7 DAYS BAKE ROLLS CHEESE & GARLIC 150GM,Storable Product,Units,1.99,E-0%,0.0,,7622202020902,Bakery,,1.0,,,0% EXEMPT,0.0
7 DAYS BAKE ROLLS SOURCREAM & ONIONS 150GM,Storable Product,Units,1.99,E-0%,0.0,,5201360677924,Bakery,,1.0,,,0% EXEMPT,0.0
7 Days bake rolls 80gm,Storable Product,Units,0.99,E-0%,0.76,,5359902027802,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
7 Days bake rolls bacon 150,Storable Product,Units,1.99,E-0%,1.53,,5359902028052,Bakery,,1.0,KM DISTRIBUTER,1.53,0% EXEMPT,0.0
7 UP ZERO SUGAR PINK 500ML,Storable Product,Units,1.5,F-18%,1.1,,5352201087386,Beverage,,1.0,FARSONS BREWERS,1.1,18% G,1.0
7 days bake rolls tomato 80g,Storable Product,Units,1.15,E-0%,0.88,,7622202015441,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
7 days bake rols bacon 150g,Storable Product,Units,1.99,E-0%,1.53,,5201360677627,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
7 days bake rols garlic 80g,Storable Product,Units,1.15,E-0%,0.88,,7622202015960,Bakery,Bakery,1.0,KM DISTRIBUTER,0.88,0% EXEMPT,0.0
7 days bake rols pizza 80g,Storable Product,Units,1.15,E-0%,0.88,,76222202016028,Bakery,Bakery,1.0,KM DISTRIBUTER,0.88,0% EXEMPT,0.0
7 days bake rols salt 80g,Storable Product,Units,1.15,E-0%,0.88,,76222202015823,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
7 days crosant chery,Storable Product,Units,1.15,E-0%,0.89,,7622201393779,Grocery,Grocery,1.0,,,0% EXEMPT,0.0
7 days crossant cho&vanila  60g,Storable Product,Units,0.95,E-0%,0.73,,7622201390662,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
7 days max chocolate  coco 80g,Storable Product,Units,1.1,E-0%,0.77,,7622201389864,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
7 up zero 500ml,Storable Product,Units,1.6,F-18%,0.0,,5352201087379,Beverage,,1.0,,,18% G,1.0
77 BLACK CURRANT MEDIUM,Storable Product,Units,5.5,F-18%,2.75,,5905591987820,Others,Others,1.0,,,18% G,0.0
77 CLASSIC TOBACCO MEDIUM ,Storable Product,Units,5.5,F-18%,2.75,,5905591987868,Others,Others,1.0,,,18% G,0.0
77 Cola Ice  mint light,Storable Product,Units,5.5,F-18%,2.75,,5905591988001,Others,Others,1.0,,,18% G,0.0
77 Cola Ice extra strong,Storable Product,Units,5.5,F-18%,2.75,,5906670981968,Others,Others,1.0,,,18% G,0.0
77 FOREST FRUITS MEDIUM,Storable Product,Units,5.5,F-18%,2.75,,5905591987875,Others,Others,1.0,,,18% G,0.0
77 FREEZE MINT 5907053717358,Storable Product,Units,5.5,F-18%,2.75,,5907053717358,Others,Others,1.0,,,18% G,0.0
77 Mango extra song,Storable Product,Units,5.5,F-18%,2.75,,5906670981975,Others,Others,1.0,,,18% G,0.0
77 ORIGINAL GHOST MINI ,Storable Product,Units,5.5,F-18%,2.75,,5906670981999,Others,Others,1.0,,,18% G,0.0
77 PEPPERMINT,Storable Product,Units,5.5,F-18%,2.75,,5907053726602,Others,Others,1.0,,,18% G,0.0
77 Stawberry  light,Storable Product,Units,5.5,F-18%,2.75,,5905591987974,Others,Others,1.0,,,18% G,0.0
7DAY BAKE ROLLS BACON 80GM,Storable Product,Units,0.99,,0.0,,7622202016318,Bakery,,1.0,,,,0.0
7days croissant ,Storable Product,Units,1.1,E-0%,0.84,,7622201389840,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
7days croissant 1 piece,Storable Product,Units,0.6,E-0%,0.2,,7dc,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
7days crossant strawbery vanila 80g,Storable Product,Units,0.99,E-0%,0.84,,7622201393793,Bakery,Bakery,1.0,,,0% EXEMPT,0.0
7up 1piece 1.5l,Storable Product,Units,1.9,F-18%,1.23,,5352201083074,Beverage,Beverage,1.0,,,18% G,1.0
7up 330ml,Storable Product,Units,0.9,F-18%,0.4,,5352201083050,Beverage,Beverage,1.0,,,18% G,1.0
7up 500ml,Storable Product,Units,1.3,F-18%,1.0,,5352201083012,Beverage,Beverage,1.0,,,18% G,1.0
7up Full packed 1.5l*6,Storable Product,Units,8.5,F-18%,7.38,,5352201283221,Beverage,Beverage,1.0,,,18% G,0.0
7up Zero Sugar 1piece 1.5l,Storable Product,Units,1.9,F-18%,1.23,,5352201086259,Beverage,Beverage,1.0,,,18% G,1.0
7up Zero Suger Full packed 1.5l*6,Storable Product,Units,8.5,F-18%,7.38,,5352201286253,Beverage,Beverage,1.0,,,18% G,6.0
8 N 1 KITCHEN ROLL JUMBO,Storable Product,Units,3.6,F-18%,2.56,,3570701510100,Household,Household,1.0,,,18% G,0.0
8.6 IPL pale lager  500ML,Storable Product,Units,1.6,F-18%,1.5,,8714800036214,Beverage,Beverage,1.0,,,18% G,0.0
8.6 Original 500ml,Storable Product,Units,1.8,F-18%,1.37,,8714800004114,Beverage,Beverage,1.0,,,18% G,1.0
8.6 Original 500ml f,Storable Product,Units,1.8,F-18%,1.37,,86beer1,Beverage,Beverage,1.0,,,18% G,0.0
8.6 red 500ml,Storable Product,Units,1.7,F-18%,1.5,,8714800014182,Beverage,Beverage,1.0,,,18% G,0.0
8.6. 1*4,Storable Product,Units,6.2,F-18%,4.8,,44044421,Beverage,Beverage,1.0,,,18% G,0.0
"""

# Extract top brands from our database
KNOWN_BRANDS = [
    'Alibaba', 'Alb', 'MTR', 'Ammachies', 'Double Horse', 'Reggia', 'Tony Delight', "Tony's Delight", "Tony's",
    'Barilla', 'Aashirvaad', 'Daily Delight', 'Kera', 'Bikano', 'Haldiram', "Haldiram's", 'Priya', 'Shan',
    'MDH', 'Patanjali', 'Brahmins', 'Ajmi', 'Kitchen Treasures', 'Periyar', 'Nitya', 'Viswas', 'Tata',
    'Eastern', 'Gits', 'Heera', 'TRS', 'Parle', 'Britannia', 'Nestle', 'Cadbury', 'Amica', 'Benna',
    'Mayor', 'Foster Clark', 'Lurpak', 'President', 'Balconi', 'Bono', 'Doritos', 'Lays', 'Pringles',
    'Indomie', 'Maggi', 'Aroy-D', 'Foco', 'KTC', 'Italiamo', 'Deluxe', 'Milbona', 'Alesto', 'Tastino',
    'Freeway', 'Chef Select', 'Crownfield', 'Maribel', 'Cien', 'Freshona', 'Campo Largo', 'Sol Mar',
    'Sondey', 'Combino', 'Fin Carré', 'Baresa', 'Dulano', 'Ocean Trader', 'Chira', 'Lovilio', 'Trattoria Alfredo',
    'Bellona', 'W5', 'Snack Day', 'Alesto', 'Vemondo', 'Cien', 'Formil'
]

# Sort brands by length descending so longer matching works first
KNOWN_BRANDS = sorted(KNOWN_BRANDS, key=len, reverse=True)

def extract_brand_for_product(product_name, description=''):
    text = f"{product_name} {description}"
    for b in KNOWN_BRANDS:
        pattern = r'\b' + re.escape(b) + r'\b'
        if re.search(pattern, text, re.I):
            # Clean standard capitalization
            if b.lower() in ['alb', 'alibaba']: return 'Alibaba'
            if b.lower() in ["tony's", "tony's delight", 'tony delight']: return 'Tony Delight'
            if b.lower() in ["haldiram's", 'haldiram']: return "Haldiram's"
            if b.lower() in ['double horse', 'dh']: return 'Double Horse'
            return b
    
    # Generic brand detection for Lidl private labels
    for lidl_brand in ['Italiamo', 'Deluxe', 'Milbona', 'Alesto', 'Tastino', 'Freeway', 'Chef Select', 'Crownfield', 'Maribel', 'Cien', 'Freshona', 'Campo Largo', 'Sol Mar', 'Sondey', 'Combino', 'Fin Carré', 'Baresa', 'Dulano', 'Ocean Trader', 'Lovilio', 'Trattoria Alfredo', 'Vemondo']:
        if re.search(r'\b' + re.escape(lidl_brand) + r'\b', text, re.I):
            return lidl_brand
            
    return 'Lidl Selection'

def main():
    print("🚀 Starting Lidl Malta Scraping & Matching Pipeline...")
    
    # 1. Gather all product URLs
    product_sitemap_url = 'https://www.lidl.com.mt/p/export/MT/en/product_sitemap.xml.gz'
    pages_sitemap_url = 'https://www.lidl.com.mt/explore/assets/s/pages_en-MT_mt.xml.gz'
    
    print("📥 Fetching Sitemaps...")
    p_sitemap_content = fetch_gz_url(product_sitemap_url)
    pages_sitemap_content = fetch_gz_url(pages_sitemap_url)
    
    all_urls = set(re.findall(r'<loc>(.*?)</loc>', p_sitemap_content))
    page_urls = set(re.findall(r'<loc>(.*?)</loc>', pages_sitemap_content))
    
    print(f"📦 Direct product sitemap items: {len(all_urls)}")
    print(f"📄 Pages to scan for additional products: {len(page_urls)}")
    
    # Crawl category & hub pages to discover any extra products
    def scan_page(u):
        html_doc = fetch_url(u, timeout=10)
        found = set()
        for m in re.findall(r'[\"\'\s/](?:p/)?([a-zA-Z0-9\-]+/p\d+)[\"\'\s/?#]', html_doc):
            found.add('https://www.lidl.com.mt/p/' + m.lstrip('/'))
        for m in re.findall(r'https?://(?:www\.)?lidl\.com\.mt/p/([a-zA-Z0-9\-]+/p\d+)', html_doc):
            found.add('https://www.lidl.com.mt/p/' + m)
        return found

    with ThreadPoolExecutor(max_workers=25) as executor:
        futures = [executor.submit(scan_page, pu) for pu in list(page_urls)[:150]]
        for f in as_completed(futures):
            try:
                all_urls.update(f.result())
            except Exception:
                pass
                
    url_list = sorted(list(all_urls))
    print(f"🎯 Total Unique Lidl Product URLs to scrape: {len(url_list)}")
    
    # 2. Scrape each product
    scraped_products = []
    print("⚡️ Scraping all product details concurrently...")
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(parse_lidl_product_page, url): url for url in url_list}
        count = 0
        for f in as_completed(futures):
            count += 1
            if count % 50 == 0 or count == len(url_list):
                print(f"Progress: {count}/{len(url_list)} scraped...")
            try:
                item = f.result()
                if item and item.get('Product Name'):
                    # Match brand
                    brand = extract_brand_for_product(item['Product Name'], item['Description'])
                    item['Brand Name'] = brand
                    scraped_products.append(item)
            except Exception as e:
                pass

    print(f"✅ Successfully scraped {len(scraped_products)} products from Lidl Malta!")

    # 3. Sort & Validate Data
    # Priority Categories Sort Order
    PRIORITY_ORDER = {
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
        'Groceries': 13
    }

    scraped_products.sort(key=lambda x: (PRIORITY_ORDER.get(x['Category'], 99), x['Product Name']))

    # 4. Prepare DataFrame
    columns = [
        'Product Name',
        'Brand Name',
        'Category',
        'Price',
        'Size',
        'Image URL',
        'Lidl URL',
        'Description'
    ]

    df = pd.DataFrame(scraped_products)
    # Ensure exact column order
    df = df[columns]

    # Clean empty / missing strings
    df = df.fillna('')

    # Save to CSV
    csv_path = '/Users/yatimehta/DESI BOLT/lidl_matched_products.csv'
    df.to_csv(csv_path, index=False, encoding='utf-8-sig', quoting=csv.QUOTE_MINIMAL)
    print(f"💾 Saved CSV: {csv_path}")

    # Save to Excel (.xlsx)
    xlsx_path = '/Users/yatimehta/DESI BOLT/lidl_matched_products.xlsx'
    df.to_excel(xlsx_path, index=False, engine='openpyxl')
    print(f"💾 Saved Excel (.xlsx): {xlsx_path}")

    # Also copy to artifacts directory
    artifact_dir = '/Users/yatimehta/.gemini/antigravity-ide/brain/316e7cd4-2df9-487d-a147-0a76d86a9eb5'
    if os.path.exists(artifact_dir):
        df.to_csv(os.path.join(artifact_dir, 'lidl_matched_products.csv'), index=False, encoding='utf-8-sig')
        df.to_excel(os.path.join(artifact_dir, 'lidl_matched_products.xlsx'), index=False, engine='openpyxl')
        print(f"💾 Exported copy to Artifacts directory: {artifact_dir}")

    print("\n--- Summary of Scraped Categories ---")
    cat_counts = df['Category'].value_counts()
    for cat, c in cat_counts.items():
        print(f" • {cat}: {c} items")

    print("\n--- Summary of Matched Brands ---")
    brand_counts = df['Brand Name'].value_counts()
    for b, c in brand_counts.items():
        print(f" • {b}: {c} items")

if __name__ == '__main__':
    main()
