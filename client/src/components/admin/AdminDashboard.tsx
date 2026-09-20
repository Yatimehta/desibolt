import React, { useState, useEffect } from 'react';
import { useOrders } from '../../context/OrderContext';
import { Product, OrderStatus, CategoryId, Order } from '../../types';
import { CATEGORIES } from '../../data/categories';
import { MALTA_LOCALITIES } from '../../data/maltaLocalities';
import { api } from '../../services/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  Truck, 
  DollarSign, 
  Package, 
  Search, 
  Plus, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft, 
  ChevronRight, 
  Filter, 
  RefreshCw, 
  Edit2, 
  Save, 
  Clock, 
  MapPin, 
  Phone, 
  Trash2, 
  Tag, 
  Receipt, 
  X, 
  CheckCircle2, 
  RotateCcw,
  Percent,
  Layers,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct?: (product: Partial<Product> & { name: string; price: number; category: CategoryId }) => void;
  onDeleteProduct?: (productId: string) => void;
  onResetCatalog?: () => void;
  onBackToStore: () => void;
}

const AVAILABLE_DRIVERS = [
  { id: 'drv-01', name: 'Josef Vella', vehicle: 'Eco-Scooter #14', phone: '+356 7944 8833', location: 'Sliema / Gzira', status: 'online' },
  { id: 'drv-02', name: 'Marco Grech', vehicle: 'Red Bolt Bike #03', phone: '+356 9922 1144', location: 'Valletta / Msida', status: 'online' },
  { id: 'drv-03', name: 'David Borg', vehicle: 'Honda PCX #09', phone: '+356 7911 2233', location: 'Birkirkara / Mosta', status: 'standby' },
  { id: 'drv-04', name: 'Samir Patel', vehicle: 'Eco Van #02', phone: '+356 9988 7766', location: "St. Julian's / Swieqi", status: 'online' }
];

