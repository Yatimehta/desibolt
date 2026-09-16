/**
 * DESI BOLT — 404 Not Found Page
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Home, ArrowRight, Zap, ShoppingBag } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#FAF8F5]">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in">
        {/* Animated Brand Graphic */}
        <div className="w-24 h-24 bg-[#E63946] text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-red-500/25 relative animate-bounce">
          <Truck className="w-12 h-12" />
          <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 absolute -top-1 -right-1" />
        </div>

        <div>
          <span className="inline-block bg-red-100 text-[#E63946] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            404 • Page Not Found
          </span>
          <h1 className="text-3xl font-black text-slate-900 font-heading">
            Lost on the Malta Map?
          </h1>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back to the freshest groceries in Malta!
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#EAE4D9] shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider text-left">Popular Aisles</h3>
          <div className="grid grid-cols-2 gap-2 text-left">
            {[
              { name: 'Fresh Fruits & Veg', path: '/?cat=fresh-produce' },
              { name: 'Dairy & Paneer', path: '/?cat=dairy-paneer' },
              { name: 'Atta & Basmati Rice', path: '/?cat=rice-atta' },
              { name: 'Snacks & Sweets', path: '/?cat=snacks-sweets' },
            ].map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="text-xs font-semibold text-slate-700 hover:text-[#E63946] p-2.5 rounded-xl hover:bg-red-50/60 border border-slate-100 transition-colors flex items-center justify-between"
              >
                <span>{item.name}</span>
                <ArrowRight className="w-3 h-3 opacity-60" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="px-6 py-3.5 bg-[#E63946] hover:bg-[#D62839] text-white rounded-2xl text-xs font-black shadow-lg shadow-red-500/25 flex items-center gap-2 transition-all hover:scale-102"
          >
            <Home className="w-4 h-4" />
            <span>Return to Storefront</span>
          </Link>
          <Link
            to="/account/orders"
            className="px-6 py-3.5 bg-[#1F2421] hover:bg-black text-white rounded-2xl text-xs font-black flex items-center gap-2 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
