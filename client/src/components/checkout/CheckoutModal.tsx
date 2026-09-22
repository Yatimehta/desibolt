import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { MALTA_LOCALITIES } from '../../data/maltaLocalities';
import { DeliveryAddress, Order } from '../../types';
import { 
  getWhatsAppOrderUrl, 
  buildWhatsAppOrderMessage, 
  STORE_ADDRESS, 
  STORE_CONTACT_PHONE, 
  WHATSAPP_BASE_URL 
} from '../../utils/whatsapp';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  ArrowLeft, 
  Truck, 
  Sparkles,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

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
  const { items, subtotal, deliveryFee, clearCart } = useCart();
  const { user, defaultAddress, saveAddress } = useAuth();
  const { createOrder } = useOrders();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Delivery Details, 2: Review & Send to WhatsApp, 3: Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [generatedWhatsAppLink, setGeneratedWhatsAppLink] = useState<string>('');

  // Step 1: Address State
  const [fullName, setFullName] = useState(defaultAddress?.fullName || user?.name || '');
  const [phone, setPhone] = useState(defaultAddress?.phone || '79791146');
  const [email, setEmail] = useState(defaultAddress?.email || user?.email || '');
  const [street, setStreet] = useState(defaultAddress?.street || 'Central store. Triq weid il ghajan  haz zabbar');
  const [locality, setLocality] = useState(defaultAddress?.locality || 'Haz-Zabbar');
  const [postalCode, setPostalCode] = useState(defaultAddress?.postalCode || 'ZBR 1000');
  const [notes, setNotes] = useState(defaultAddress?.notes || '');
  const [deliverySlot, setDeliverySlot] = useState<'instant_bolt' | 'today_evening' | 'tomorrow_morning'>('instant_bolt');

  const currentLocalityObj = MALTA_LOCALITIES.find((l) => l.name.toLowerCase().includes(locality.toLowerCase())) || MALTA_LOCALITIES[0];
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  if (!isOpen) return null;

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    const newAddr: DeliveryAddress = {
      fullName: fullName.trim() || 'Customer',
      phone: phone.trim() || STORE_CONTACT_PHONE,
      email: email.trim() || 'orders@desibolt.com.mt',
      street: street.trim() || 'Malta Delivery',
      locality,
      postalCode,
      notes,
      coordinates: currentLocalityObj?.coordinates || { lat: 35.8761, lng: 14.5350 }
    };
    saveAddress(newAddr);
    setStep(2);
  };

  const handleSendWhatsAppOrder = () => {
    setIsSubmitting(true);

    const deliveryAddress: DeliveryAddress = {
      fullName: fullName.trim() || 'Customer',
      phone: phone.trim() || STORE_CONTACT_PHONE,
      email: email.trim() || 'orders@desibolt.com.mt',
      street: street.trim() || 'Malta Delivery',
      locality,
      postalCode,
      notes,
      coordinates: currentLocalityObj?.coordinates || { lat: 35.8761, lng: 14.5350 }
    };

    // 1. Create order in context
    const newOrder = createOrder(
      items,
      deliveryAddress,
      'whatsapp',
      deliverySlot
    );

    // 2. Generate WhatsApp URL
    const waUrl = getWhatsAppOrderUrl({
      items,
      address: deliveryAddress,
      deliverySlot,
      subtotal,
      discountAmount,
      deliveryFee,
      finalTotal,
      promoCode,
      orderNumber: newOrder.orderNumber
    });

    setGeneratedWhatsAppLink(waUrl);
    setConfirmedOrder(newOrder);

    // 3. Open WhatsApp directly in new tab/app
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // 4. Update UI to Step 3 Confirmation & clear cart
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
      clearCart();

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.error('Confetti error', e);
      }
    }, 600);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[92vh] overflow-y-auto flex flex-col relative cursor-default"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="DESI BOLT" className="w-8 h-8 rounded-xl object-cover shadow-sm border border-red-500/20" />
            <div>
              <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
                <span className="text-[#E63946]">DESI BOLT</span> Direct WhatsApp Order
              </h3>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                No payment method needed • Direct to WhatsApp (+356 79791146)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200/80 flex items-center justify-around">
          {[
            { s: 1, label: '1. Delivery Details' },
            { s: 2, label: '2. Review & WhatsApp' },
            { s: 3, label: '3. Order Placed' }
          ].map(({ s, label }) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                step === s 
                  ? 'bg-[#E63946] text-white ring-2 ring-red-200' 
                  : step > s 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-[11px] font-bold ${
                step === s ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex-1 space-y-4">
          
          {/* STEP 1: Address & Timing */}
          {step === 1 && (
            <form onSubmit={handleProceedToReview} className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-[#E63946]" />
                <span>Where should we deliver your order?</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Borg"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone Number *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 79791146 or +356 79791146"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Locality in Malta *</label>
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
                        {loc.name} (~{loc.deliveryTimeMins}m ETA)
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
                    placeholder="e.g. ZBR 1000"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address, House/Flat/Apt No. *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 15, Triq San Pawl, Apt 2"
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
                  placeholder="e.g. Ring buzzer 2, leave at front door"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E63946] outline-hidden font-medium"
                />
              </div>

              {/* Delivery Speed Selector */}
              <div className="pt-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Select Delivery Speed
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliverySlot('instant_bolt')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      deliverySlot === 'instant_bolt'
                        ? 'border-[#E63946] bg-red-50/60 ring-2 ring-red-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-black text-slate-900">
                      <Zap className="w-3.5 h-3.5 text-[#E63946] fill-[#E63946]" />
                      <span>Instant Bolt</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">15-25 Mins (~Courier)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySlot('today_evening')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      deliverySlot === 'today_evening'
                        ? 'border-[#E63946] bg-red-50/60 ring-2 ring-red-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-black text-slate-900">
                      <Clock className="w-3.5 h-3.5 text-slate-700" />
                      <span>Today Evening</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">18:00 – 20:00</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySlot('tomorrow_morning')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      deliverySlot === 'tomorrow_morning'
                        ? 'border-[#E63946] bg-red-50/60 ring-2 ring-red-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-black text-slate-900">
                      <Truck className="w-3.5 h-3.5 text-slate-700" />
                      <span>Tomorrow AM</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">08:00 – 10:00</p>
                  </button>
                </div>
              </div>

              {/* Continue to Review Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full bg-[#E63946] hover:bg-[#D62839] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all hover:scale-101"
                >
                  <span>Review Order & Go to WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Review Order & WhatsApp Send */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              {/* WhatsApp Notice Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div className="text-xs">
                  <h4 className="font-extrabold text-emerald-950">Direct WhatsApp Ordering</h4>
                  <p className="text-emerald-800 text-[11px] leading-relaxed mt-0.5">
                    No card or online payment required. Clicking below will open WhatsApp with your item list and address pre-filled to <strong className="underline">+356 79791146</strong>.
                  </p>
                </div>
              </div>

              {/* Delivery Summary Pill */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-slate-500 font-semibold text-[11px]">
                  <span>DELIVERING TO:</span>
                  <button 
                    onClick={() => setStep(1)} 
                    className="text-[#E63946] hover:underline font-bold"
                  >
                    Edit
                  </button>
                </div>
                <div className="font-bold text-slate-900">
                  {fullName} ({phone})
                </div>
                <div className="text-slate-600 text-[11px]">
                  {street}, {locality} {postalCode && `(${postalCode})`}
                </div>
                {notes && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    Note: {notes}
                  </div>
                )}
              </div>

              {/* Items List Preview */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex justify-between">
                  <span>Basket Items ({items.length})</span>
                  <span>Total</span>
                </div>
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center justify-between gap-3 text-xs bg-white p-2 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={product.image} alt={product.name} className="w-8 h-8 rounded-lg object-cover border border-slate-100 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-800">{product.name}</span>
                          <span className="text-[10px] text-slate-400 block">{product.unit} × {quantity}</span>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 shrink-0">€{(product.price * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-slate-800">€{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({promoCode})</span>
                    <span>-€{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee ({locality})</span>
                  <span className="font-semibold text-slate-800">{deliveryFee === 0 ? 'FREE' : `€${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total to Pay</span>
                  <span className="text-[#E63946] text-base">€{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Store VAT & Address Info */}
              <div className="text-[11px] text-slate-400 text-center space-y-0.5">
                <div>Store: {STORE_ADDRESS}</div>
                <div>Helpdesk: +356 {STORE_CONTACT_PHONE}</div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsAppOrder}
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-101"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Opening WhatsApp...</span>
                    </div>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Send Order on WhatsApp (+356 79791146)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Order Placed Confirmation */}
          {step === 3 && confirmedOrder && (
            <div className="space-y-4 text-center py-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-block bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full mb-2">
                  ✓ ORDER SENT TO WHATSAPP (+356 79791146)
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Order Successfully Placed!
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Order Ref: <strong className="text-slate-800">#{confirmedOrder.orderNumber}</strong> • Total: <strong className="text-emerald-700">€{confirmedOrder.total.toFixed(2)}</strong>
                </p>
              </div>

              {/* Delivery Details Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Destination: {confirmedOrder.address.locality}</span>
                  <span className="text-[#E63946]">ETA: 15-25 Mins</span>
                </div>
                <p className="text-xs text-slate-600">
                  {confirmedOrder.address.street}, {confirmedOrder.address.locality}
                </p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-100 text-[#E63946] flex items-center justify-center font-bold text-xs">
                      DB
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{confirmedOrder.driver?.name}</div>
                      <div className="text-[10px] text-slate-400">{confirmedOrder.driver?.vehicle}</div>
                    </div>
                  </div>
                  <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Dispatching from Central Store
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                {generatedWhatsAppLink && (
                  <a
                    href={generatedWhatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Re-open WhatsApp Chat (+356 79791146)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  onClick={() => {
                    onOrderCompleted(confirmedOrder);
                    onClose();
                  }}
                  className="w-full bg-[#E63946] hover:bg-[#D62839] text-white font-black text-xs sm:text-sm py-3.5 rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all hover:scale-101"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Live Delivery on Map</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
