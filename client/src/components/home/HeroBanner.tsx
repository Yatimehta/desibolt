import React from 'react';
import { Zap, Clock, ShieldCheck, ArrowRight, Plus, Sparkles, Truck, CheckCircle2, Heart, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { BASE_PRODUCTS } from '../../data/products';

interface HeroBannerProps {
  onCategorySelect: (categoryId: string) => void;
  onExploreClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onCategorySelect, onExploreClick }) => {
  const { addToCart } = useCart();

  const tomatoItem = BASE_PRODUCTS.find((p) => p.id === 'fp-01') || BASE_PRODUCTS[0];
  const mangoItem = BASE_PRODUCTS.find((p) => p.id === 'fp-06') || BASE_PRODUCTS[1];
  const paneerItem = BASE_PRODUCTS.find((p) => p.id === 'dy-02') || BASE_PRODUCTS[2];

  return (
    <div className="-mt-4 md:-mt-6 space-y-12">
      {/* ========================================================================= */}
      {/* 1. RICH CRIMSON HERO BANNER (Inspired by Reference UI Designs)            */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl md:rounded-[2.5rem] hero-crimson-bg text-white shadow-2xl border border-red-800/40">
        
        {/* Floating Decorative Background Ingredients & Sparkles */}
        <div className="absolute top-6 left-10 text-3xl opacity-30 select-none animate-float-subtle">🌿</div>
        <div className="absolute bottom-12 left-1/3 text-2xl opacity-40 select-none animate-float-reverse">🧄</div>
        <div className="absolute top-12 right-1/4 text-3xl opacity-30 select-none animate-float-subtle">🌶️</div>
        <div className="absolute bottom-6 right-10 text-2xl opacity-40 select-none animate-float-reverse">🌾</div>

        {/* Large Decorative Watermark behind Content */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[110px] sm:text-[180px] md:text-[220px] font-cursive font-bold text-white/5 select-none pointer-events-none whitespace-nowrap z-0">
          DesiBolt
        </div>

        <div className="relative z-10 p-6 sm:p-10 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* Left Column: Typography & Gold CTA Buttons */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/20 shadow-inner">
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span className="tracking-wide">MALTA’S INSTANT GROCERY COURIER</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-heading leading-tight">
                Fresh & Yummy.<br />
                <span className="font-cursive text-4xl sm:text-6xl md:text-7xl text-[#F4B41A] font-bold drop-shadow-md">
                  Delivered in 15-30m!
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed max-w-md mx-auto lg:mx-0 font-medium">
                The fastest way to get farm-fresh organic produce, paneer, basmati, and 7,000+ groceries delivered right to your kitchen in Malta.
              </p>
            </div>

            {/* CTA Button Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl cute-gold-btn text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all"
              >
                <span>Order Now & Save Time</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onCategorySelect('fp')}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/25 transition-all"
              >
                Explore Organic Fruits
              </button>
            </div>

            {/* Trust Footer line */}
            <div className="flex items-center justify-center lg:justify-start gap-3 text-[11px] text-red-100/80 pt-1 font-semibold">
              <span className="flex items-center gap-1 text-amber-300">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> 4.9/5 Rating
              </span>
              <span>•</span>
              <span>⚡️ Sliema, Valletta, St. Julian's & All Malta</span>
            </div>
          </div>

          {/* Center Column: High-Res Appetizing Gourmet Platter */}
          <div className="lg:col-span-4 relative flex items-center justify-center py-2">
            {/* Soft Radial Glow */}
            <div className="absolute w-72 h-72 rounded-full bg-amber-400/20 blur-3xl -z-10" />

            {/* Central Platter Circle with Gold Border */}
            <div className="relative w-64 sm:w-80 md:w-88 rounded-full p-2 bg-white/10 backdrop-blur-md border-4 border-[#F4B41A]/60 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80"
                alt="Fresh Organic Grocery Dish Platter"
                className="w-full h-full object-cover rounded-full aspect-square shadow-inner"
              />

              {/* Floating Badge 1: 100% Farm Fresh */}
              <div className="absolute -top-3 -left-2 bg-white text-[#1F2421] px-3.5 py-1.5 rounded-2xl shadow-xl border border-amber-200 text-[11px] font-extrabold flex items-center gap-1.5 animate-float-subtle">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                100% Farm Organic
              </div>

              {/* Floating Badge 2: Bolt Speed */}
              <div className="absolute -bottom-3 -right-2 bg-[#F4B41A] text-[#1F2421] px-4 py-2 rounded-2xl shadow-xl text-xs font-black flex items-center gap-1.5 animate-float-reverse">
                <Zap className="w-4 h-4 fill-current text-[#1F2421]" />
                15-30 Min Dispatch
              </div>
            </div>
          </div>

          {/* Right Column: Floating Cute Interactive Item Cards */}
          <div className="lg:col-span-3 space-y-3.5 max-w-xs mx-auto w-full">
            <div className="text-xs font-black tracking-wider uppercase text-amber-300 text-center lg:text-left flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Fast Add Favorites
            </div>

            {/* Card 1 */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg text-[#1F2421] flex items-center justify-between gap-3 border border-white/40 hover:scale-102 transition-transform">
              <img
                src={tomatoItem.image}
                alt={tomatoItem.name}
                className="w-13 h-13 object-cover rounded-xl border border-slate-100"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{tomatoItem.name}</h4>
                <p className="text-[10px] text-slate-500">{tomatoItem.unit}</p>
                <div className="text-xs font-black text-[#C81D25] mt-0.5">€{tomatoItem.price.toFixed(2)}</div>
              </div>
              <button
                onClick={() => addToCart(tomatoItem, 1)}
                className="w-8 h-8 rounded-xl cute-gold-btn flex items-center justify-center transition-colors shadow-xs"
                title="Add to cart"
              >
                <Plus className="w-4 h-4 text-[#1F2421]" />
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg text-[#1F2421] flex items-center justify-between gap-3 border border-white/40 hover:scale-102 transition-transform">
              <img
                src={mangoItem.image}
                alt={mangoItem.name}
                className="w-13 h-13 object-cover rounded-xl border border-slate-100"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{mangoItem.name}</h4>
                <p className="text-[10px] text-slate-500">Ratnagiri Mango Box</p>
                <div className="text-xs font-black text-[#C81D25] mt-0.5">€{mangoItem.price.toFixed(2)}</div>
              </div>
              <button
                onClick={() => addToCart(mangoItem, 1)}
                className="w-8 h-8 rounded-xl cute-gold-btn flex items-center justify-center transition-colors shadow-xs"
                title="Add to cart"
              >
                <Plus className="w-4 h-4 text-[#1F2421]" />
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg text-[#1F2421] flex items-center justify-between gap-3 border border-white/40 hover:scale-102 transition-transform">
              <img
                src={paneerItem.image}
                alt={paneerItem.name}
                className="w-13 h-13 object-cover rounded-xl border border-slate-100"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{paneerItem.name}</h4>
                <p className="text-[10px] text-slate-500">{paneerItem.unit}</p>
                <div className="text-xs font-black text-[#C81D25] mt-0.5">€{paneerItem.price.toFixed(2)}</div>
              </div>
              <button
                onClick={() => addToCart(paneerItem, 1)}
                className="w-8 h-8 rounded-xl cute-gold-btn flex items-center justify-center transition-colors shadow-xs"
                title="Add to cart"
              >
                <Plus className="w-4 h-4 text-[#1F2421]" />
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Wave Divider */}
        <div className="w-full overflow-hidden leading-none z-10 relative text-[#FAF4EC]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-8 sm:h-12 fill-current">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.94,130.83,121.6,201,115.8,242.06,112.41,282.8,92.5,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THREE ELEGANT FEATURE PILL CARDS (Direct Match to Reference UI)        */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Why Malta Chooses <span className="text-[#C81D25]">Desi Bolt</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">Lightning delivery, huge assortment, and 100% farm freshness</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {/* Card 1: Fast Delivery */}
          <div className="bg-[#4A6B34] text-white rounded-3xl p-6 shadow-xl border border-[#5C7F42] relative overflow-hidden group hover:-translate-y-1.5 transition-transform">
            <div className="font-cursive text-3xl font-bold text-[#F4B41A] mb-1">
              Ultra Fast Express
            </div>
            <h3 className="font-extrabold text-base text-white mb-2">15-30 Min Fast Delivery</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
              Direct dispatch from dark hubs in Sliema & Valletta with real-time courier GPS map tracking.
            </p>
          </div>

          {/* Card 2: Wide Assortment */}
          <div className="bg-[#5C6B37] text-white rounded-3xl p-6 shadow-xl border border-[#6E7F44] relative overflow-hidden group hover:-translate-y-1.5 transition-transform">
            <div className="font-cursive text-3xl font-bold text-[#F4B41A] mb-1">
              7,000+ Grocery Items
            </div>
            <h3 className="font-extrabold text-base text-white mb-2">Huge Indian & Local Catalog</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
              From fresh farm vegetables & paneer to Sharbati wheat, premium basmati, spices & sweet treats.
            </p>
          </div>

          {/* Card 3: Quality Check */}
          <div className="bg-[#C81D25] text-white rounded-3xl p-6 shadow-xl border border-red-700 relative overflow-hidden group hover:-translate-y-1.5 transition-transform">
            <div className="font-cursive text-3xl font-bold text-[#F4B41A] mb-1">
              Guaranteed Freshness
            </div>
            <h3 className="font-extrabold text-base text-white mb-2">100% Organic & Certified</h3>
            <p className="text-xs text-red-100/90 leading-relaxed font-medium">
              Strict daily quality checks. If anything isn't fresh, we replace or refund it immediately!
            </p>
          </div>
        </div>

        {/* Center Exploration Button */}
        <div className="text-center pt-2">
          <button
            onClick={onExploreClick}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full cute-crimson-btn text-xs sm:text-sm transition-all"
          >
            <span>Explore Full 7,000+ Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MOBILE APP & ABOUT US SHOWCASE                                         */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-8 md:p-12 border border-[#F0E6D8] warm-card-shadow max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Dual 3D Smartphone Mockups */}
          <div className="md:col-span-6 flex items-center justify-center gap-3">
            {/* Phone 1 */}
            <div className="w-36 sm:w-44 bg-slate-900 rounded-[2.5rem] p-2.5 shadow-2xl border-4 border-slate-800 rotate-[-8deg] hover:rotate-0 transition-transform duration-500">
              <div className="bg-[#FAF4EC] rounded-[2rem] overflow-hidden p-2.5 space-y-2 text-[10px]">
                <div className="flex items-center justify-between text-[#C81D25] font-bold">
                  <span>DESI BOLT</span>
                  <Zap className="w-3 h-3 fill-current" />
                </div>
                <div className="bg-[#C81D25] text-white rounded-xl p-2 text-center font-extrabold text-[9px] shadow-xs">
                  15-30m Express Delivery
                </div>
                <div className="space-y-1.5">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <img src={tomatoItem.image} className="w-6 h-6 rounded-md object-cover" />
                    <div className="truncate font-semibold text-slate-800">Maltese Tomatoes</div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <img src={mangoItem.image} className="w-6 h-6 rounded-md object-cover" />
                    <div className="truncate font-semibold text-slate-800">Mango Box</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2 */}
            <div className="w-36 sm:w-44 bg-slate-900 rounded-[2.5rem] p-2.5 shadow-2xl border-4 border-slate-800 rotate-[6deg] hover:rotate-0 transition-transform duration-500">
              <div className="bg-[#FAF4EC] rounded-[2rem] overflow-hidden p-2.5 space-y-2 text-[10px]">
                <div className="text-[10px] font-black text-slate-800">Basket Total (€24.50)</div>
                <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded-lg text-[9px] font-bold border border-emerald-200">
                  ✓ Free Delivery Unlocked!
                </div>
                <div className="cute-gold-btn text-[#1F2421] rounded-xl p-2 text-center font-black text-[9px]">
                  Pay with Stripe / Revolut
                </div>
              </div>
            </div>
          </div>

          {/* About Narrative */}
          <div className="md:col-span-6 space-y-4 text-center md:text-left">
            <div className="font-cursive text-3xl sm:text-4xl font-bold text-[#C81D25]">
              About Desi Bolt Malta
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              We bring fresh groceries, organic vegetables, authentic Indian pulses, dairy, and snacks straight to your door without the wait. Sourced directly from certified Maltese organic farms and trusted heritage brands.
            </p>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Order on desktop or mobile and watch your courier deliver your basket in 15 to 30 minutes!
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> 15-30m Lightning Dispatch
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> Free Delivery &gt; €30
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
