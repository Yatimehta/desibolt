import React from 'react';
import { CategoryId } from '../../types';
import { CATEGORIES } from '../../data/categories';
import { Filter, Star, Leaf, Sparkles, Check, RotateCcw } from 'lucide-react';

interface ProductFilterSidebarProps {
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (cat: CategoryId | 'all') => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  onlyOrganic: boolean;
  setOnlyOrganic: (val: boolean) => void;
  onlyInStock: boolean;
  setOnlyInStock: (val: boolean) => void;
  minRating: number;
  setMinRating: (r: number) => void;
  sortBy: 'popular' | 'price-low' | 'price-high' | 'rating';
  setSortBy: (sort: 'popular' | 'price-low' | 'price-high' | 'rating') => void;
  onResetFilters: () => void;
}

export const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  priceRange,
  setPriceRange,
  onlyOrganic,
  setOnlyOrganic,
  onlyInStock,
  setOnlyInStock,
  minRating,
  setMinRating,
  sortBy,
  setSortBy,
  onResetFilters
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#E63946]" />
          <h3 className="font-black text-sm text-slate-900">Filters & Sort</h3>
        </div>
        <button
          onClick={onResetFilters}
          className="text-[11px] font-bold text-slate-400 hover:text-[#E63946] flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:border-[#E63946] outline-hidden"
        >
          <option value="popular">Most Popular & Best Sellers</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Customer Rating</option>
        </select>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Categories
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onSelectCategory('all')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
              selectedCategory === 'all'
                ? 'bg-red-50 text-[#E63946] font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>All Categories</span>
            <span className="text-[10px] text-slate-400">7,162</span>
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-red-50 text-[#E63946] font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{cat.shortName}</span>
              <span className="text-[10px] text-slate-400">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Max Price</span>
          <span className="text-[#E63946] font-black">€{priceRange[1].toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          step="0.5"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
          className="w-full accent-[#E63946] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>€1.00</span>
          <span>€30.00+</span>
        </div>
      </div>

      {/* Preferences & Dietary Toggles */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Preferences
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-700 font-semibold">
          <input
            type="checkbox"
            checked={onlyOrganic}
            onChange={(e) => setOnlyOrganic(e.target.checked)}
            className="w-4 h-4 rounded text-[#E63946] accent-[#E63946] cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            100% Organic Only
          </span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-700 font-semibold">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="w-4 h-4 rounded text-[#E63946] accent-[#E63946] cursor-pointer"
          />
          <span>In Stock Items Only</span>
        </label>
      </div>

      {/* Minimum Rating */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Rating
        </label>
        <div className="flex items-center gap-1.5">
          {[0, 4.0, 4.5, 4.8].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(rating)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                minRating === rating
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {rating === 0 ? (
                'All'
              ) : (
                <>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{rating}+</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
