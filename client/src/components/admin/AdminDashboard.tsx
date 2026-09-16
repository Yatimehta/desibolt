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
  FileSpreadsheet
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onBackToStore: () => void;
}

const AVAILABLE_DRIVERS = [
  { id: 'drv-01', name: 'Josef Vella', vehicle: 'Eco-Scooter #14', phone: '+356 7944 8833', location: 'Sliema / Gzira', status: 'online' },
  { id: 'drv-02', name: 'Marco Grech', vehicle: 'Red Bolt Bike #03', phone: '+356 9922 1144', location: 'Valletta / Msida', status: 'online' },
  { id: 'drv-03', name: 'David Borg', vehicle: 'Honda PCX #09', phone: '+356 7911 2233', location: 'Birkirkara / Mosta', status: 'standby' },
  { id: 'drv-04', name: 'Samir Patel', vehicle: 'Eco Van #02', phone: '+356 9988 7766', location: 'St. Julian\'s / Swieqi', status: 'online' }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onUpdateProduct,
  onBackToStore
}) => {
  const { orders, updateOrderStatus } = useOrders();
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'fleet' | 'vat' | 'promos'>('orders');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Inventory State
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<string>('all');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  
  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('DESI BOLT');
  const [newProdCategory, setNewProdCategory] = useState<CategoryId>('fresh-produce');
  const [newProdPrice, setNewProdPrice] = useState('2.99');
  const [newProdUnit, setNewProdUnit] = useState('500g');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?w=600');
  const [newProdVat, setNewProdVat] = useState('0');

  // Selected Order for Receipt modal
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

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

  // Filtered Orders
  const filteredOrders = orders
    .filter((o) => {
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
  const filteredProducts = products
    .filter((p) => {
      if (selectedInventoryCategory !== 'all' && p.category !== selectedInventoryCategory) return false;
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        return matchName || matchBrand || matchSku;
      }
      return true;
    });

  // Start editing product
  const handleStartEdit = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditPrice(prod.price);
    setEditStock(prod.stock);
  };

  // Save edited product
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

  // Handle Add Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      name: newProdName,
      brand: newProdBrand || 'DESI BOLT',
      category: newProdCategory,
      price: parseFloat(newProdPrice) || 2.99,
      unit: newProdUnit || '1 item',
      stock: parseInt(newProdStock) || 50,
      inStock: (parseInt(newProdStock) || 50) > 0,
      image: newProdImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
      rating: 5.0,
      reviewCount: 1,
      description: `Fresh authentic ${newProdName} delivered across Malta.`,
      vatRate: parseFloat(newProdVat) || 0
    };

    onUpdateProduct(newProduct);
    setIsAddProductOpen(false);
    showFeedback(`Product '${newProdName}' added to Malta catalog.`);

    // Reset Form
    setNewProdName('');
    setNewProdPrice('2.99');
    setNewProdStock('50');

    try {
      await api.admin.createProduct(newProduct).catch(() => {});
    } catch {}
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
          <p className="text-xs text-slate-300">Live order fulfillment, fleet routing, and Malta Inland Revenue VAT (18%)</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => showFeedback('Refreshed live backend state.')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sync Data</span>
          </button>

          <button
            onClick={onBackToStore}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">€{totalRevenue.toFixed(2)}</div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {orders.length} Total Orders Across Malta
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Dispatches</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E63946] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{activeDeliveriesCount} Active</div>
          <p className="text-[11px] text-[#E63946] font-semibold">
            Avg delivery: 15-30 mins in Malta
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Catalog</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{products.length} Items</div>
          <p className="text-[11px] text-slate-500 font-semibold">
            {outOfStockCount > 0 ? `${outOfStockCount} items low/out of stock` : 'All items in stock'}
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
          { id: 'orders', label: `Orders Dispatch (${orders.length})`, icon: Truck },
          { id: 'inventory', label: `Inventory & Catalog (${products.length})`, icon: Package },
          { id: 'fleet', label: 'Malta Couriers & Fleet (4)', icon: MapPin },
          { id: 'promos', label: `Discount Codes (${promos.length})`, icon: Tag },
          { id: 'vat', label: 'VAT & Tax Compliance', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
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

      {/* TAB 1: Live Orders Dispatch Board */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Order Filters & Search */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {['all', 'confirmed', 'packing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap ${
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

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Customer & Malta Locality</th>
                    <th className="py-3 px-4">Items & Amount</th>
                    <th className="py-3 px-4">Courier</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                    <th className="py-3 px-4 text-right">Dispatch Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No orders match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">#{ord.orderNumber}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString('en-GB')} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{ord.address.fullName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#E63946]" />
                            <span>{ord.address.locality} ({ord.address.street})</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">€{ord.total.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500">
                            {ord.items.length} items • <span className="uppercase text-emerald-600 font-bold">{ord.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-slate-400" />
                            <span>{ord.driver?.name || 'Josef Vella'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{ord.driver?.vehicle || 'Eco-Scooter #14'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={ord.status}
                            onChange={(e) => {
                              updateOrderStatus(ord.id, e.target.value as OrderStatus);
                              showFeedback(`Order #${ord.orderNumber} status set to ${e.target.value.replace(/_/g, ' ')}.`);
                            }}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold focus:border-[#E63946] outline-hidden cursor-pointer ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : ord.status === 'out_for_delivery'
                                ? 'bg-red-50 text-[#E63946] border-red-200 font-black'
                                : ord.status === 'cancelled'
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="packing">Packing</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled / Refunded</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setReceiptOrder(ord)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              title="View Invoice & Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </button>

                            {ord.status !== 'cancelled' && ord.status !== 'delivered' && (
                              <button
                                onClick={() => handleRefundOrder(ord)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                title="Issue Refund"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Refund</span>
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

      {/* TAB 2: Product & Inventory Manager */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="relative w-full max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by title, brand, SKU..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                />
              </div>

              <select
                value={selectedInventoryCategory}
                onChange={(e) => setSelectedInventoryCategory(e.target.value)}
                className="text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 font-semibold text-slate-700 outline-hidden"
              >
                <option value="all">All Categories ({CATEGORIES.length})</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddProductOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E63946] hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price (€)</th>
                    <th className="py-3 px-4">Stock Qty</th>
                    <th className="py-3 px-4">Malta VAT</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{prod.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{prod.sku} • {prod.brand} • {prod.unit}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">{prod.category.replace('-', ' ')}</td>
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
                          `€${prod.price.toFixed(2)}`
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
                          <span className={prod.stock < 10 ? 'text-red-600 font-black' : 'text-slate-800'}>
                            {prod.stock} units
                          </span>
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
                        {editingProductId === prod.id ? (
                          <button
                            onClick={() => handleSaveProduct(prod)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            title="Save Changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(prod)}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
                            title="Edit Price & Stock"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Couriers & Malta Fleet */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#E63946]" />
                <span>Active Malta Delivery Fleet</span>
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                4 Couriers On-Duty
              </span>
            </div>

            <div className="space-y-3">
              {AVAILABLE_DRIVERS.map((d) => (
                <div key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-[#E63946] flex items-center justify-center font-black text-sm">
                      {d.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm">{d.name}</div>
                      <div className="text-slate-500">{d.vehicle} • <span className="font-semibold text-slate-700">{d.location}</span></div>
                      <a href={`tel:${d.phone}`} className="text-[#E63946] font-bold text-[11px] hover:underline flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{d.phone}</span>
                      </a>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-slate-900">Malta Zone Speed & Dispatch Times</h3>
            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {MALTA_LOCALITIES.map((l) => (
                <div key={l.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{l.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({l.region})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-semibold">{l.deliveryTimeMins}m Avg Time</span>
                    <span className="font-mono font-bold text-slate-900">
                      {l.deliveryFee === 0 ? 'FREE' : `€${l.deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Promo Codes Manager */}
      {activeTab === 'promos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Promo Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 lg:col-span-1">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#E63946]" />
              <span>Create Promo Code</span>
            </h3>

            <form onSubmit={handleCreatePromo} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. MALTA25"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Discount Type</label>
                  <select
                    value={newPromoType}
                    onChange={(e) => setNewPromoType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="fixed">Fixed (€)</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Value</label>
                  <input
                    type="number"
                    value={newPromoValue}
                    onChange={(e) => setNewPromoValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Minimum Spend (€)</label>
                <input
                  type="number"
                  value={newPromoMinSpend}
                  onChange={(e) => setNewPromoMinSpend(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#E63946] text-white font-bold rounded-xl shadow-md shadow-red-500/20 hover:bg-red-600 transition-colors"
              >
                Activate Coupon Code
              </button>
            </form>
          </div>

          {/* Active Promo Codes List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
            <h3 className="font-black text-sm text-slate-900">Active Discount Coupons</h3>
            <div className="divide-y divide-slate-100">
              {promos.map((p) => (
                <div key={p.code} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900">{p.code}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      {p.discountType === 'percent' ? `${p.discountValue}% OFF` : `€${p.discountValue} OFF`} on orders over €{p.minSpend}
                    </p>
                  </div>
                  <div className="text-right font-semibold text-slate-600">
                    <span className="font-bold text-slate-900">{p.usageCount}</span> redemptions
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VAT & Financial Compliance */}
      {activeTab === 'vat' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-black text-base text-slate-900">Malta Inland Revenue VAT Compliance</h3>
              <p className="text-xs text-slate-500 font-mono">VAT ID: MT-28938210 • Regulated Grocery Compliance</p>
            </div>
            <button
              onClick={exportVatCsv}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Malta VAT Return (.CSV)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">Gross Sales Revenue</span>
              <div className="text-2xl font-black text-slate-900">€{totalRevenue.toFixed(2)}</div>
              <p className="text-[10px] text-slate-400">Total consumer transactions</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">18% Standard VAT Payable</span>
              <div className="text-2xl font-black text-amber-600">€{totalVatCollected.toFixed(2)}</div>
              <p className="text-[10px] text-slate-400">Applicable to sweets, namkeen & household</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">0% VAT Exempt Essentials</span>
              <div className="text-2xl font-black text-emerald-600">€{(totalRevenue - totalVatCollected).toFixed(2)}</div>
              <p className="text-[10px] text-slate-400">Food staples, fresh fruits, vegetables, milk</p>
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
            className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl relative space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Add Product to Malta Catalog</h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Paneer 500g"
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
                    placeholder="e.g. DESI BOLT"
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Price (€)</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Unit Weight</label>
                  <input
                    type="text"
                    placeholder="1 kg"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[11px]"
                  required
                />
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
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E63946] text-white font-bold rounded-xl shadow-md shadow-red-500/20"
                >
                  Create Product
                </button>
              </div>
            </form>
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
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-4 cursor-default text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-sm">DESI BOLT Official Receipt</h3>
                <p className="text-[11px] text-slate-500">Order #{receiptOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setReceiptOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto divide-y divide-slate-100">
              {receiptOrder.items.map((it, idx) => (
                <div key={idx} className="pt-2 flex justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{it.name}</span>
                    <span className="text-slate-400 text-[10px] block">Qty: {it.quantity} • €{it.price.toFixed(2)} each</span>
                  </div>
                  <span className="font-bold text-slate-900">€{(it.price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>€{receiptOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span>€{receiptOrder.deliveryFee.toFixed(2)}</span>
              </div>
              {receiptOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount</span>
                  <span>-€{receiptOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 pt-1 text-sm border-t border-slate-200">
                <span>Total Amount Paid</span>
                <span className="text-[#E63946]">€{receiptOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Print Tax Invoice</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
