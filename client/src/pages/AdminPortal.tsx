import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { Product } from '../types';
import { 
  getStoredProducts, 
  updateProductInStore, 
  addProductToStore, 
  deleteProductFromStore, 
  resetCatalogToDefault 
} from '../data/productStore';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Truck,
  Zap,
  KeyRound,
  LogIn
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { user, isAdmin, login, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Products state for admin management initialized from persistent store
  const [productsList, setProductsList] = useState<Product[]>(getStoredProducts);

  useEffect(() => {
    const handleCatalogUpdated = () => {
      setProductsList(getStoredProducts());
    };
    window.addEventListener('desibolt_catalog_updated', handleCatalogUpdated);
    return () => window.removeEventListener('desibolt_catalog_updated', handleCatalogUpdated);
  }, []);

  const handleUpdateProduct = (updated: Product) => {
    const nextList = updateProductInStore(updated);
    setProductsList(nextList);
  };

  const handleAddProduct = (newProd: Partial<Product> & { name: string; price: number; category: Product['category'] }) => {
    addProductToStore(newProd);
    setProductsList(getStoredProducts());
  };

  const handleDeleteProduct = (productId: string) => {
    const nextList = deleteProductFromStore(productId);
    setProductsList(nextList);
  };

  const handleResetCatalog = () => {
    const nextList = resetCatalogToDefault();
    setProductsList(nextList);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both administrative email and password.');
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await login(email.trim(), password.trim());
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid administrator email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFillCredentials = () => {
    setEmail('admin@desibolt.com');
    setPassword('DesiBolt@2026');
    setErrorMessage(null);
  };

  // If already logged in but not an admin (e.g. regular customer)
  const isCustomerLoggedIn = user && user.role !== 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400 tracking-wider">VERIFYING ADMINISTRATIVE ACCESS...</p>
      </div>
    );
  }

  // If user is verified Administrator, display the Dashboard
  if (user && isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-red-500 selection:text-white">
        {/* Top Admin Security Navbar */}
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white tracking-tight">
                    DESI <span className="text-[#E63946]">BOLT</span>
                  </span>
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-sm border border-red-500/30 uppercase tracking-wider">
                    OPERATIONS HQ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Malta Fulfillment Node • Live Catalog & Fleet</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-slate-400">Admin:</span>
                <strong className="text-white">{user.name || user.email}</strong>
              </div>

              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Public</span> Storefront
              </Link>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold border border-red-500/30 transition-colors cursor-pointer"
                title="Lock admin session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Console</span>
              </button>
            </div>
          </div>
        </header>

        {/* Admin Dashboard Core */}
        <main className="flex-1 pb-16 bg-[#FAF8F5] text-[#1F2421]">
          <AdminDashboard
            products={productsList}
            onUpdateProduct={handleUpdateProduct}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onResetCatalog={handleResetCatalog}
            onBackToStore={() => navigate('/')}
          />
        </main>
      </div>
    );
  }

  // Otherwise, render the Protected Admin Login Screen
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-500 selection:text-white relative overflow-hidden">
      {/* Background Subtle Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Header */}
      <header className="p-6 relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base text-white">
            DESI <span className="text-[#E63946]">BOLT</span>
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Storefront</span>
        </Link>
      </header>

      {/* Admin Login Card */}
      <div className="relative z-10 max-w-md w-full mx-auto px-4 py-6">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-7 sm:p-8 shadow-2xl shadow-black/80 space-y-5">
          
          {/* Header & Icon */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Administrator Portal</h1>
            <p className="text-xs text-slate-400">
              Operations backend for inventory management, product items, live order dispatch & fleet.
            </p>
          </div>

          {/* Quick Credentials Info Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Admin Credentials
              </span>
              <button
                type="button"
                onClick={handleQuickFillCredentials}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 transition-colors cursor-pointer"
              >
                Autofill Credentials
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-400 space-y-0.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
              <div><span className="text-slate-500">ID:</span> admin@desibolt.com</div>
              <div><span className="text-slate-500">Password:</span> DesiBolt@2026</div>
            </div>
          </div>

          {/* Access Warning / Customer Logged In Notice */}
          {isCustomerLoggedIn && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Customer Account Detected ({user.email})</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                You are currently signed in as a Customer. Please sign in with an Administrator account to access operations.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Email ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@desibolt.com"
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden font-medium transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Encrypted SHA-256</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-hidden font-medium transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-red-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Remember session</span>
              </label>

              <span className="text-[11px] text-slate-500 font-medium">Malta Node v2.4</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate & Enter Admin Console</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Authorized staff only. All actions logged for Malta Inland Revenue & security compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 relative z-10 text-center text-xs text-slate-600 max-w-6xl mx-auto w-full">
        DESI BOLT Malta Fulfillment • High-Security Administrator System • Inland Revenue Registered
      </footer>
    </div>
  );
};
