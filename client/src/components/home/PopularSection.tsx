import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, Star, Zap } from 'lucide-react';

interface PopularSectionProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
}

export const PopularSection: React.FC<PopularSectionProps> = ({ products, onSelectProduct }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  // Pick top 8 products: prioritize iconic best-sellers (Bhujia, Amul Ghee, Basmati Rice, Spices, etc.)
  const popularItems = React.useMemo(() => {
    const withImages = products.filter((p) => p.image && !p.image.includes('unsplash') && p.image.startsWith('http'));
    if (withImages.length === 0) return products.slice(0, 8);

    const usedIds = new Set<string>();
    const featured: Product[] = [];

    const findItem = (filterFn: (p: Product) => boolean) => {
      const found = withImages.find(p => !usedIds.has(p.id) && filterFn(p));
      if (found) {
        usedIds.add(found.id);
        featured.push(found);
      }
      return found;
    };

    // 1. Aloo Bhujia / Bhujia
    findItem(p => /bhujia/i.test(p.name));

    // 2. Amul Ghee / Pure Ghee
    findItem(p => /ghee/i.test(p.name) && (/amul/i.test(p.name) || /amrut/i.test(p.name) || /pure/i.test(p.name)))
      || findItem(p => /ghee/i.test(p.name));

    // 3. Amul Dairy Favourite (Butter / Basundi / Paneer)
    findItem(p => (/amul/i.test(p.name) || /amul/i.test(p.brand)) && !/ghee/i.test(p.name));

    // 4. Premium Basmati Rice (Kohinoor, Royal, Ankur)
    findItem(p => /basmati/i.test(p.name));

    // 5. Authentic Indian Spices & Masala (Biryani Masala, Curry Masala, Garam Masala)
    findItem(p => /masala|mirch|haldi|curry powder/i.test(p.name) && p.price < 15);

    // 6. Dal & Pulses or Atta staples
    findItem(p => /dal|channa|moong|urad|toor|atta/i.test(p.name));

    // 7. Popular Sweets & Namkeen snacks
    findItem(p => /jamun|rasgulla|laddu|namkeen|biscuit|cookie/i.test(p.name) || p.category === 'snacks-sweets');

    // 8. Traditional Tea & Chai (Wagh Bakri, Red Label, Tea)
    findItem(p => /tea|chai|coffee/i.test(p.name) || p.category === 'beverages-tea');

    // Fill remaining slots up to 8 with other products with clean images
    for (const p of withImages) {
      if (featured.length >= 8) break;
      if (!usedIds.has(p.id) && p.price > 1 && p.price < 40) {
        usedIds.add(p.id);
        featured.push(p);
      }
    }

    return featured.slice(0, 8);
  }, [products]);

  if (popularItems.length === 0) return null;

  return (
    <section className="bg-[#607345] rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden my-12">
      {/* Background Decorative Organic Herb Vectors */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-black/10 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8 space-y-1 relative z-10">
        <h2 className="font-cursive text-3xl sm:text-4xl md:text-5xl font-bold text-[#FFEAA7]">
          Top Picks from Our Catalog
        </h2>
        <p className="text-xs text-[#E8F0DE] font-medium">
          Daily top picks ordered by hundreds of Maltese households
        </p>
      </div>

      {/* 8 Product Cards in responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 relative z-10">
        {popularItems.map((prod) => {
          const quantity = getItemQuantity(prod.id);

          return (
            <div
              key={prod.id}
              onClick={() => onSelectProduct(prod)}
              className="bg-white text-[#1F2421] rounded-2xl p-4 shadow-lg flex flex-col justify-between cursor-pointer hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1"
            >
              <div>
                {/* Product Image */}
                <div className="relative pt-[80%] rounded-xl overflow-hidden bg-slate-50 mb-3">
                  <img
                    src={prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'}
                    alt={prod.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
                    }}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  {prod.discountPercent && (
                    <span className="absolute top-2 left-2 bg-[#E63946] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      {prod.discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-[#E63946] transition-colors">
                  {prod.name}
                </h3>

                {/* Subtitle / Unit */}
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  {prod.unit} • {prod.brand}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{prod.rating} ({prod.reviewCount})</span>
                </div>
              </div>

              {/* Pricing & Add Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    €{prod.price.toFixed(2)}
                  </div>
                  {prod.originalPrice && (
                    <div className="text-[10px] text-slate-400 line-through">
                      €{prod.originalPrice.toFixed(2)}
                    </div>
                  )}
                </div>

                {quantity > 0 ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center bg-[#E63946] text-white rounded-xl shadow-xs overflow-hidden"
                  >
                    <button
                      onClick={() => updateQuantity(prod.id, quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-black/15 active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-black select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => addToCart(prod, 1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-black/15 active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(prod, 1);
                    }}
                    className="w-8 h-8 rounded-xl bg-[#E63946] hover:bg-[#D62828] text-white flex items-center justify-center transition-all active:scale-95 shadow-xs"
                    title="Add to basket"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
