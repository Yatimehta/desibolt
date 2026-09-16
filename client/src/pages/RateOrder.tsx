/**
 * DESI BOLT — Standalone Rate Order Page (/rate/:orderNumber)
 */
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, CheckCircle2, Truck, ArrowRight, Zap, Home } from 'lucide-react';

export const RateOrder: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#FAF8F5]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EAE4D9] shadow-xl text-center space-y-6">
        {submitted ? (
          <div className="space-y-4 py-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1">
                RATING SUBMITTED
              </span>
              <h2 className="text-xl font-black text-slate-900 font-heading">Thank You!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your feedback for order <strong>#{orderNumber || 'DB-MLT-88329'}</strong> helps our Malta couriers maintain 15-minute speed.
              </p>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E63946] text-white text-xs font-black rounded-2xl shadow-md shadow-red-500/20 hover:bg-[#D62839] transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Back to Store</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 fill-current" />
            </div>

            <div>
              <span className="inline-block bg-red-100 text-[#E63946] text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1">
                DELIVERY FEEDBACK
              </span>
              <h1 className="text-xl font-black text-slate-900 font-heading">Rate Your Delivery</h1>
              <p className="text-xs text-slate-500 mt-0.5">Order #{orderNumber || 'DB-MLT-88329'}</p>
            </div>

            {/* Star Selector */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 hover:scale-120 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the courier's speed, packaging condition, and temperature control?"
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden font-medium resize-none h-24"
            />

            <button
              type="submit"
              className="w-full py-3.5 bg-[#E63946] hover:bg-[#D62839] text-white text-xs font-black rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all hover:scale-101"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Submit {rating}★ Delivery Rating</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
