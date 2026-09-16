/**
 * DESI BOLT — Standalone Login Page (/login)
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Zap, 
  Truck, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export const Login: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // If already logged in, redirect to /account or return URL
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/account';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      navigate('/account');
    } else {
      setErrorMessage(res.error || 'Invalid email or password. Please try again.');
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoRole: 'customer' | 'admin') => {
    setEmail(demoEmail);
    setPassword('DesiBolt@2026');
    setIsLoading(true);
    setErrorMessage('');
    const res = await login(demoEmail, 'DesiBolt@2026');
    setIsLoading(false);
    if (res.success) {
      navigate('/account');
    }
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) return;
    setForgotSent(true);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 bg-[#FAF8F5]">
      <div className="max-w-md w-full space-y-6">
        {/* Top Branding Card */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group select-none">
            <div className="w-12 h-12 bg-[#E63946] rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-2xl tracking-tight text-[#1F2421] font-heading">
                DESI <span className="text-[#E63946]">BOLT</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Malta Grocery Fast-Pass</div>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 font-heading pt-2">Welcome Back!</h1>
          <p className="text-xs text-slate-500">Sign in to access your saved Sliema/Malta addresses & order history</p>
        </div>

        {/* Main Login Form Box */}
        <div className="bg-white p-7 rounded-3xl border border-[#EAE4D9] shadow-xl space-y-5">
          {errorMessage && (
            <div className="bg-red-50 text-[#E63946] text-xs font-semibold p-3.5 rounded-2xl border border-red-200 flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com.mt"
                  className="w-full text-xs pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden font-medium transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] font-bold text-[#E63946] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden font-medium transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#E63946] focus:ring-red-500"
                />
                <span className="text-slate-600 font-medium">Remember my session</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#E63946] hover:bg-[#D62839] disabled:opacity-60 text-white text-xs font-black rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all hover:scale-101"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </div>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Sign In to DESI BOLT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block text-center">
              Quick 1-Click Test Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('alex@example.com.mt', 'customer')}
                className="p-2.5 bg-slate-50 hover:bg-red-50/60 border border-slate-200 rounded-xl text-left transition-colors"
              >
                <div className="text-[11px] font-bold text-slate-800">Alex Camilleri</div>
                <div className="text-[10px] text-slate-500">Customer (Sliema)</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@desibolt.com', 'admin')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors"
              >
                <div className="text-[11px] font-bold text-slate-800">Admin Account</div>
                <div className="text-[10px] text-slate-500">Operations Hub</div>
              </button>
            </div>
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center text-xs text-slate-600">
          New to DESI BOLT?{' '}
          <Link to="/register" className="text-[#E63946] font-extrabold hover:underline">
            Create an Account in 30 Seconds
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit TLS Encryption • Malta Verified</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div 
          onClick={() => {
            setIsForgotOpen(false);
            setForgotSent(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative space-y-4 cursor-default"
          >
            <button
              onClick={() => {
                setIsForgotOpen(false);
                setForgotSent(false);
              }}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            {forgotSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Reset Email Dispatched</h3>
                <p className="text-xs text-slate-500">
                  Password reset link sent to <strong>{forgotEmail}</strong>. Check your inbox and spam folder.
                </p>
                <button
                  onClick={() => setIsForgotOpen(false)}
                  className="w-full py-2.5 bg-[#E63946] text-white text-xs font-bold rounded-xl"
                >
                  Close & Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetLink} className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E63946] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reset Your Password</h3>
                  <p className="text-xs text-slate-500">Enter your registered email address to receive a reset link.</p>
                </div>

                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="alex@example.com.mt"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                  required
                />

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#E63946] text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
