import React, { useState, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { ALL_PRODUCTS } from './data/products';
import { Product, CategoryId, Order } from './types';
import { getStoredProducts, saveProducts } from './data/productStore';

// Error Boundary & 404
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotFound } from './pages/NotFound';

// Standalone Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Account } from './pages/Account';
import { OrderHistory } from './pages/OrderHistory';
import { RateOrder } from './pages/RateOrder';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Home & Product Components
import { HeroBanner } from './components/home/HeroBanner';
import { CategorySlider } from './components/home/CategorySlider';
import { BentoGridShowcase } from './components/home/BentoGridShowcase';
import { PopularSection } from './components/home/PopularSection';
import { ProductCard } from './components/product/ProductCard';
import { ProductModal } from './components/product/ProductModal';
import { ProductFilterSidebar } from './components/product/ProductFilterSidebar';

// Cart, Checkout & Tracking Components
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { LiveOrderTracking } from './components/tracking/LiveOrderTracking';
import { AdminPortal } from './pages/AdminPortal';

import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';

export const StorefrontView: React.FC<{
  currentView: 'store' | 'tracking';
  setCurrentView: (v: 'store' | 'tracking') => void;
}> = ({ currentView, setCurrentView }) => {
  const [productsList, setProductsList] = useState<Product[]>(getStoredProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const normalizeProduct = (item: any): Product => {
      // Clean Shopify CDN image URLs (unescape backslashes from JSON)
      let primaryImg = item.image || (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : (item.image_url || ''));
      if (typeof primaryImg === 'string') primaryImg = primaryImg.replace(/\\/g, '');
      const allImgs = Array.isArray(item.images) && item.images.length > 0
        ? item.images.map((i: string) => typeof i === 'string' ? i.replace(/\\/g, '') : i)
        : [primaryImg];
      const catId = typeof item.category === 'object' && item.category !== null
        ? (item.category.slug || item.category.id || 'snacks-sweets')
        : (item.category_id || item.category || 'snacks-sweets');

      return {
        id: String(item.id || Math.random()),
        name: item.name || '',
        brand: item.brand || 'DESI BOLT',
        category: catId as CategoryId,
        subCategory: item.subCategory || (typeof item.category === 'object' ? item.category?.name : undefined),
        price: Number(item.price) || 0,
        originalPrice: item.originalPrice || item.compareAtPrice ? Number(item.originalPrice || item.compareAtPrice) : undefined,
        unit: item.unit || item.weight || '1 unit',
        image: primaryImg,
        images: allImgs,
        stock: item.stock !== undefined ? Number(item.stock) : 50,
        inStock: item.inStock !== undefined ? item.inStock : (Number(item.stock) > 0),
        rating: Number(item.rating || item.avgRating || 4.9),
        reviewCount: Number(item.reviewCount ?? item.reviews?.length ?? 18),
        description: item.description || '',
        origin: item.origin || item.originCountry || 'India',
        isOrganic: !!item.isOrganic,
        isVegetarian: item.isVegetarian !== undefined ? !!item.isVegetarian : true,
        isBestSeller: !!item.isBestSeller,
        isFeatured: !!item.isFeatured,
        vatRate: Number(item.vatRate ?? item.vat_rate ?? 0),
        sku: item.sku || `DB-${item.id}`
      };
    };

    // Fetch ALL products via progressive pagination (renders first batch immediately, then appends remaining)
    const fetchAllProducts = async () => {
      const allAccumulated: Product[] = [];
      let page = 1;
      const pageSize = 500;

      try {
        while (isMounted) {
          const res = await fetch(`/api/products?limit=${pageSize}&page=${page}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const batch = Array.isArray(data) ? data : (data.products || []);
          if (batch.length === 0) break;

          const normalizedBatch = batch.map(normalizeProduct);
          allAccumulated.push(...normalizedBatch);

          if (isMounted) {
            setProductsList([...allAccumulated]);
          }

          if (batch.length < pageSize || allAccumulated.length >= (data.total || Infinity)) break;
          page++;
        }

        if (allAccumulated.length > 0 && allAccumulated.length <= 2000) {
          saveProducts(allAccumulated);
        }
      } catch (err: any) {
        console.warn('[DESI BOLT] Dynamic API fetch fallback:', err.message);
      }
    };

    fetchAllProducts();

    // Listen to custom catalog events
    const handleUpdate = () => {
      setProductsList(getStoredProducts());
    };
    window.addEventListener('desibolt_catalog_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('desibolt_catalog_updated', handleUpdate);
    };
  }, []);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30]);
  const [onlyOrganic, setOnlyOrganic] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');

  // Catalog Pagination State (48 products per page for smooth scrolling)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 48;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceRange, onlyOrganic, onlyInStock, minRating, sortBy]);

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedPromoName, setAppliedPromoName] = useState('');

  const catalogRef = useRef<HTMLDivElement>(null);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return productsList
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchCat) return false;
        }

        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        if (p.price > priceRange[1]) {
          return false;
        }

        if (onlyOrganic && !p.isOrganic) {
          return false;
        }

        if (onlyInStock && (!p.inStock || p.stock <= 0)) {
          return false;
        }

        if (minRating > 0 && p.rating < minRating) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      });
  }, [productsList, searchQuery, selectedCategory, priceRange, onlyOrganic, onlyInStock, minRating, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 30]);
    setOnlyOrganic(false);
    setOnlyInStock(false);
    setMinRating(0);
    setSortBy('popular');
    setSearchQuery('');
  };

  const handleScrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpdateProduct = (updated: Product) => {
    setProductsList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleOrderCompleted = (_order: Order) => {
    setCurrentView('tracking');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1F2421]">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSelectProduct={(p) => setSelectedProduct(p)}
        allProducts={productsList}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <main className="flex-1 pb-16">
        {currentView === 'store' && (
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-12">
            <HeroBanner
              products={productsList}
              onCategorySelect={(cat) => {
                setSelectedCategory(cat as any);
                handleScrollToCatalog();
              }}
              onExploreClick={handleScrollToCatalog}
            />

            <PopularSection
              products={productsList}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />

            <BentoGridShowcase
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                handleScrollToCatalog();
              }}
            />

            <CategorySlider
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                handleScrollToCatalog();
              }}
            />

            <div ref={catalogRef} className="pt-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-24">
                  <ProductFilterSidebar
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    onlyOrganic={onlyOrganic}
                    setOnlyOrganic={setOnlyOrganic}
                    onlyInStock={onlyInStock}
                    setOnlyInStock={setOnlyInStock}
                    minRating={minRating}
                    setMinRating={setMinRating}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    onResetFilters={handleResetFilters}
                  />
                </div>
              </div>

              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white p-4 rounded-3xl border border-[#EAE4D9] shadow-2xs flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2 font-heading">
                      <span>
                        {selectedCategory === 'all'
                          ? 'All Groceries & Daily Essentials'
                          : selectedCategory.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs bg-red-50 text-[#E63946] font-bold px-2 py-0.5 rounded-full border border-red-200">
                        {filteredProducts.length} Items Found
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">⚡️ Dispatched in 15-30m across all Malta localities</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#E0D8CC] bg-[#FAF8F5] focus:border-[#E63946] outline-hidden"
                    >
                      <option value="popular">🔥 Best Sellers</option>
                      <option value="price-low">Lowest Price (€)</option>
                      <option value="price-high">Highest Price (€)</option>
                      <option value="rating">⭐️ Top Rated</option>
                    </select>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE4D9] space-y-3">
                    <div className="w-14 h-14 rounded-full bg-red-50 text-[#E63946] flex items-center justify-center mx-auto">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-base text-slate-800">No products match your criteria</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try clearing some filters or searching for staples like "Atta", "Paneer", "Rice", or "MDH".
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-5 py-2 bg-[#E63946] text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 md:gap-4">
                      {paginatedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onOpenModal={(p) => setSelectedProduct(p)}
                        />
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-8 pt-6 border-t border-[#EAE4D9] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-500 font-semibold">
                          Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of <span className="text-slate-900 font-bold">{filteredProducts.length.toLocaleString()}</span> products
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-xl border border-[#E0D8CC] bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Prev</span>
                          </button>

                          {/* Page Number Pills */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                            .reduce((acc: (number | string)[], p, idx, arr) => {
                              if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                                acc.push('...');
                              }
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((item, idx) => typeof item === 'number' ? (
                              <button
                                key={idx}
                                onClick={() => handlePageChange(item)}
                                className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                                  currentPage === item
                                    ? 'bg-[#E63946] text-white shadow-md shadow-red-500/20'
                                    : 'bg-white border border-[#E0D8CC] text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {item}
                              </button>
                            ) : (
                              <span key={idx} className="px-1 text-slate-400 font-bold text-xs select-none">
                                •••
                              </span>
                            ))}

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-xl border border-[#E0D8CC] bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'tracking' && (
          <LiveOrderTracking onBackToStore={() => setCurrentView('store')} />
        )}
      </main>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <CartDrawer
        onProceedToCheckout={(discount, promo) => {
          setAppliedDiscount(discount);
          setAppliedPromoName(promo);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        discountAmount={appliedDiscount}
        promoCode={appliedPromoName}
        onOrderCompleted={handleOrderCompleted}
      />

      <MobileBottomNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenCategories={() => {
          setCurrentView('store');
          handleScrollToCatalog();
        }}
      />

      <Footer />
    </div>
  );
};

export const MainRoutes: React.FC = () => {
  const [currentView, setCurrentView] = useState<'store' | 'tracking'>('store');

  return (
    <Routes>
      <Route path="/" element={<StorefrontView currentView={currentView} setCurrentView={setCurrentView} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/account" element={<Account />} />
      <Route path="/account/orders" element={<OrderHistory />} />
      <Route path="/rate/:orderNumber" element={<RateOrder />} />
      <Route path="/tracking" element={<StorefrontView currentView="tracking" setCurrentView={setCurrentView} />} />
      <Route path="/admin" element={<AdminPortal />} />
      <Route path="/admin/login" element={<AdminPortal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <MainRoutes />
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
