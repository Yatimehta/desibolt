/**
 * DESI BOLT — Order History Page (/account/orders)
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { ALL_PRODUCTS } from '../data/products';
import { Order, OrderStatus } from '../types';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  ArrowLeft,
  X,
  Star,
  RefreshCw,
  MapPin,
  ExternalLink,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';

export const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const { orders: localOrders, setActiveOrderId } = useOrders();
  const { addToCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>(localOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalOrders, setTotalOrders] = useState<number>(localOrders.length);

  // Rating Modal State
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [starRating, setStarRating] = useState<number>(5);
  const [ratingFeedback, setRatingFeedback] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/account/orders' } } });
    }
  }, [user, navigate]);

  // Fetch orders from backend API
  useEffect(() => {
    if (!user?.id) return;

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const res = await api.orders.getUserOrders(user.id, {
          page,
          limit: 20,
          status: selectedStatusFilter === 'all' ? undefined : selectedStatusFilter,
        });

        if (res?.orders && res.orders.length > 0) {
          setOrders(res.orders);
          setTotalOrders(res.total);
        } else {
          // Fallback to local state if backend has no orders for this filter
          const filtered = localOrders.filter((o) =>
            selectedStatusFilter === 'all' ? true : o.status === selectedStatusFilter
          );
          setOrders(filtered);
          setTotalOrders(filtered.length);
        }
      } catch {
        // Local fallback
        const filtered = localOrders.filter((o) =>
          selectedStatusFilter === 'all' ? true : o.status === selectedStatusFilter
        );
        setOrders(filtered);
        setTotalOrders(filtered.length);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id, selectedStatusFilter, page, localOrders]);

  if (!user) return null;

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      const product = ALL_PRODUCTS.find((p) => p.id === item.productId) || {
        id: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        unit: item.unit,
        brand: 'DESI BOLT',
        category: 'fresh-produce' as const,
        stock: 50,
        inStock: true,
        rating: 4.9,
        reviewCount: 120,
        description: '',
        vatRate: 0,
        sku: 'DB-REORDER',
      };
      addToCart(product, item.quantity);
    });

    setIsCartOpen(true);
  };

  const handleTrackLive = (orderId: string) => {
    setActiveOrderId(orderId);
    navigate('/tracking');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Order Confirmed</span>;
      case 'packing':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Packing at Sliema Hub</span>;
      case 'dispatched':
      case 'out_for_delivery':
        return <span className="bg-orange-100 text-[#E63946] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 animate-pulse"><Truck className="w-3 h-3" /> Out for Delivery</span>;
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">✓ Delivered</span>;
      case 'cancelled':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">{status}</span>;
    }
  };

  const submitRating = (e: React.FormEvent) => {
    e.preventDefault();
    setRatingSubmitted(true);
    setTimeout(() => {
      setRatingOrder(null);
      setRatingSubmitted(false);
      setRatingFeedback('');
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/account"
              className="w-10 h-10 rounded-2xl bg-white border border-[#EAE4D9] text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 font-heading">My Order History</h1>
              <p className="text-xs text-slate-500">Track current deliveries & review past orders across Malta</p>
            </div>
          </div>

          <Link
            to="/"
            className="px-4 py-2.5 bg-[#E63946] hover:bg-[#D62839] text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all"
          >
            <ShoppingBag className="w-4 h-4" /> Start New Order
          </Link>
        </div>

        {/* Filter Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'out_for_delivery', label: '⚡️ Live & On Delivery' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'delivered', label: '✓ Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all ${
                selectedStatusFilter === tab.id
                  ? 'bg-[#1F2421] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#EAE4D9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List Container */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE4D9] space-y-3">
            <div className="w-10 h-10 border-3 border-[#E63946] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading your order history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE4D9] space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-red-50 text-[#E63946] flex items-center justify-center mx-auto shadow-md shadow-red-500/10">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">No orders found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {selectedStatusFilter === 'all'
                  ? 'You have not placed any orders yet. Try our 15-30m instant grocery delivery!'
                  : `No orders currently match the '${selectedStatusFilter}' status.`}
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E63946] text-white text-xs font-black rounded-2xl shadow-lg shadow-red-500/25 hover:bg-[#D62839] transition-all"
            >
              <span>Explore 7,000+ Groceries</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 border border-[#EAE4D9] hover:border-slate-300 shadow-sm transition-all space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                      #{order.orderNumber.replace('DB-MLT-', '')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">Order #{order.orderNumber}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{order.address?.locality || 'Malta'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-[#E63946]">€{order.total.toFixed(2)}</div>
                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Paid with {order.paymentMethod}</div>
                  </div>
                </div>

                {/* Items Thumbnails Row */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                    {order.items.slice(0, 4).map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0">
                        <img src={it.image} alt={it.name} className="w-8 h-8 object-cover rounded-lg" />
                        <div className="text-[11px] font-medium text-slate-700 max-w-[120px] truncate">
                          <span className="font-bold">{it.quantity}x</span> {it.name}
                        </div>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <span className="text-[11px] font-bold text-slate-400 px-2">
                        +{order.items.length - 4} more items
                      </span>
                    )}
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2">
                    {order.status === 'out_for_delivery' || order.status === 'dispatched' ? (
                      <button
                        onClick={() => handleTrackLive(order.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Truck className="w-3.5 h-3.5" /> Track Live on Map
                      </button>
                    ) : null}

                    {order.status === 'delivered' ? (
                      <button
                        onClick={() => setRatingOrder(order)}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Rate Delivery
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleReorder(order)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                      title="Add all items back to cart"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reorder
                    </button>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Order Details */}
      {selectedOrder && (
        <div 
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 shadow-2xl relative space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-500">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500 font-semibold">Current Lifecycle Status</div>
                <div className="text-xs font-black text-slate-900 capitalize mt-0.5">{selectedOrder.status.replace(/_/g, ' ')}</div>
              </div>
              {getStatusBadge(selectedOrder.status)}
            </div>

            {/* Delivery Proof Photo if available */}
            {selectedOrder.deliveryPhoto && (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Proof of Delivery Photo
                </div>
                <img
                  src={selectedOrder.deliveryPhoto}
                  alt="Delivery Proof"
                  className="w-full h-44 object-cover rounded-xl border border-emerald-200 shadow-sm"
                />
              </div>
            )}

            {/* Items List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Purchased Items ({selectedOrder.items.length})</h4>
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={it.image} alt={it.name} className="w-10 h-10 object-cover rounded-xl border border-slate-100" />
                      <div>
                        <div className="font-bold text-slate-800">{it.name}</div>
                        <div className="text-[10px] text-slate-400">Qty: {it.quantity} • {it.unit}</div>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">€{(it.price * it.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address & Driver Details */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#E63946] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Delivered to: {selectedOrder.address.fullName}</div>
                  <div className="text-slate-500">{selectedOrder.address.street}, {selectedOrder.address.locality} ({selectedOrder.address.postalCode})</div>
                </div>
              </div>

              {selectedOrder.driver && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Courier: <strong>{selectedOrder.driver.name}</strong> ({selectedOrder.driver.vehicle})</span>
                  <a href={`tel:${selectedOrder.driver.phone}`} className="text-[#E63946] font-bold hover:underline">Call Driver</a>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>€{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span>{selectedOrder.deliveryFee === 0 ? 'FREE' : `€${selectedOrder.deliveryFee.toFixed(2)}`}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({selectedOrder.promoCode || 'Promo'})</span>
                  <span>-€{selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200 text-sm">
                <span>Total Paid</span>
                <span className="text-[#E63946]">€{selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Reorder Button */}
            <button
              onClick={() => {
                handleReorder(selectedOrder);
                setSelectedOrder(null);
              }}
              className="w-full py-3 bg-[#E63946] text-white text-xs font-black rounded-2xl shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reorder All Items</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Rate Delivery */}
      {ratingOrder && (
        <div 
          onClick={() => setRatingOrder(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative space-y-4 cursor-default"
          >
            <button
              onClick={() => setRatingOrder(null)}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            {ratingSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-900">Thank You For Your Feedback!</h3>
                <p className="text-xs text-slate-500">Your rating helps us keep DESI BOLT ultrafast & reliable across Malta.</p>
              </div>
            ) : (
              <form onSubmit={submitRating} className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 fill-current" />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">Rate Delivery Experience</h3>
                  <p className="text-xs text-slate-500">Order #{ratingOrder.orderNumber} • Courier: {ratingOrder.driver?.name || 'Josef Vella'}</p>
                </div>

                {/* 5 Stars Selector */}
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      className="p-1 hover:scale-115 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= starRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  placeholder="How was the grocery condition and courier speed? (Optional)"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium resize-none h-20"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-[#E63946] text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20"
                >
                  Submit {starRating}★ Rating
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
