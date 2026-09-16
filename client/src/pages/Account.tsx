/**
 * DESI BOLT — User Account & Profile Page (/account)
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { MALTA_LOCALITIES } from '../data/maltaLocalities';
import { DeliveryAddress } from '../types';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Truck,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  Clock,
  ChevronRight
} from 'lucide-react';

export const Account: React.FC = () => {
  const { user, logout, updateProfile, saveAddress, deleteAddress } = useAuth();
  const { activeOrder, orders } = useOrders();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/account' } } });
    }
  }, [user, navigate]);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [addrStreet, setAddrStreet] = useState('');
  const [addrLocality, setAddrLocality] = useState('Sliema');
  const [addrPostalCode, setAddrPostalCode] = useState('SLM 1604');
  const [addrNotes, setAddrNotes] = useState('');

  if (!user) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: editName, phone: editPhone });
    setIsEditProfileOpen(false);
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim()) return;

    const locObj = MALTA_LOCALITIES.find((l) => l.name === addrLocality) || MALTA_LOCALITIES[0];
    const newAddr: DeliveryAddress = {
      fullName: user.name,
      phone: user.phone,
      email: user.email,
      street: addrStreet.trim(),
      locality: locObj.name,
      postalCode: addrPostalCode.trim() || `${locObj.postalPrefix} 1000`,
      notes: addrNotes.trim(),
      coordinates: locObj.coordinates,
    };

    saveAddress(newAddr);
    setIsAddAddressOpen(false);
    setAddrStreet('');
    setAddrNotes('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Breadcrumb & Greeting */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-3xl border border-[#EAE4D9] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-[#E63946] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-red-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 font-heading">{user.name}</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {user.role === 'admin' ? '⚡️ Operations Admin' : '✓ Verified Member'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> {user.email}
                <span>•</span>
                <Phone className="w-3.5 h-3.5" /> {user.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditName(user.name);
                setEditPhone(user.phone);
                setIsEditProfileOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-[#E63946] text-xs font-bold rounded-2xl flex items-center gap-1.5 border border-red-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Quick Action Navigation Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tile 1: Order History */}
          <Link
            to="/account/orders"
            className="bg-white p-5 rounded-3xl border border-[#EAE4D9] hover:border-[#E63946] shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E63946] flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-[#E63946] transition-colors">
                  Order History
                </h3>
                <p className="text-[11px] text-slate-500">{orders.length} orders placed</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#E63946] transition-colors" />
          </Link>

          {/* Tile 2: Live Tracking */}
          <Link
            to="/tracking"
            className="bg-white p-5 rounded-3xl border border-[#EAE4D9] hover:border-emerald-500 shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Live Malta Map
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activeOrder ? `Active Order #${activeOrder.orderNumber}` : 'Track active delivery'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
          </Link>

          {/* Tile 3: Admin Hub (If admin) or Fast Shopping */}
          {user.role === 'admin' ? (
            <Link
              to="/admin"
              className="bg-[#1F2421] p-5 rounded-3xl border border-black shadow-md hover:shadow-lg transition-all group flex items-center justify-between text-white"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-yellow-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Admin Operations</h3>
                  <p className="text-[11px] text-slate-400">Inventory & Catalog control</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          ) : (
            <Link
              to="/"
              className="bg-white p-5 rounded-3xl border border-[#EAE4D9] hover:border-[#E63946] shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-[#E63946] transition-colors">
                    Storefront
                  </h3>
                  <p className="text-[11px] text-slate-500">7,000+ Asian & Indian items</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#E63946] transition-colors" />
            </Link>
          )}
        </div>

        {/* Saved Addresses Section */}
        <div className="bg-white p-7 rounded-3xl border border-[#EAE4D9] shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-black text-slate-900 font-heading flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#E63946]" />
                <span>Saved Malta Delivery Addresses</span>
              </h2>
              <p className="text-xs text-slate-500">Addresses used for 1-click ultrafast checkout</p>
            </div>

            <button
              onClick={() => setIsAddAddressOpen(true)}
              className="px-4 py-2 bg-[#E63946] hover:bg-[#D62839] text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Add New Address
            </button>
          </div>

          {user.savedAddresses && user.savedAddresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.savedAddresses.map((addr, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-[#E63946] flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-black text-slate-900">{addr.locality} Location</div>
                        <div className="text-[11px] text-slate-500">{addr.fullName} • {addr.phone}</div>
                      </div>
                    </div>

                    {user.savedAddresses.length > 1 && (
                      <button
                        onClick={() => deleteAddress(addr.street)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80">
                    <div className="font-semibold">{addr.street}</div>
                    <div className="text-slate-500">{addr.locality}, {addr.postalCode} (Malta)</div>
                    {addr.notes && (
                      <div className="text-[11px] text-amber-700 font-medium mt-1 pt-1 border-t border-slate-100">
                        Note: {addr.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No saved addresses yet.</p>
              <button
                onClick={() => setIsAddAddressOpen(true)}
                className="text-xs font-bold text-[#E63946] hover:underline"
              >
                + Add your primary Malta address
              </button>
            </div>
          )}
        </div>

        {/* Security & Data Preferences Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#EAE4D9] shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Security & Account Data</div>
              <div className="text-[11px] text-slate-500">Your session is protected with 256-bit TLS encryption</div>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Account ID: <code className="bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[11px] text-slate-700">{user.id}</code>
          </div>
        </div>
      </div>

      {/* MODAL 1: Edit Profile */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-slate-900 font-heading">Edit Profile Info</h3>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number (+356)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E63946] text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Address */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsAddAddressOpen(false)}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-slate-900 font-heading">Add Malta Delivery Address</h3>

            <form onSubmit={handleAddNewAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Locality</label>
                  <select
                    value={addrLocality}
                    onChange={(e) => {
                      setAddrLocality(e.target.value);
                      const found = MALTA_LOCALITIES.find((l) => l.name === e.target.value);
                      if (found) setAddrPostalCode(`${found.postalPrefix} 1000`);
                    }}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-semibold bg-white"
                  >
                    {MALTA_LOCALITIES.map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name} ({l.deliveryTimeMins}m ETA)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={addrPostalCode}
                    onChange={(e) => setAddrPostalCode(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Street Address, Apt / Door #</label>
                <input
                  type="text"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="e.g. 15, Triq it-Torri, Flat 3"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Delivery Notes (Optional)</label>
                <input
                  type="text"
                  value={addrNotes}
                  onChange={(e) => setAddrNotes(e.target.value)}
                  placeholder="e.g. Buzzer 3, leave at doorstep"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E63946] text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
