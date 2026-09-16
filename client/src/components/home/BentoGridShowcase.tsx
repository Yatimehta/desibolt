import React from 'react';
import { ArrowRight, Leaf, Sparkles, Zap, Flame, Milk, Wheat } from 'lucide-react';
import { CategoryId } from '../../types';

interface BentoGridShowcaseProps {
  onSelectCategory: (catId: CategoryId) => void;
}

export const BentoGridShowcase: React.FC<BentoGridShowcaseProps> = ({ onSelectCategory }) => {
  return (
    <section className="space-y-4 my-10">
      <div className="flex items-end justify-between">
        <div>
          <span className="font-cursive text-2xl text-[#E63946] font-bold">
            Organic & Fresh
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#1F2421] tracking-tight font-heading">
            Featured Collections & Farm Produce
          </h2>
        </div>
      </div>

      {/* Bento Grid layout (Matching Image 2 & 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Large Feature 1: Maltese Farm Vegetables */}
        <div 
          onClick={() => onSelectCategory('fresh-produce')}
          className="md:col-span-1 bg-[#EAF2E8] rounded-3xl p-6 border border-[#D5E5D2] flex flex-col justify-between cursor-pointer group hover:shadow-xl transition-all relative overflow-hidden"
        >
          <div className="space-y-2 z-10">
            <span className="inline-flex items-center gap-1 bg-white/80 backdrop-blur-xs text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <Leaf className="w-3 h-3" /> Farm Direct (Malta)
            </span>
            <h3 className="text-xl font-black text-[#1F2421] group-hover:text-[#E63946] transition-colors leading-tight">
              Fresh Fruits & Vegetables
            </h3>
            <p className="text-xs text-[#556B2F]">840+ vine-ripened tomatoes, okra, chillies & fresh greens.</p>
          </div>

          <div className="relative mt-4 pt-[60%] rounded-2xl overflow-hidden shadow-md">
            <img
              src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80"
              alt="Farm Produce"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-bold text-emerald-900 pt-2 z-10">
            <span>Explore 840+ items</span>
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center group-hover:bg-[#E63946] group-hover:text-white transition-colors shadow-xs">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Column 2 & 3 Split Bento */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 2: Atta & Royal Basmati */}
          <div 
            onClick={() => onSelectCategory('rice-atta')}
            className="bg-[#FFF4E8] rounded-3xl p-5 border border-[#FDE3C8] flex flex-col justify-between cursor-pointer group hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 bg-white/80 px-2 py-0.5 rounded-full">Aged 2 Years</span>
                <h4 className="font-extrabold text-base text-[#1F2421] mt-1 group-hover:text-[#E63946] transition-colors">
                  Basmati Rice & Sharbati Atta
                </h4>
                <p className="text-[11px] text-[#8C6239] mt-0.5">Daawat, Aashirvaad & India Gate</p>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-white text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                <Wheat className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 relative pt-[45%] rounded-xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
                alt="Basmati Rice"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Card 3: Spices & Masalas */}
          <div 
            onClick={() => onSelectCategory('spices-masalas')}
            className="bg-[#FFF0F2] rounded-3xl p-5 border border-[#FCD2D8] flex flex-col justify-between cursor-pointer group hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#E63946] bg-white/80 px-2 py-0.5 rounded-full">1,240+ Spices</span>
                <h4 className="font-extrabold text-base text-[#1F2421] mt-1 group-hover:text-[#E63946] transition-colors">
                  MDH & Whole Masalas
                </h4>
                <p className="text-[11px] text-[#9E2A2B] mt-0.5">Cardamom, Kashmiri mirch & saffron</p>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-white text-[#E63946] flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 relative pt-[45%] rounded-xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80"
                alt="Spices"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Card 4: Dairy & Paneer */}
          <div 
            onClick={() => onSelectCategory('dairy-paneer')}
            className="bg-[#F0F4F8] rounded-3xl p-5 border border-[#DCE4EC] flex flex-col justify-between cursor-pointer group hover:shadow-xl transition-all sm:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-800 bg-white/80 px-2 py-0.5 rounded-full">Fresh Daily</span>
                <h4 className="font-extrabold text-base text-[#1F2421] mt-1 group-hover:text-[#E63946] transition-colors">
                  Amul Malai Paneer & Benna Fresh Milk
                </h4>
                <p className="text-[11px] text-slate-500">Pure cow ghee, fresh curd, and artisanal Maltese cheeses</p>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-white text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
                <Milk className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
