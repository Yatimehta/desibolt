import React, { useState } from 'react';
import { Product, Review } from '../../types';
import { useCart } from '../../context/CartContext';
import { 
  X, 
  Star, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Zap, 
  Truck, 
  Leaf, 
  CheckCircle2, 
  MessageSquare, 
  Send
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  
  const [reviews, setReviews] = useState<Review[]>(product?.reviews || [
    { id: 'r_init', userName: 'Maria Debono', rating: 5, comment: 'Exceptional quality and delivered super fast in Sliema!', date: '3 days ago', verified: true }
  ]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newName, setNewName] = useState('');
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  if (!product) return null;

  const currentQty = getItemQuantity(product.id);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !newName.trim()) return;

    const newRev: Review = {
      id: `rev_${Date.now()}`,
      userName: newName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      date: 'Just now',
      verified: true
    };

    setReviews([newRev, ...reviews]);
    setNewComment('');
    setNewName('');
    setShowReviewSuccess(true);
    setTimeout(() => setShowReviewSuccess(false), 3000);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col relative cursor-default"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Product Image Gallery Preview */}
          <div className="space-y-3">
            <div className="relative pt-[100%] rounded-2xl overflow-hidden bg-slate-50 border border-slate-200">
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {product.discountPercent && (
                <span className="absolute top-3 left-3 bg-[#E63946] text-white text-xs font-black px-2.5 py-1 rounded-lg">
                  {product.discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Quick Guarantees */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <Zap className="w-4 h-4 text-[#E63946]" />
                <span>15-30 Min Fast Delivery Across Malta</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400" />
                <span>Free delivery on orders over €30</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>100% Authentic Quality Guarantee</span>
              </div>
            </div>
          </div>

          {/* Product Details & Actions */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>{product.brand}</span>
                <span>•</span>
                <span className="text-[#E63946]">{product.category.replace('-', ' ')}</span>
              </div>

              <h2 className="text-xl font-black text-slate-900 leading-snug">
                {product.name}
              </h2>

              {/* Rating and Badges */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-amber-700 font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                  <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
                </div>

                {product.isOrganic && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold">
                    <Leaf className="w-3 h-3" /> Organic
                  </span>
                )}

                {product.origin && (
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs font-semibold">
                    Origin: {product.origin}
                  </span>
                )}
              </div>

              {/* Price & Unit */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-black text-slate-900">
                  €{product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    €{product.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  / {product.unit}
                </span>
              </div>

              {/* Malta VAT & SKU info */}
              <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-2">
                <span>SKU: {product.sku}</span>
                <span>•</span>
                <span>VAT Rate: {product.vatRate > 0 ? `${product.vatRate * 100}%` : '0% (Exempt Staple)'}</span>
              </div>

              {/* Description */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Product Details
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Bottom Add to Cart Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              {currentQty > 0 ? (
                <div className="flex-1 flex items-center justify-between bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 ml-3">In Cart:</span>
                  <div className="flex items-center bg-[#E63946] text-white rounded-xl shadow-xs">
                    <button
                      onClick={() => updateQuantity(product.id, currentQty - 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-black/15"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-black select-none">
                      {currentQty}
                    </span>
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-black/15"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product, 1)}
                  className="w-full bg-[#E63946] hover:bg-[#D62839] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all hover:scale-101"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Cart (€{product.price.toFixed(2)})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#E63946]" />
              <span>Customer Reviews & Ratings ({reviews.length})</span>
            </h3>
          </div>

          {/* Add Review Form */}
          <form onSubmit={handleAddReview} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700">Write a Review</div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-0.5 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-4 h-4 ${star <= newRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Your Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden"
                required
              />
              <input
                type="text"
                placeholder="Your Review (e.g. Fresh & fast delivery)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Post Review
            </button>

            {showReviewSuccess && (
              <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Thank you! Your review has been added.
              </div>
            )}
          </form>

          {/* Reviews List */}
          <div className="space-y-2.5 max-h-48 overflow-y-auto">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{rev.userName}</span>
                  <span className="text-[10px] text-slate-400">{rev.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <p className="text-slate-600">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
