import React from 'react';
import { CATEGORIES } from '../../data/categories';
import { CategoryId } from '../../types';
import { 
  Apple, 
  Milk, 
  Wheat, 
  Layers, 
  Flame, 
  Snowflake, 
  Cookie, 
  Coffee, 
  UtensilsCrossed, 
  Sparkles,
  LayoutGrid
} from 'lucide-react';

interface CategorySliderProps {
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (catId: CategoryId | 'all') => void;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Apple': return <Apple className="w-5 h-5" />;
    case 'Milk': return <Milk className="w-5 h-5" />;
    case 'Wheat': return <Wheat className="w-5 h-5" />;
    case 'Layers': return <Layers className="w-5 h-5" />;
    case 'Flame': return <Flame className="w-5 h-5" />;
    case 'Snowflake': return <Snowflake className="w-5 h-5" />;
    case 'Cookie': return <Cookie className="w-5 h-5" />;
    case 'Coffee': return <Coffee className="w-5 h-5" />;
    case 'UtensilsCrossed': return <UtensilsCrossed className="w-5 h-5" />;
    case 'Sparkles': return <Sparkles className="w-5 h-5" />;
    default: return <Sparkles className="w-5 h-5" />;
  }
};

export const CategorySlider: React.FC<CategorySliderProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight font-heading">
            Shop by Category
          </h2>
          <p className="text-xs text-slate-500 font-medium">7,000+ farm fresh produce & groceries in Malta</p>
        </div>

        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs font-extrabold text-[#C81D25] hover:underline flex items-center gap-1"
          >
            Show All Categories
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Categories */}
      <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth">
        {/* All Products Pill */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shrink-0 transition-all font-bold text-xs border ${
            selectedCategory === 'all'
              ? 'bg-[#C81D25] text-white border-[#C81D25] shadow-lg shadow-red-500/20 scale-102'
              : 'bg-white text-slate-800 hover:bg-[#FAF4EC] border-[#F0E6D8] warm-card-shadow'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-red-50 text-[#C81D25]'
          }`}>
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="font-extrabold">All Catalog</div>
            <div className={`text-[10px] font-medium ${selectedCategory === 'all' ? 'text-white/80' : 'text-slate-400'}`}>
              7,162 items
            </div>
          </div>
        </button>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shrink-0 transition-all font-bold text-xs border ${
                isSelected
                  ? 'bg-[#C81D25] text-white border-[#C81D25] shadow-lg shadow-red-500/20 scale-102'
                  : 'bg-white text-slate-800 hover:bg-[#FAF4EC] border-[#F0E6D8] warm-card-shadow'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isSelected ? 'bg-[#F4B41A] text-[#1F2421]' : 'bg-red-50 text-[#C81D25]'
              }`}>
                {getCategoryIcon(cat.icon)}
              </div>
              <div className="text-left">
                <div className="whitespace-nowrap font-extrabold">{cat.shortName}</div>
                <div className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {cat.count}+ items
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
