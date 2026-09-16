import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { MALTA_LOCALITIES } from '../../data/maltaLocalities';
import { DeliveryAddress, Order } from '../../types';
import { api } from '../../services/api';
import { StripePaymentForm } from './StripePaymentForm';
import { 
  X, 
  MapPin, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Truck, 
  Sparkles,
  Lock,
  Smartphone,
  AlertCircle
} from 'lucide-react';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51MockKeyForDesiBoltMalta2026';
const stripePromise = loadStripe(stripePublishableKey).catch(() => null);

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  discountAmount: number;
  promoCode: string;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  discountAmount,
  promoCode,
  onOrderCompleted
}) => {
  const { items, subtotal, vatAmount, deliveryFee, clearCart } = useCart();
  const { user, defaultAddress, saveAddress } = useAuth();
  const { createOrder } = useOrders();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Step 1: Address State
  const [fullName, setFullName] = useState(defaultAddress?.fullName || user?.name || 'Alex Camilleri');
  const [phone, setPhone] = useState(defaultAddress?.phone || '+356 9912 3456');
  const [email, setEmail] = useState(defaultAddress?.email || user?.email || 'alex@example.com.mt');
  const [street, setStreet] = useState(defaultAddress?.street || '42, Tower Road, Apt 4B');
  const [locality, setLocality] = useState(defaultAddress?.locality || 'Sliema');
  const [postalCode, setPostalCode] = useState(defaultAddress?.postalCode || 'SLM 1604');
  const [notes, setNotes] = useState(defaultAddress?.notes || 'Ring buzzer 4B, 3rd floor');

  // Step 2: Slot
  const [deliverySlot, setDeliverySlot] = useState<'instant_bolt' | 'today_evening' | 'tomorrow_morning'>('instant_bolt');

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'apple_pay' | 'revolut' | 'cod'>('stripe');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  const currentLocalityObj = MALTA_LOCALITIES.find((l) => l.name === locality) || MALTA_LOCALITIES[0];
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  // Create Stripe PaymentIntent when stepping into payment stage
  useEffect(() => {
    if (isOpen && step === 3 && finalTotal > 0) {
      const initStripeIntent = async () => {
        try {
          const res = await api.payments.createIntent(`temp_order_${Date.now()}`, finalTotal, 'eur');
          if (res?.clientSecret) {
            setStripeClientSecret(res.clientSecret);
          }
        } catch {
          // Keep null for fallback form
          setStripeClientSecret(null);
        }
      };
      initStripeIntent();
    }
  }, [isOpen, step, finalTotal]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step === 1) {
      const newAddr: DeliveryAddress = {
        fullName,
        phone,
        email,
        street,
        locality,
        postalCode,
        notes,
        coordinates: currentLocalityObj.coordinates
      };
      saveAddress(newAddr);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const executeOrderCreation = (paymentTransactionId?: string) => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    setTimeout(() => {
      const deliveryAddress: DeliveryAddress = {
        fullName,
        phone,
        email,
        street,
        locality,
        postalCode,
        notes,
        coordinates: currentLocalityObj.coordinates
      };

      const newOrder = createOrder(
        items,
        deliveryAddress,
        paymentMethod,
        deliverySlot
      );

      if (paymentTransactionId) {
        (newOrder as any).paymentIntentId = paymentTransactionId;
      }

      setConfirmedOrder(newOrder);
      setIsProcessingPayment(false);
      setStep(4);
      clearCart();

      // Trigger Confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.error('Confetti error', e);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[92vh] overflow-y-auto flex flex-col relative"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <span className="text-[#E63946]">DESI BOLT</span> Checkout
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Fast grocery delivery in Malta</p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200/80 flex items-center justify-between">
          {[
            { s: 1, label: 'Address' },
            { s: 2, label: 'Delivery' },
            { s: 3, label: 'Payment' },
            { s: 4, label: 'Receipt' }
          ].map(({ s, label }) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step === s 
                  ? 'bg-[#E63946] text-white ring-2 ring-red-200' 
                  : step > s 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${
                step === s ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Modal Body per Step */}
        <div className="p-6 flex-1 space-y-4">
          {paymentError && (
            <div className="bg-red-50 text-[#E63946] text-xs font-semibold p-3.5 rounded-2xl border border-red-200 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* STEP 1: Address */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-[#E63946]" />
                <span>Malta Delivery Address</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone (+356 Mobile)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Locality in Malta</label>
                  <select
                    value={locality}
                    onChange={(e) => {
                      setLocality(e.target.value);
                      const found = MALTA_LOCALITIES.find(l => l.name === e.target.value);
                      if (found) setPostalCode(`${found.postalPrefix} 1000`);
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-semibold bg-white"
                  >
                    {MALTA_LOCALITIES.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} ({loc.region} - ~{loc.deliveryTimeMins}m ETA)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address, Apt / Door #</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 42, Tower Road, Flat 4B"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Leave by door, ring buzzer 4B"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                />
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/80 text-xs text-emerald-800 flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-[#E63946] shrink-0" />
                <span>Our courier in {locality} is standby and ready for ultrafast dispatch.</span>
              </div>
            </div>
          )}

          {/* STEP 2: Delivery Slot */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-[#E63946]" />
                <span>Choose Delivery Speed</span>
              </div>

              <div className="space-y-2.5">
                {/* Instant Bolt */}
                <label 
                  onClick={() => setDeliverySlot('instant_bolt')}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    deliverySlot === 'instant_bolt' 
                      ? 'border-[#E63946] bg-red-50/50 ring-2 ring-red-100' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E63946] text-white flex items-center justify-center">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                        <span>⚡️ DESI BOLT Instant (15-25 Min)</span>
                        <span className="bg-[#E63946] text-white text-[9px] px-1.5 py-0.2 rounded-sm font-bold">Fastest</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Immediate picking & bike dispatch to {locality}</p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-[#E63946]">
                    {deliverySlot === 'instant_bolt' && <div className="w-2.5 h-2.5 rounded-full bg-[#E63946]" />}
                  </div>
                </label>

                {/* Today Evening */}
                <label 
                  onClick={() => setDeliverySlot('today_evening')}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    deliverySlot === 'today_evening' 
                      ? 'border-[#E63946] bg-red-50/50 ring-2 ring-red-100' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Today Evening (18:00 – 20:00)</div>
                      <p className="text-[11px] text-slate-500">Scheduled evening batch delivery</p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-slate-300">
                    {deliverySlot === 'today_evening' && <div className="w-2.5 h-2.5 rounded-full bg-[#E63946]" />}
                  </div>
                </label>

                {/* Tomorrow Morning */}
                <label 
                  onClick={() => setDeliverySlot('tomorrow_morning')}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    deliverySlot === 'tomorrow_morning' 
                      ? 'border-[#E63946] bg-red-50/50 ring-2 ring-red-100' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Tomorrow Morning (08:00 – 10:00)</div>
                      <p className="text-[11px] text-slate-500">Fresh morning bakery & milk delivery</p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-slate-300">
                    {deliverySlot === 'tomorrow_morning' && <div className="w-2.5 h-2.5 rounded-full bg-[#E63946]" />}
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-[#E63946]" />
                  <span>Select Payment Method</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> 256-Bit Encrypted
                </span>
              </div>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'stripe', name: 'Credit / Debit Card', desc: 'Stripe Secure', icon: <CreditCard className="w-4 h-4 text-[#E63946]" /> },
                  { id: 'apple_pay', name: 'Apple / Google Pay', desc: 'Instant 1-Tap', icon: <Smartphone className="w-4 h-4 text-slate-800" /> },
                  { id: 'revolut', name: 'Revolut Pay', desc: 'Instant EU Transfer', icon: <Sparkles className="w-4 h-4 text-blue-600" /> },
                  { id: 'cod', name: 'Cash on Delivery', desc: 'Pay at Doorstep', icon: <Truck className="w-4 h-4 text-amber-600" /> }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === pm.id 
                        ? 'border-[#E63946] bg-red-50/50 ring-2 ring-red-100 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {pm.icon}
                      {paymentMethod === pm.id && <CheckCircle2 className="w-4 h-4 text-[#E63946]" />}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{pm.name}</div>
                    <div className="text-[10px] text-slate-400">{pm.desc}</div>
                  </button>
                ))}
              </div>

              {/* Real Stripe Payment Form or Fallback */}
              {paymentMethod === 'stripe' && stripeClientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                  <StripePaymentForm
                    amount={finalTotal}
                    orderNumber={`DB-MLT-${Math.floor(10000 + Math.random() * 90000)}`}
                    onPaymentSuccess={(piId) => executeOrderCreation(piId)}
                    isProcessing={isProcessingPayment}
                    setIsProcessing={setIsProcessingPayment}
                  />
                </Elements>
              ) : paymentMethod === 'stripe' ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Card Details (Stripe Test / Offline Mode)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                      Verified Card
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#E63946] outline-hidden font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#E63946] outline-hidden font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">CVC</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#E63946] outline-hidden font-bold"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Order Summary breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-semibold text-slate-800">€{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({promoCode})</span>
                    <span>-€{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery ({locality})</span>
                  <span className="font-semibold text-slate-800">{deliveryFee === 0 ? 'FREE' : `€${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Amount Due</span>
                  <span className="text-[#E63946] text-base">€{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Order Confirmation & Receipt */}
          {step === 4 && confirmedOrder && (
            <div className="space-y-4 text-center py-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-block bg-[#E63946] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1">
                  15-30 MIN DELIVERY INITIATED
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Order Successfully Placed!
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Order #{confirmedOrder.orderNumber} • Paid with {confirmedOrder.paymentMethod.toUpperCase()}
                </p>
              </div>

              {/* Courier Card Preview */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Delivery to {confirmedOrder.address.locality}</span>
                  <span className="text-[#E63946]">ETA: 15-25 Mins</span>
                </div>
                <p className="text-xs text-slate-600">
                  {confirmedOrder.address.street}, {confirmedOrder.address.locality} ({confirmedOrder.address.postalCode})
                </p>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-100 text-[#E63946] flex items-center justify-center font-bold text-xs">
                      JV
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{confirmedOrder.driver?.name}</div>
                      <div className="text-[10px] text-slate-400">{confirmedOrder.driver?.vehicle}</div>
                    </div>
                  </div>
                  <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                    Assigned & Packing
                  </span>
                </div>
              </div>

              {/* Action: Track Live Delivery */}
              <button
                onClick={() => {
                  onOrderCompleted(confirmedOrder);
                  onClose();
                }}
                className="w-full bg-[#E63946] hover:bg-[#D62839] text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 transition-all hover:scale-101"
              >
                <Truck className="w-5 h-5" />
                <span>Track Live Delivery on Malta Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        {step < 4 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-[#E63946] hover:bg-[#D62839] text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md shadow-red-500/20"
              >
                <span>Continue to {step === 1 ? 'Delivery Slot' : 'Payment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : paymentMethod !== 'stripe' || !stripeClientSecret ? (
              <button
                onClick={() => executeOrderCreation()}
                disabled={isProcessingPayment}
                className="px-7 py-3 bg-[#E63946] hover:bg-[#D62839] disabled:opacity-60 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/25 transition-all"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment (€{finalTotal.toFixed(2)})...</span>
                  </div>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Confirm & Pay €{finalTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
