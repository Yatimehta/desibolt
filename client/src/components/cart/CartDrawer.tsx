import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Truck, 
  Sparkles, 
  Tag, 
  Check, 
  ShieldCheck,
  Zap
} from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: (appliedDiscount: number, promoCodeName: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    subtotal, 
    vatAmount, 
    deliveryFee, 
    freeDeliveryThreshold, 
    amountNeededForFreeDelivery, 
    isCartOpen, 
    setIsCartOpen 
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [promoError, setPromoError] = useState('');

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (promoCode.trim().toUpperCase() === 'DESIBOLT10') {
      if (subtotal < 35) {
        setPromoError('Promo code DESIBOLT10 requires a minimum order of €35');
        return;
      }
      setAppliedPromo('DESIBOLT10');
      setDiscountAmount(10.0);
    } else {
      setPromoError('Invalid promo code. Try DESIBOLT10');
    }
  };

  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);
  const progressPercent = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFECEF] text-[#E63946] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">Your Grocery Basket</h3>
                <p className="text-[11px] text-slate-500">{items.length} unique items</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-400 hover:text-red-500 font-semibold transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Free Delivery Progress Bar */}
          <div className="bg-[#FFF5F6] border-b border-red-100 p-3.5">
            <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
              <div className="flex items-center gap-1.5 text-slate-800">
                <Truck className="w-4 h-4 text-[#E63946]" />
                {amountNeededForFreeDelivery === 0 ? (
                  <span className="text-emerald-700">🎉 Congratulations! You unlocked Free Delivery in Malta</span>
                ) : (
                  <span>Add <strong className="text-[#E63946]">€{amountNeededForFreeDelivery.toFixed(2)}</strong> for FREE Delivery</span>
                )}
              </div>
              <span className="text-[11px] font-black text-[#E63946]">{Math.round(progressPercent)}%</span>
            </div>

            {/* Progress line */}
            <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#E63946] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-50 text-[#E63946] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-800 text-base">Your Basket is Empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore 7,000+ fresh produce, spices, paneer, and staples ready for 15-30 min delivery.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-[#E63946] hover:bg-[#D62839] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl border border-slate-200 bg-white hover:border-red-200 transition-colors"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-14 h-14 object-cover rounded-xl border border-slate-100 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-800 truncate">{product.name}</h4>
                    <p className="text-[10px] text-slate-400">{product.unit} • €{product.price.toFixed(2)}</p>
                    <div className="text-xs font-black text-slate-900 mt-1">
                      €{(product.price * quantity).toFixed(2)}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 shadow-xs text-xs font-bold"
                    >
                      {quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                    </button>
                    <span className="w-6 text-center text-xs font-black select-none">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-[#E63946] text-white flex items-center justify-center hover:bg-[#D62839] shadow-xs text-xs font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Promo code (Try: DESIBOLT10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full text-xs bg-white pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden uppercase font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {appliedPromo && (
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Code {appliedPromo} applied (-€10.00)
                  </p>
                )}
                {promoError && (
                  <p className="text-[11px] text-red-500 font-semibold">{promoError}</p>
                )}
              </form>

              {/* Bill Details */}
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-slate-800">€{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Promo Discount</span>
                    <span>-€{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    Delivery Fee
                    {deliveryFee === 0 && <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1 rounded-sm">FREE</span>}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {deliveryFee === 0 ? '€0.00' : `€${deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Incl. Malta VAT (18% / 0% on food)</span>
                  <span>€{vatAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>To Pay</span>
                  <span className="text-[#E63946] text-base">€{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout(discountAmount, appliedPromo || '');
                }}
                className="w-full bg-[#E63946] hover:bg-[#D62839] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-between px-5 transition-all hover:scale-101 active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Proceed to Checkout</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>€{finalTotal.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
