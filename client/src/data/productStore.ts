import { ALL_PRODUCTS } from './products';
import { Product } from '../types';

const STORAGE_KEY = 'desibolt_catalog_v2';

/**
 * Retrieves the active catalog from localStorage or initial product seed
 */
export function getStoredProducts(): Product[] {
  try {
    // Clear legacy stale cache if present
    if (localStorage.getItem('desibolt_custom_catalog')) {
      localStorage.removeItem('desibolt_custom_catalog');
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load products from localStorage:', err);
  }
  return ALL_PRODUCTS;
}

/**
 * Persists updated products catalog to localStorage
 */
export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('desibolt_catalog_updated'));
  } catch (err) {
    console.error('Failed to save products to localStorage:', err);
  }
}

/**
 * Adds a new product to the catalog
 */
export function addProductToStore(productData: Partial<Product> & { name: string; price: number; category: Product['category'] }): Product {
  const current = getStoredProducts();
  const id = productData.id || `prod_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const newProduct: Product = {
    id,
    name: productData.name,
    brand: productData.brand || 'DESI BOLT Select',
    category: productData.category,
    subCategory: productData.subCategory || 'General',
    price: Number(productData.price) || 0,
    originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
    unit: productData.unit || '1 Pack',
    image: productData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    images: productData.images || (productData.image ? [productData.image] : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80']),
    stock: productData.stock !== undefined ? Number(productData.stock) : 50,
    inStock: productData.inStock !== undefined ? productData.inStock : (Number(productData.stock) > 0),
    rating: productData.rating || 4.8,
    reviewCount: productData.reviewCount || 12,
    description: productData.description || `${productData.name} - Premium quality grocery delivered fresh across Malta in 15-30 minutes.`,
    origin: productData.origin || 'India',
    isOrganic: !!productData.isOrganic,
    isVegetarian: productData.isVegetarian !== undefined ? productData.isVegetarian : true,
    isBestSeller: !!productData.isBestSeller,
    isFeatured: !!productData.isFeatured,
    isNew: productData.isNew !== undefined ? productData.isNew : true,
    discountPercent: productData.discountPercent,
    vatRate: productData.vatRate !== undefined ? Number(productData.vatRate) : 0,
    sku: productData.sku || `DB-${Math.floor(100000 + Math.random() * 900000)}`,
    barcode: productData.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
  };

  const updated = [newProduct, ...current];
  saveProducts(updated);
  return newProduct;
}

/**
 * Updates an existing product in the catalog
 */
export function updateProductInStore(updatedProduct: Product): Product[] {
  const current = getStoredProducts();
  const index = current.findIndex((p) => p.id === updatedProduct.id);
  let nextList: Product[];
  if (index >= 0) {
    nextList = [...current];
    nextList[index] = updatedProduct;
  } else {
    nextList = [updatedProduct, ...current];
  }
  saveProducts(nextList);
  return nextList;
}

/**
 * Deletes a product from the catalog
 */
export function deleteProductFromStore(productId: string): Product[] {
  const current = getStoredProducts();
  const nextList = current.filter((p) => p.id !== productId);
  saveProducts(nextList);
  return nextList;
}

/**
 * Resets the catalog to factory default
 */
export function resetCatalogToDefault(): Product[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('desibolt_catalog_updated'));
  } catch (err) {
    console.error('Failed to reset catalog:', err);
  }
  return ALL_PRODUCTS;
}
