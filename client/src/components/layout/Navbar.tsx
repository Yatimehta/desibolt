import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Clock, 
  Zap, 
  User as UserIcon, 
  Truck, 
  ChevronDown,
  X,
  Phone,
  Sparkles,
  LogOut,
  History,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { MALTA_LOCALITIES } from '../../data/maltaLocalities';
import { Product } from '../../types';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: any) => void;
  onSelectProduct: (product: Product) => void;
  allProducts: Product[];
  currentView: 'store' | 'tracking';
  setCurrentView: (view: 'store' | 'tracking') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onSelectProduct,
  allProducts,
  currentView,
  setCurrentView
}) => {
  const { totalItemsCount, subtotal, setIsCartOpen } = useCart();
  const { user, login, logout } = useAuth();
  const { activeOrder } = useOrders();

  const [selectedLocality, setSelectedLocality] = useState(MALTA_LOCALITIES[0]);
  const [isLocalityOpen, setIsLocalityOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = searchQuery.trim().length > 1
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF4EC]/95 backdrop-blur-md border-b border-[#F0E6D8] transition-all">
      {/* Top Subtle Announcement & Hotline Bar */}
      <div className="bg-[#1F2421] text-white text-xs py-1.5 px-3 sm:px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-[#C81D25] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <Zap className="w-2.5 h-2.5 fill-current" /> 15-30 MINS
            </span>
            <span className="text-[11px] text-[#E0DBCF] hidden sm:inline truncate">
              Farm Fresh Produce & 7,000+ Groceries Delivered Across Malta
            </span>
            <span className="text-[11px] text-[#E0DBCF] sm:hidden truncate">
              15-30m Malta Grocery Delivery
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#E0DBCF] shrink-0">
            <a href="tel:+35699123456" className="hover:text-white flex items-center gap-1 font-semibold">
              <Phone className="w-3 h-3 text-[#F4B41A]" />
              <span>+356 9912 3456</span>
            </a>
            <span className="hidden md:inline bg-white/10 px-2 py-0.5 rounded-sm text-[#FFE8EC] font-semibold">
              USE CODE: DESIBOLT10 (€10 OFF)
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar Top Row */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-2.5 md:py-3 flex items-center justify-between gap-2 md:gap-6">
        
        {/* Brand Logo with Cursive Accent */}
        <Link 
          to="/"
          onClick={() => setCurrentView('store')}
          className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 bg-[#C81D25] rounded-2xl flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <div className="relative">
              <Truck className="w-4 h-4 md:w-5 md:h-5 text-white" />
              <Zap className="w-2 md:w-2.5 h-2 md:h-2.5 text-[#F4B41A] fill-[#F4B41A] absolute -top-1 -right-1" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-[#1F2421] font-heading">
                DESI <span className="text-[#C81D25]">BOLT</span>
              </span>
              <span className="font-cursive text-base md:text-lg text-[#C81D25] font-bold">Fresh</span>
            </div>
          </div>
        </Link>

        {/* Desktop Malta Locality Selector */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setIsLocalityOpen(!isLocalityOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white hover:bg-[#F2ECE1] transition-colors border border-[#E2DAD0] text-left text-xs shadow-2xs"
          >
            <div className="w-7 h-7 rounded-xl bg-[#FFF0F2] text-[#E63946] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[#7A746B] font-medium flex items-center gap-1">
                Deliver to: <span className="font-bold text-[#1F2421]">{selectedLocality.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~{selectedLocality.deliveryTimeMins} mins (Bolt)
              </div>
            </div>
          </button>

          {isLocalityOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsLocalityOpen(false)} 
              />
              <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-[#E2DAD0] py-2 z-50 animate-in fade-in">
                <div className="px-3 py-1.5 text-xs font-bold text-[#1F2421] border-b border-[#EAE4D9]">
                  Select Delivery Locality in Malta
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {MALTA_LOCALITIES.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        setSelectedLocality(loc);
                        setIsLocalityOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F5] transition-colors ${
                        selectedLocality.name === loc.name ? 'bg-red-50 text-[#E63946] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{loc.name} <span className="text-[10px] text-slate-400">({loc.region})</span></span>
                      <span className="text-[11px] text-emerald-700 font-semibold">{loc.deliveryTimeMins}m</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Desktop Search Bar */}
        <div className="relative hidden md:block flex-1 max-w-xl mx-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8C8275] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search 7,000+ farm fresh fruits, paneer, basmati, spices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
              className="w-full bg-white hover:bg-[#FAF8F5] focus:bg-white text-xs md:text-sm pl-10 pr-9 py-2.5 rounded-2xl border border-[#E0D8CC] focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden transition-all text-[#1F2421] placeholder:text-[#9A9184] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-[#E0D8CC] overflow-hidden z-50">
              <div className="px-3 py-2 bg-[#FAF8F5] border-b border-[#EAE4D9] text-[11px] font-semibold text-slate-500 flex justify-between">
                <span>Matching Products ({searchResults.length})</span>
                <span className="text-[#E63946] font-bold">15-30 Min Dispatch</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onMouseDown={() => {
                      onSelectProduct(p);
                      setSearchQuery('');
                    }}
                    className="p-2.5 flex items-center justify-between hover:bg-red-50/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200" />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.brand} • {p.unit}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#E63946]">€{p.price.toFixed(2)}</div>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-sm font-semibold">In Stock</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          
          {/* Mobile Locality Selector Chip */}
          <div className="relative block lg:hidden">
            <button
              onClick={() => setIsLocalityOpen(!isLocalityOpen)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/90 border border-[#E2DAD0] text-xs font-bold text-slate-800 shadow-2xs hover:bg-white"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E63946] shrink-0" />
              <span className="max-w-[72px] sm:max-w-[110px] truncate text-[11px]">{selectedLocality.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
            {isLocalityOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsLocalityOpen(false)} 
                />
                <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-[#E2DAD0] py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 text-xs font-bold text-[#1F2421] border-b border-[#EAE4D9]">
                    Select Delivery Locality
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {MALTA_LOCALITIES.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => {
                          setSelectedLocality(loc);
                          setIsLocalityOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F5] transition-colors ${
                          selectedLocality.name === loc.name ? 'bg-red-50 text-[#E63946] font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{loc.name} <span className="text-[10px] text-slate-400">({loc.region})</span></span>
                        <span className="text-[11px] text-emerald-700 font-semibold">{loc.deliveryTimeMins}m</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop Live Order Tracker Link */}
          {activeOrder && (
            <Link
              to="/tracking"
              onClick={() => setCurrentView('tracking')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                currentView === 'tracking'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Truck className="w-4 h-4 text-[#E63946]" />
              <span className="hidden sm:inline">Track Order</span>
              <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded-md">
                {activeOrder.estimatedDeliveryTime}
              </span>
            </Link>
          )}

          {/* User Account Dropdown (Desktop) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl hover:bg-white text-slate-700 text-xs font-semibold transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#EAE4D9] flex items-center justify-center text-[#1F2421]">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="hidden xl:inline">{user ? user.name.split(' ')[0] : 'Account'}</span>
            </button>

            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-[#E0D8CC] py-2 z-50 animate-in fade-in">
                {user ? (
                  <>
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#E63946]">
                        {user.role === 'admin' ? 'Store Administrator' : 'Verified Member (Malta)'}
                      </span>
                    </div>

                    <Link
                      to="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Profile & Addresses</span>
                    </Link>

                    <Link
                      to="/account/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Order History</span>
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-slate-600">Sign in for saved Malta addresses and 1-click checkout</p>
                    <Link
                      to="/login"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block w-full bg-[#E63946] hover:bg-[#D62828] text-white text-xs font-bold py-2 rounded-xl text-center transition-colors shadow-xs"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded-xl text-center transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2.5 bg-[#C81D25] hover:bg-[#A81219] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-bold text-xs shadow-lg shadow-red-500/20 hover:shadow-xl transition-all shrink-0"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F4B41A] text-[#1F2421] font-black text-[10px] w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[9px] opacity-90 uppercase tracking-wider leading-tight font-extrabold text-amber-200">My Basket</div>
              <div className="text-xs font-black leading-tight">€{subtotal.toFixed(2)}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Row 2: Full-width Mobile Search Bar (Below Header on Phone) */}
      <div className="md:hidden px-3.5 pb-2.5 pt-0.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search 7,000+ groceries, fruits, paneer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
            className="w-full bg-white hover:bg-[#FAF8F5] focus:bg-white text-xs pl-10 pr-9 py-2.5 rounded-2xl border border-[#E0D8CC] focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden transition-all text-[#1F2421] placeholder:text-[#9A9184] shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Autocomplete Dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute left-3.5 right-3.5 mt-2 bg-white rounded-2xl shadow-2xl border border-[#E0D8CC] overflow-hidden z-50">
            <div className="px-3 py-2 bg-[#FAF8F5] border-b border-[#EAE4D9] text-[11px] font-semibold text-slate-500 flex justify-between">
              <span>Matching Products ({searchResults.length})</span>
              <span className="text-[#E63946] font-bold">15-30 Min Dispatch</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onMouseDown={() => {
                    onSelectProduct(p);
                    setSearchQuery('');
                  }}
                  className="p-2.5 flex items-center justify-between hover:bg-red-50/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 line-clamp-1">{p.name}</div>
                      <div className="text-[10px] text-slate-500">{p.brand} • {p.unit}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#E63946]">€{p.price.toFixed(2)}</div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-sm font-semibold">In Stock</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
