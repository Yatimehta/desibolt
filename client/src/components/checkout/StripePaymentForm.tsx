/**
 * DESI BOLT — Real Stripe PaymentElement Integration
 * Renders the official Stripe.js PaymentElement, manages confirmation, and handles card errors.
 */
import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Zap, ShieldCheck, AlertCircle, Lock } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  orderNumber: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError?: (errorMsg: string) => void;
  isProcessing: boolean;
  setIsProcessing: (loading: boolean) => void;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  orderNumber,
  onPaymentSuccess,
  isProcessing,
  setIsProcessing,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/account/orders`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please verify your card details.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      } else {
        // Requires action or processing
        onPaymentSuccess(paymentIntent?.id || `pi_${Date.now()}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during payment processing.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="bg-red-50 text-[#E63946] text-xs font-semibold p-3.5 rounded-2xl border border-red-200 flex items-center gap-2.5 animate-in shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Official Stripe Payment Element */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
        <span className="flex items-center gap-1 text-emerald-600">
          <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
        </span>
        <span>Order #{orderNumber}</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 bg-[#E63946] hover:bg-[#D62839] disabled:opacity-60 text-white text-xs font-black rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all hover:scale-101"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Authorising €{amount.toFixed(2)} with Stripe...</span>
          </div>
        ) : (
          <>
            <Zap className="w-4 h-4 fill-white" />
            <span>Pay €{amount.toFixed(2)} with Stripe</span>
          </>
        )}
      </button>
    </form>
  );
};