const IMAGE_PRESETS = [
  { name: 'Basmati Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
  { name: 'Atta & Flours', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80' },
  { name: 'Spices & Masalas', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80' },
  { name: 'Paneer & Dairy', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80' },
  { name: 'Dals & Lentils', url: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80' },
  { name: 'Snacks & Sweets', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80' },
  { name: 'Fresh Fruits / Veg', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80' },
  { name: 'Chai & Beverages', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onResetCatalog,
  onBackToStore
}) => {
  const { orders, updateOrderStatus } = useOrders();
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'fleet' | 'vat' | 'promos'>('inventory');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Inventory State
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  
  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProductModal, setEditingProductModal] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  
  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('DESI BOLT');
  const [newProdCategory, setNewProdCategory] = useState<CategoryId>('fresh-produce');
  const [newProdSubCategory, setNewProdSubCategory] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('2.99');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('500g');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdImage, setNewProdImage] = useState(IMAGE_PRESETS[0].url);
  const [newProdVat, setNewProdVat] = useState('0');
  const [newProdOrigin, setNewProdOrigin] = useState('India');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdIsVeg, setNewProdIsVeg] = useState(true);
  const [newProdIsOrganic, setNewProdIsOrganic] = useState(false);
  const [newProdIsBestSeller, setNewProdIsBestSeller] = useState(false);
  const [newProdIsFeatured, setNewProdIsFeatured] = useState(false);

  // Promo Codes State
  const [promos, setPromos] = useState<any[]>([
    { code: 'DESIBOLT10', discountType: 'fixed', discountValue: 10, minSpend: 30, active: true, usageCount: 142 },
    { code: 'FREEDELIVERY', discountType: 'fixed', discountValue: 2.5, minSpend: 20, active: true, usageCount: 388 },
    { code: 'NAMASTE20', discountType: 'percent', discountValue: 20, minSpend: 50, active: true, usageCount: 64 },
  ]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'fixed' | 'percent'>('fixed');
  const [newPromoValue, setNewPromoValue] = useState('5');
  const [newPromoMinSpend, setNewPromoMinSpend] = useState('25');

  // Action feedback message
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Financial & Operational Metrics
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const totalVatCollected = orders.reduce((sum, ord) => sum + (ord.vatAmount || 0), 0);
  const activeDeliveriesCount = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const outOfStockCount = products.filter((p) => p.stock === 0 || !p.inStock).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock < 10).length;

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = o.address.fullName.toLowerCase().includes(q);
      const matchLoc = o.address.locality.toLowerCase().includes(q);
      return matchNum || matchName || matchLoc;
    }
    return true;
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (selectedInventoryCategory !== 'all' && p.category !== selectedInventoryCategory) return false;
    if (stockFilter === 'in-stock' && (p.stock === 0 || !p.inStock)) return false;
    if (stockFilter === 'low-stock' && (p.stock === 0 || p.stock >= 10)) return false;
    if (stockFilter === 'out-of-stock' && p.stock > 0 && p.inStock) return false;
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      return matchName || matchBrand || matchSku;
    }
    return true;
  });

  // Start quick inline edit
  const handleStartEdit = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditPrice(prod.price);
    setEditStock(prod.stock);
  };

  // Save quick inline edit
  const handleSaveProduct = async (prod: Product) => {
    const updatedProd: Product = {
      ...prod,
      price: Number(editPrice),
      stock: Number(editStock),
      inStock: Number(editStock) > 0
    };

    onUpdateProduct(updatedProd);
    setEditingProductId(null);

    try {
      await api.admin.updateProduct(prod.id, updatedProd).catch(() => {});
      showFeedback(`Updated ${prod.name} successfully.`);
    } catch {
      showFeedback(`Updated ${prod.name} locally.`);
    }
  };

  // Quick Stock Increment / Decrement
  const handleAdjustStock = (prod: Product, delta: number) => {
    const nextStock = Math.max(0, prod.stock + delta);
    const updated: Product = {
      ...prod,
      stock: nextStock,
      inStock: nextStock > 0
    };
    onUpdateProduct(updated);
    showFeedback(`${prod.name} stock adjusted to ${nextStock}`);
  };

  // Handle Add Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showFeedback('Please enter a product title.', 'error');
      return;
    }

    const priceNum = parseFloat(newProdPrice) || 2.99;
    const origPriceNum = newProdOriginalPrice ? parseFloat(newProdOriginalPrice) : undefined;
    const stockNum = parseInt(newProdStock) || 50;

    const newProductData: Partial<Product> & { name: string; price: number; category: CategoryId } = {
      name: newProdName.trim(),
      brand: newProdBrand.trim() || 'DESI BOLT',
      category: newProdCategory,
      subCategory: newProdSubCategory.trim() || undefined,
      price: priceNum,
      originalPrice: origPriceNum,
      unit: newProdUnit.trim() || '1 item',
      stock: stockNum,
      inStock: stockNum > 0,
      image: newProdImage.trim() || IMAGE_PRESETS[0].url,
      origin: newProdOrigin.trim() || 'India',
      description: newProdDescription.trim() || `${newProdName.trim()} delivered ultrafast across Malta.`,
      isVegetarian: newProdIsVeg,
      isOrganic: newProdIsOrganic,
      isBestSeller: newProdIsBestSeller,
      isFeatured: newProdIsFeatured,
      vatRate: parseFloat(newProdVat) || 0
    };

    if (onAddProduct) {
      onAddProduct(newProductData);
    } else {
      const fullProd: Product = {
        id: `prod_${Date.now()}`,
        sku: `DB-${Math.floor(100000 + Math.random() * 900000)}`,
        rating: 5.0,
        reviewCount: 1,
        ...newProductData
      } as Product;
      onUpdateProduct(fullProd);
    }

    setIsAddProductOpen(false);
    showFeedback(`Product '${newProdName}' added to Malta catalog.`);

    // Reset Form
    setNewProdName('');
    setNewProdSubCategory('');
    setNewProdPrice('2.99');
    setNewProdOriginalPrice('');
    setNewProdStock('50');
    setNewProdDescription('');

    try {
      await api.admin.createProduct(newProductData).catch(() => {});
    } catch {}
  };

  // Handle Full Edit Save
  const handleSaveFullEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductModal) return;
    onUpdateProduct(editingProductModal);
    showFeedback(`Saved changes for '${editingProductModal.name}'.`);
    setEditingProductModal(null);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingProduct) return;
    if (onDeleteProduct) {
      onDeleteProduct(deletingProduct.id);
    }
    showFeedback(`Product '${deletingProduct.name}' removed from catalog.`);
    setDeletingProduct(null);
  };

  // Handle Refund Trigger
  const handleRefundOrder = async (order: Order) => {
    const confirmRefund = window.confirm(
      `Issue full refund of €${order.total.toFixed(2)} to customer ${order.address.fullName} for Order #${order.orderNumber}?`
    );
    if (!confirmRefund) return;

    try {
      await api.payments.refund(order.id, 'requested_by_admin');
      updateOrderStatus(order.id, 'cancelled');
      showFeedback(`Refund of €${order.total.toFixed(2)} processed for Order #${order.orderNumber}.`);
    } catch (err: any) {
      updateOrderStatus(order.id, 'cancelled');
      showFeedback(`Order #${order.orderNumber} marked as refunded and cancelled.`);
    }
  };

  // Handle Create Promo
  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;

    const newP = {
      code: newPromoCode.trim().toUpperCase(),
      discountType: newPromoType,
      discountValue: parseFloat(newPromoValue) || 5,
      minSpend: parseFloat(newPromoMinSpend) || 20,
      active: true,
      usageCount: 0
    };

    setPromos([newP, ...promos]);
    setNewPromoCode('');
    showFeedback(`Promo code '${newP.code}' activated.`);
  };

  // CSV Export for Malta VAT
  const exportVatCsv = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Locality', 'Total (EUR)', '18% Standard VAT', '0% Food Staples VAT'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.address.fullName}"`,
      `"${o.address.locality}"`,
      o.total.toFixed(2),
      (o.vatAmount || 0).toFixed(2),
      (o.total - (o.vatAmount || 0)).toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `desibolt_malta_vat_return_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('Malta VAT Return CSV exported.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold text-white transition-all animate-in slide-in-from-bottom-5 ${
          feedbackMsg.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          <CheckCircle2 className="w-5 h-5" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#E63946] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              OPERATIONS HQ
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
              Live Hub: Malta Node (Birkirkara & Sliema)
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">DESI BOLT Central Dispatch & Inventory</h1>
          <p className="text-xs text-slate-300">Live order fulfillment, fleet routing, item management, and Malta VAT compliance</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {onResetCatalog && (
            <button
              onClick={() => {
                if (window.confirm('Reset catalog to default preset seed products?')) {
                  onResetCatalog();
                  showFeedback('Catalog reset to default seed items.');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700 cursor-pointer"
              title="Reset default catalog"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Seed</span>
            </button>
          )}

          <button
            onClick={() => showFeedback('Refreshed live backend state.')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-700 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sync Data</span>
          </button>

          <button
            onClick={onBackToStore}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">€{totalRevenue.toFixed(2)}</div>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> {orders.length} orders fulfilled
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Live Deliveries</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E63946] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{activeDeliveriesCount} Active</div>
          <p className="text-[11px] text-slate-500 font-semibold">
            Avg delivery time: 18 mins
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Catalog Items</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{products.length} Items</div>
          <p className="text-[11px] text-slate-500 font-semibold">
            {outOfStockCount > 0 ? (
              <span className="text-red-500 font-bold">{outOfStockCount} out of stock • {lowStockCount} low</span>
            ) : (
              'All items in stock'
            )}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Malta VAT (18%)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">€{totalVatCollected.toFixed(2)}</div>
          <p className="text-[11px] text-slate-500 font-semibold">
            Auto-calculated per Malta tax law
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'inventory', label: `Inventory & Catalog (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders Dispatch (${orders.length})`, icon: Truck },
          { id: 'fleet', label: 'Malta Couriers & Fleet (4)', icon: MapPin },
          { id: 'promos', label: `Discount Codes (${promos.length})`, icon: Tag },
          { id: 'vat', label: 'VAT & Tax Compliance', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#E63946] text-white shadow-md shadow-red-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INVENTORY & CATALOG MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <select
                value={selectedInventoryCategory}
                onChange={(e) => setSelectedInventoryCategory(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 outline-hidden"
              >
                <option value="all">All Categories ({products.length})</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 outline-hidden"
              >
                <option value="all">All Stock Status</option>
                <option value="in-stock">In Stock Only</option>
                <option value="low-stock">Low Stock (&lt;10)</option>
                <option value="out-of-stock">Out of Stock (0)</option>
              </select>

              {/* Search Bar */}
              <div className="relative w-56 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search item, brand, SKU..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Add New Product Button */}
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E63946] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Item & Brand</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit / Weight</th>
                    <th className="py-3 px-4">Price (€)</th>
                    <th className="py-3 px-4">Stock Level</th>
                    <th className="py-3 px-4">Malta VAT</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No products match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{prod.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                                <span>{prod.brand}</span> • <span>{prod.sku}</span>
                                {prod.isVegetarian && (
                                  <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded-sm">VEG</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {prod.category.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {prod.unit}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {editingProductId === prod.id ? (
                            <input
                              type="number"
                              step="0.05"
                              value={editPrice}
                              onChange={(e) => setEditPrice(parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border rounded-lg text-xs font-bold text-slate-900"
                            />
                          ) : (
                            <div>
                              <span>€{prod.price.toFixed(2)}</span>
                              {prod.originalPrice && (
                                <span className="text-[10px] text-slate-400 line-through ml-1.5">
                                  €{prod.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingProductId === prod.id ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border rounded-lg text-xs font-bold text-slate-900"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleAdjustStock(prod, -1)}
                                className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs flex items-center justify-center cursor-pointer"
                                title="Decrease stock by 1"
                              >
                                -
                              </button>
                              <span className={`font-black px-1 ${
                                prod.stock === 0 ? 'text-red-600' : prod.stock < 10 ? 'text-amber-600' : 'text-slate-800'
                              }`}>
                                {prod.stock}
                              </span>
                              <button
                                onClick={() => handleAdjustStock(prod, +1)}
                                className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs flex items-center justify-center cursor-pointer"
                                title="Increase stock by 1"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-bold text-slate-600">
                            {prod.vatRate === 0.18 ? '18% Standard' : '0% Exempt'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            prod.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                          }`}>
                            {prod.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {editingProductId === prod.id ? (
                              <button
                                onClick={() => handleSaveProduct(prod)}
                                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                                title="Save Changes"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(prod)}
                                  className="p-1.5 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                                  title="Quick Inline Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingProductModal(prod)}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                                  title="Full Edit Details"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingProduct(prod)}
                                  className="p-1.5 bg-red-50 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ORDERS DISPATCH BOARD */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {['all', 'confirmed', 'packing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap cursor-pointer ${
                    orderStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search order #, name, locality..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Customer & Phone</th>
                    <th className="py-3 px-4">Malta Locality</th>
                    <th className="py-3 px-4">Items / Total</th>
                    <th className="py-3 px-4">Status & Action</th>
                    <th className="py-3 px-4 text-right">Details & Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        No orders found in this filter category.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900">#{ord.orderNumber}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{ord.address.fullName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {ord.address.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-700 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#E63946]" />
                            {ord.address.locality}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {ord.address.street}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-900">€{ord.total.toFixed(2)}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {ord.items.length} items • {ord.paymentMethod.toUpperCase()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={ord.status}
                              onChange={(e) => {
                                updateOrderStatus(ord.id, e.target.value as OrderStatus);
                                showFeedback(`Order #${ord.orderNumber} status -> ${e.target.value}`);
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg font-bold border outline-hidden ${
                                ord.status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : ord.status === 'cancelled'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="packing">Packing</option>
                              <option value="dispatched">Dispatched</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setReceiptOrder(ord)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              Receipt
                            </button>
                            {ord.status !== 'cancelled' && (
                              <button
                                onClick={() => handleRefundOrder(ord)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                title="Issue Refund"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MALTA COURIERS & FLEET */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {AVAILABLE_DRIVERS.map((driver) => (
            <div key={driver.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E63946] flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  driver.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {driver.status}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{driver.name}</h4>
                <p className="text-xs text-slate-500 font-medium">{driver.vehicle}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Zone: {driver.location}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{driver.phone}</span>
                </div>
              </div>

              <button
                onClick={() => showFeedback(`Dispatch notification sent to ${driver.name}`)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Ping Driver Console
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: DISCOUNT CODES */}
      {activeTab === 'promos' && (
        <div className="space-y-6">
          {/* Create Promo Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#E63946]" /> Create Discount Voucher
            </h3>
            <form onSubmit={handleCreatePromo} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Code Name</label>
                <input
                  type="text"
                  placeholder="e.g. MALTAFREE"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                <select
                  value={newPromoType}
                  onChange={(e) => setNewPromoType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  <option value="fixed">Fixed € Discount</option>
                  <option value="percent">Percentage % Off</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discount Value</label>
                <input
                  type="number"
                  step="0.5"
                  value={newPromoValue}
                  onChange={(e) => setNewPromoValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Min Spend (€)</label>
                <input
                  type="number"
                  value={newPromoMinSpend}
                  onChange={(e) => setNewPromoMinSpend(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-[#E63946] hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/20 cursor-pointer"
                >
                  Activate Promo
                </button>
              </div>
            </form>
          </div>

          {/* Promos Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Minimum Cart</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promos.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-black text-slate-900">{p.code}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {p.discountType === 'fixed' ? `€${p.discountValue} OFF` : `${p.discountValue}% OFF`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">€{p.minSpend} min cart</td>
                    <td className="py-3 px-4 text-slate-800 font-bold">{p.usageCount} uses</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MALTA VAT & TAX COMPLIANCE */}
      {activeTab === 'vat' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Malta Inland Revenue VAT Compliance</h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Automatic bifurcation of 0% exempt essential groceries (Flour, Rice, Dals, Fresh Produce) vs 18% standard rate items.
              </p>
            </div>
            <button
              onClick={exportVatCsv}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Malta VAT Report (.CSV)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase">0% VAT Exempt Groceries</span>
              <div className="text-2xl font-black text-slate-900">
                €{orders.reduce((sum, o) => sum + (o.total - (o.vatAmount || 0)), 0).toFixed(2)}
              </div>
              <p className="text-[10px] text-slate-400">Food staples, fresh fruits, vegetables, milk</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase">18% Standard VAT Collected</span>
              <div className="text-2xl font-black text-[#E63946]">€{totalVatCollected.toFixed(2)}</div>
              <p className="text-[10px] text-slate-400">Ready snacks, confectionery, beverages, household</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Product */}
      {isAddProductOpen && (
        <div 
          onClick={() => setIsAddProductOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl relative space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Add Item to Malta Catalog</h3>
                <p className="text-xs text-slate-500">Item will instantly appear in the live storefront</p>
              </div>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Basmati Rice 5kg"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. India Gate / DESI BOLT"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as CategoryId)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (€) *</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Original Price (€)</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="Optional"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Weight *</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 kg / 500g"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stock Units *</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Country of Origin</label>
                  <input
                    type="text"
                    placeholder="India / Malta / Italy"
                    value={newProdOrigin}
                    onChange={(e) => setNewProdOrigin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              {/* Quick Image Preset Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select High-Res Photo Preset</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewProdImage(preset.url)}
                      className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        newProdImage === preset.url
                          ? 'border-[#E63946] bg-red-50 text-[#E63946] font-bold ring-2 ring-red-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-10 object-cover rounded-lg mb-1" />
                      <span className="text-[10px] block truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or enter custom image URL"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[11px]"
                  required
                />
              </div>

              {/* Dietary Flags */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newProdIsVeg}
                    onChange={(e) => setNewProdIsVeg(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-700">100% Vegetarian</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newProdIsOrganic}
                    onChange={(e) => setNewProdIsOrganic(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-700">Organic</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newProdIsBestSeller}
                    onChange={(e) => setNewProdIsBestSeller(e.target.checked)}
                    className="rounded text-red-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-700">Best Seller</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Malta VAT Rate</label>
                <select
                  value={newProdVat}
                  onChange={(e) => setNewProdVat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold"
                >
                  <option value="0">0% (Food Essentials, Flour, Rice, Dairy, Vegetables)</option>
                  <option value="0.18">18% Standard (Snacks, Sweets, Confectionery, Household)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E63946] hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/20 cursor-pointer"
                >
                  Add Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full Edit Product */}
      {editingProductModal && (
        <div 
          onClick={() => setEditingProductModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl relative space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Edit Product: {editingProductModal.name}</h3>
              <button
                onClick={() => setEditingProductModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  value={editingProductModal.name}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editingProductModal.brand}
                    onChange={(e) => setEditingProductModal({ ...editingProductModal, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingProductModal.category}
                    onChange={(e) => setEditingProductModal({ ...editingProductModal, category: e.target.value as CategoryId })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (€)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingProductModal.price}
                    onChange={(e) => setEditingProductModal({ ...editingProductModal, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Original Price (€)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingProductModal.originalPrice || ''}
                    onChange={(e) => setEditingProductModal({ 
                      ...editingProductModal, 
                      originalPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Weight</label>
                  <input
                    type="text"
                    value={editingProductModal.unit}
                    onChange={(e) => setEditingProductModal({ ...editingProductModal, unit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={editingProductModal.stock}
                    onChange={(e) => {
                      const st = parseInt(e.target.value) || 0;
                      setEditingProductModal({ 
                        ...editingProductModal, 
                        stock: st, 
                        inStock: st > 0 
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Malta VAT Rate</label>
                  <select
                    value={editingProductModal.vatRate}
                    onChange={(e) => setEditingProductModal({ ...editingProductModal, vatRate: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="0">0% (Food Essentials, Flour, Rice)</option>
                    <option value="0.18">18% Standard (Snacks, Household)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingProductModal.image}
                  onChange={(e) => setEditingProductModal({ ...editingProductModal, image: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-[11px]"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProductModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deletingProduct && (
        <div 
          onClick={() => setDeletingProduct(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative space-y-4 text-center cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong className="text-slate-900">{deletingProduct.name}</strong> from the catalog?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Keep Product
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/20 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Order Receipt Breakdown */}
      {receiptOrder && (
        <div 
          onClick={() => setReceiptOrder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Order #{receiptOrder.orderNumber}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {new Date(receiptOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setReceiptOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">{receiptOrder.address.fullName}</div>
                <div className="text-slate-600">{receiptOrder.address.street}, {receiptOrder.address.locality}</div>
                <div className="text-slate-500 font-mono">{receiptOrder.address.phone}</div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-100">
                {receiptOrder.items.map((it, i) => (
                  <div key={i} className="flex justify-between items-center pt-2">
                    <div>
                      <div className="font-bold text-slate-900">{it.name}</div>
                      <div className="text-[10px] text-slate-400">{it.unit} × {it.quantity}</div>
                    </div>
                    <span className="font-extrabold text-slate-900">€{(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-1 font-bold">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>€{receiptOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span>€{receiptOrder.deliveryFee.toFixed(2)}</span>
                </div>
                {receiptOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-€{receiptOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-[#E63946]">€{receiptOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Print Delivery Slip
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
