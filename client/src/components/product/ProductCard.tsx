import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, Star, Zap, Leaf } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenModal }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const quantity = getItemQuantity(product.id);

  return (
    <div className="group bg-white rounded-3xl border border-[#F0E6D8] organic-card transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          {product.discountPercent && (
            <span className="bg-[#C81D25] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
              {product.discountPercent}% OFF
            </span>
          )}
          {product.isOrganic && (
            <span className="bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
              <Leaf className="w-2.5 h-2.5" /> Organic
            </span>
          )}
        </div>

        {product.origin && (
          <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full">
            {product.origin === 'Malta' ? '🇲🇹 Malta Fresh' : `🇮🇳 ${product.origin}`}
          </span>
        )}
      </div>

      {/* Product Image Clickable Area */}
      <div
        onClick={() => onOpenModal(product)}
        className="relative pt-[85%] bg-[#FAF4EC] cursor-pointer overflow-hidden"
      >
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />
        {/* Fast dispatch overlay icon */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-xs border border-amber-200">
          <Zap className="w-3 h-3 text-[#C81D25] fill-[#C81D25]" /> 15-30m
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Brand & Rating */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[9px]">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full text-amber-800 font-extrabold text-[10px] border border-amber-200">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-400 font-normal">({product.reviewCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => onOpenModal(product)}
            className="font-extrabold text-xs md:text-sm text-slate-900 line-clamp-2 hover:text-[#C81D25] cursor-pointer transition-colors leading-snug font-heading"
          >
            {product.name}
          </h3>

          {/* Unit / Weight */}
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {product.unit}
          </p>
        </div>

        {/* Pricing & Add to Cart Controls */}
        <div className="pt-2.5 border-t border-[#F0E6D8] flex items-center justify-between">
          <div>
            <div className="text-base md:text-lg font-black text-slate-900 leading-tight">
              €{product.price.toFixed(2)}
            </div>
            {product.originalPrice && (
              <div className="text-[11px] text-slate-400 line-through">
                €{product.originalPrice.toFixed(2)}
              </div>
            )}
          </div>

          {/* Cart Quantity Adjuster */}
          {quantity > 0 ? (
            <div className="flex items-center bg-[#C81D25] text-white rounded-2xl shadow-md overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, quantity - 1);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-black/20 active:scale-95 transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-black select-none">
                {quantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, 1);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-black/20 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product, 1);
              }}
              className="flex items-center gap-1.5 cute-gold-btn text-xs px-3.5 py-2 rounded-2xl transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#1F2421]" />
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
