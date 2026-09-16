import React, { useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import { Product, OrderStatus, CategoryId } from '../../types';
import { CATEGORIES } from '../../data/categories';
import { MALTA_LOCALITIES } from '../../data/maltaLocalities';
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
  MapPin
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onUpdateProduct,
  onBackToStore
}) => {
  const { orders, updateOrderStatus } = useOrders();
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'fleet' | 'vat'>('orders');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  // Financial & Operational Metrics
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const totalVatCollected = orders.reduce((sum, ord) => sum + ord.vatAmount, 0);
  const activeDeliveriesCount = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const outOfStockCount = products.filter((p) => p.stock === 0 || !p.inStock).length;

  const filteredOrders = orderStatusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === orderStatusFilter);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(inventorySearch.toLowerCase())
  ).slice(0, 30);

  const handleStartEdit = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditPrice(prod.price);
    setEditStock(prod.stock);
  };

  const handleSaveProduct = (prod: Product) => {
    onUpdateProduct({
      ...prod,
      price: Number(editPrice),
      stock: Number(editStock),
      inStock: Number(editStock) > 0
    });
    setEditingProductId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#E63946] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
              ADMINISTRATOR CONSOLE
            </span>
            <span className="text-xs text-slate-400 font-mono">Malta Fulfillment Node</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">DESI BOLT Operations & Dispatch</h1>
          <p className="text-xs text-slate-300">Live order routing, inventory sync, and Malta VAT compliance (18%)</p>
        </div>

        <button
          onClick={onBackToStore}
          className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">€{totalRevenue.toFixed(2)}</div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +24% vs yesterday
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Deliveries</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E63946] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{activeDeliveriesCount}</div>
          <p className="text-[11px] text-[#E63946] font-semibold">
            Avg fulfillment time: 18.2 mins
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Catalog</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">7,162 items</div>
          <p className="text-[11px] text-slate-500 font-semibold">
            Across 10 master categories
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
          { id: 'orders', label: `Orders Dispatch (${orders.length})` },
          { id: 'inventory', label: 'Inventory & Catalog (7K+)' },
          { id: 'fleet', label: 'Malta Fleet & Zones' },
          { id: 'vat', label: 'VAT & Financials (MT)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#E63946] text-white shadow-md shadow-red-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Live Orders Dispatch Board */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Order filters */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['all', 'confirmed', 'packing', 'dispatched', 'out_for_delivery', 'delivered'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    orderStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order ID & Date</th>
                    <th className="py-3 px-4">Customer & Locality</th>
                    <th className="py-3 px-4">Items & Value</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Dispatch Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">#{ord.orderNumber}</div>
                        <div className="text-[10px] text-slate-400">{new Date(ord.createdAt).toLocaleTimeString()}</div>
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
                        <div className="text-[10px] text-slate-500">{ord.items.length} items</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'out_for_delivery'
                            ? 'bg-red-100 text-[#E63946] animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 focus:border-[#E63946] outline-hidden"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="packing">Packing</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
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
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search products by title, brand, SKU..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredProducts.length} of {products.length} products
            </div>
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
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{prod.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{prod.sku} • {prod.unit}</div>
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
                            className="w-20 px-2 py-1 border rounded-lg text-xs font-bold"
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
                            className="w-16 px-2 py-1 border rounded-lg text-xs font-bold"
                          />
                        ) : (
                          <span className={prod.stock < 20 ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                            {prod.stock} units
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          prod.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {prod.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingProductId === prod.id ? (
                          <button
                            onClick={() => handleSaveProduct(prod)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(prod)}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
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

      {/* TAB 3: Fleet & Malta Zones */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-slate-900">Active Delivery Couriers (Malta)</h3>
            <div className="space-y-3">
              {[
                { name: 'Josef Vella', vehicle: 'Eco-Scooter #14', location: 'Sliema / Gzira', orders: 12, status: 'Active (On Route)' },
                { name: 'Marco Grech', vehicle: 'Red Bolt Bike #03', location: 'Valletta / Msida', orders: 18, status: 'Active (On Route)' },
                { name: 'David Borg', vehicle: 'Honda PCX #09', location: 'Birkirkara / Mosta', orders: 15, status: 'Standby Hub' }
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-[#E63946] flex items-center justify-center font-bold">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.vehicle} • {c.location}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-slate-900">Malta Zone Delivery Rates</h3>
            <div className="space-y-2">
              {MALTA_LOCALITIES.slice(0, 7).map((l) => (
                <div key={l.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{l.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({l.region})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-semibold">{l.deliveryTimeMins}m ETA</span>
                    <span className="font-mono font-bold text-slate-900">€{l.deliveryFee.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VAT & Financial Compliance */}
      {activeTab === 'vat' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-black text-base text-slate-900">Malta VAT Summary & Compliance</h3>
              <p className="text-xs text-slate-500">Official VAT Number: MT-28938210 (Inland Revenue Department)</p>
            </div>
            <button
              onClick={() => alert('Exporting Malta VAT Return CSV...')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Export VAT Return
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">Gross Sales (EUR)</span>
              <div className="text-xl font-black text-slate-900">€{totalRevenue.toFixed(2)}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">18% Standard VAT Collected</span>
              <div className="text-xl font-black text-slate-900">€{totalVatCollected.toFixed(2)}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500">0% Exempt Grocery Staples</span>
              <div className="text-xl font-black text-slate-900">€{(totalRevenue - totalVatCollected).toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
