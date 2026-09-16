import React from 'react';
import { Home, Grid, ShoppingBag, Truck, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';

interface MobileBottomNavProps {
  currentView: 'store' | 'tracking' | 'admin';
  setCurrentView: (view: 'store' | 'tracking' | 'admin') => void;
  onOpenCategories: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  setCurrentView,
  onOpenCategories
}) => {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { activeOrder } = useOrders();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-4 md:hidden shadow-lg">
      <div className="flex items-center justify-around">
        <button
          onClick={() => setCurrentView('store')}
          className={`flex flex-col items-center gap-1 ${
            currentView === 'store' ? 'text-[#E63946] font-bold' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={onOpenCategories}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px]">Categories</span>
        </button>

        {/* Floating Cart Button in Center */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative -top-4 bg-[#E63946] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40"
        >
          <ShoppingBag className="w-5 h-5" />
          {totalItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {totalItemsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentView('tracking')}
          className={`flex flex-col items-center gap-1 relative ${
            currentView === 'tracking' ? 'text-[#E63946] font-bold' : 'text-slate-400'
          }`}
        >
          <Truck className="w-5 h-5" />
          {activeOrder && (
            <span className="absolute top-0 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          )}
          <span className="text-[10px]">Track</span>
        </button>

        <button
          onClick={() => setCurrentView('admin')}
          className={`flex flex-col items-center gap-1 ${
            currentView === 'admin' ? 'text-[#E63946] font-bold' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Admin</span>
        </button>
      </div>
    </div>
  );
};
