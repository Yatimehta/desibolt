/**
 * DESI BOLT — Standalone Register Page (/register)
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MALTA_LOCALITIES } from '../data/maltaLocalities';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  ArrowRight, 
  Zap, 
  Truck, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const Register: React.FC = () => {
  const { user, register, saveAddress } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+356 ');
  const [locality, setLocality] = useState('Sliema');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in, redirect to /account
  useEffect(() => {
    if (user) {
      navigate('/account', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the DESI BOLT Malta Terms of Service.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const res = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || '+356 9900 1122',
    });

    setIsLoading(false);

    if (res.success) {
      // Save initial delivery locality
      const localityObj = MALTA_LOCALITIES.find((l) => l.name === locality) || MALTA_LOCALITIES[0];
      saveAddress({
        fullName: name.trim(),
        phone: phone.trim() || '+356 9912 3456',
        email: email.trim(),
        street: 'Main Street, Flat 1',
        locality: localityObj.name,
        postalCode: `${localityObj.postalPrefix} 1000`,
        coordinates: localityObj.coordinates,
      });

      navigate('/account');
    } else {
      setErrorMessage(res.error || 'Registration failed. Email may already be in use.');
    }
  };

  const handleFillDemo = () => {
    setName('Maria Vella');
    setEmail(`maria.vella.${Math.floor(100 + Math.random() * 900)}@example.com.mt`);
    setPassword('DesiBolt@2026');
    setPhone('+356 7988 5544');
    setLocality('St. Julian\'s');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 bg-[#FAF8F5]">
      <div className="max-w-md w-full space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group select-none">
            <div className="w-12 h-12 bg-[#E63946] rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-2xl tracking-tight text-[#1F2421] font-heading">
                DESI <span className="text-[#E63946]">BOLT</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fast Grocery Account</div>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 font-heading pt-2">Create Your Account</h1>
          <p className="text-xs text-slate-500">Get 15-30m instant Indian & Asian grocery delivery in Malta</p>
        </div>

        {/* Register Card */}
        <div className="bg-white p-7 rounded-3xl border border-[#EAE4D9] shadow-xl space-y-5">
          {errorMessage && (
            <div className="bg-red-50 text-[#E63946] text-xs font-semibold p-3.5 rounded-2xl border border-red-200 flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Vella"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden font-medium"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@example.com.mt"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden font-medium"
                  required
                />
              </div>
            </div>

            {/* Phone & Locality Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Malta Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+356 9912 3456"
                    className="w-full text-xs pl-9 pr-2 py-2.5 rounded-2xl border border-slate-200 focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Locality</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full text-xs pl-9 pr-2 py-2.5 rounded-2xl border border-slate-200 focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden font-semibold bg-white"
                  >
                    {MALTA_LOCALITIES.slice(0, 12).map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password (6+ chars)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full text-xs pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 focus:border-[#E63946] focus:ring-2 focus:ring-red-100 outline-hidden font-medium"
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

            {/* Agree Terms */}
            <div className="text-xs pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-[#E63946] focus:ring-red-500"
                />
                <span className="text-slate-500 text-[11px] leading-tight">
                  I agree to DESI BOLT Malta's Terms of Service and Privacy Policy for fast grocery deliveries.
                </span>
              </label>
            </div>

            {/* Register Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#E63946] hover:bg-[#D62839] disabled:opacity-60 text-white text-xs font-black rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all hover:scale-101 mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating your account...</span>
                </div>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Create Account & Start Shopping</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Auto Fill Demo */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-bold text-slate-500 hover:text-[#E63946] underline"
            >
              ⚡️ Auto-fill sample Malta customer details
            </button>
          </div>
        </div>

        {/* Link to Login */}
        <div className="text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-[#E63946] font-extrabold hover:underline">
            Sign In Here
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>No spam • Secure payment data protected by Stripe</span>
        </div>
      </div>
    </div>
  );
};
