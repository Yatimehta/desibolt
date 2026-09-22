import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Zap, ShieldCheck, Phone, Mail, MapPin, Heart, Clock } from 'lucide-react';
import { MALTA_LOCALITIES } from '../../data/maltaLocalities';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1D2A44] text-white border-t border-slate-800 pt-12 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Value Propositions Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-700/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E63946]/20 text-[#E63946] flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">15-30 Min Delivery</h4>
              <p className="text-xs text-slate-400">Lightning fast across all Malta localities</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">100% Fresh Guarantee</h4>
              <p className="text-xs text-slate-400">Fresh farm produce or instant refund</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Free Delivery Over €30</h4>
              <p className="text-xs text-slate-400">Save on daily and weekly grocery orders</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Open 7 Days a Week</h4>
              <p className="text-xs text-slate-400">7:00 AM – Midnight every single day</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-10">
          {/* Company & Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="DESI BOLT" 
                className="w-12 h-12 rounded-2xl object-cover shadow-lg border border-red-500/30" 
              />
              <span className="font-black text-2xl tracking-tight text-white">
                DESI <span className="text-[#E63946]">BOLT</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Malta’s premier ultrafast grocery delivery service. Fresh local produce, authentic Indian spices, basmati rice, lentils, dairy, and 7,000+ daily essentials ordered directly via WhatsApp and delivered to your doorstep in minutes.
            </p>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#E63946] shrink-0 mt-0.5" />
                <span>Central Store: Triq weid il ghajan  haz zabbar</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  href="https://wa.me/35679791146" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>WhatsApp & Direct Orders: +356 79791146 (79791146)</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>orders@desibolt.com.mt • VAT: 30384926</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h5 className="font-bold text-sm text-white mb-3">Popular Categories</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-white cursor-pointer transition-colors">Fresh Farm Fruits & Veg</li>
              <li className="hover:text-white cursor-pointer transition-colors">Atta, Rice & Ghee</li>
              <li className="hover:text-white cursor-pointer transition-colors">MDH & Everest Masalas</li>
              <li className="hover:text-white cursor-pointer transition-colors">Amul Paneer & Benna Dairy</li>
              <li className="hover:text-white cursor-pointer transition-colors">Haldiram Sweets & Snacks</li>
              <li className="hover:text-white cursor-pointer transition-colors">Frozen Samosas & Breads</li>
            </ul>
          </div>

          {/* Delivery Zones in Malta */}
          <div>
            <h5 className="font-bold text-sm text-white mb-3">Malta Delivery Zones</h5>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {MALTA_LOCALITIES.slice(0, 6).map((loc) => (
                <li key={loc.name} className="flex justify-between">
                  <span>{loc.name}</span>
                  <span className="text-emerald-400 font-semibold">{loc.deliveryTimeMins}m</span>
                </li>
              ))}
              <li className="text-[11px] text-[#E63946] font-semibold pt-1">+ 20 More Localities</li>
            </ul>
          </div>

          {/* Direct WhatsApp Ordering */}
          <div>
            <h5 className="font-bold text-sm text-white mb-3">WhatsApp Fast Ordering</h5>
            <p className="text-xs text-slate-400 mb-3">
              No online card payment required! Directly send your grocery order to our team on WhatsApp for instant confirmation and dispatch.
            </p>
            <a
              href="https://wa.me/35679791146"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
            >
              <Phone className="w-3.5 h-3.5 fill-white" />
              <span>Order via WhatsApp (+356 79791146)</span>
            </a>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['WhatsApp Direct', 'Cash on Delivery', 'Revolut / Bank Transfer'].map((pay) => (
                <span key={pay} className="px-2 py-1 bg-slate-800 text-[10px] font-semibold rounded-md border border-slate-700 text-slate-300">
                  {pay}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} DESI BOLT Ltd. All rights reserved. Registered in Malta (C-98214).
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            Crafted with <Heart className="w-3.5 h-3.5 text-[#E63946] fill-[#E63946]" /> for Malta's food lovers
          </div>
        </div>
      </div>
    </footer>
  );
};
