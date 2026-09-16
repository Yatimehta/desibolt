import React from 'react';
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
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#E63946] rounded-xl flex items-center justify-center shadow-md">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tight text-white">
                DESI <span className="text-[#E63946]">BOLT</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Malta’s premier ultrafast grocery delivery app. Bringing the freshest local produce, authentic Indian spices, basmati rice, lentils, dairy, and 7,000+ daily essentials directly to your doorstep in minutes.
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E63946]" />
                <span>Central Dark Store: Triq Il-Wied, Msida / Birkirkara, Malta</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Customer Care & WhatsApp: +356 9912 3456 / +356 2133 8899</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>orders@desibolt.com.mt • VAT: MT-28938210</span>
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

          {/* Payment & Security */}
          <div>
            <h5 className="font-bold text-sm text-white mb-3">Secure Payments</h5>
            <p className="text-xs text-slate-400 mb-3">
              PCI-DSS 256-bit encrypted checkout with instant Stripe, Apple Pay, Revolut & Cash on Delivery.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Stripe', 'Visa', 'Mastercard', 'Apple Pay', 'Google Pay', 'Revolut', 'Cash on Delivery'].map((pay) => (
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
