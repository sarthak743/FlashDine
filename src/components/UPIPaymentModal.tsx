import { useState, useEffect } from 'react';
import { X, Check, ExternalLink, Copy, CheckCircle2, Loader2, CreditCard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/utils/cn';
import {
  getPaymentConfig, createPaymentOrder, verifyPayment, markOrderPaid,
  type PaymentConfig,
} from '@/utils/api';

interface UPIPaymentModalProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
  onClose: () => void;
}

type UPIApp = 'gpay' | 'phonepe' | 'paytm' | 'upi';

interface UPIOption {
  id: UPIApp;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  deepLinkScheme: string;
}

const UPI_OPTIONS: UPIOption[] = [
  { id: 'gpay',    label: 'Google Pay',    color: 'text-blue-300',   bgColor: 'bg-blue-500/10',   borderColor: 'border-blue-500/40',   icon: '🅶', deepLinkScheme: 'gpay'     },
  { id: 'phonepe', label: 'PhonePe',       color: 'text-purple-300', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/40', icon: '📱', deepLinkScheme: 'phonepe'  },
  { id: 'paytm',   label: 'Paytm',         color: 'text-blue-200',   bgColor: 'bg-sky-500/10',    borderColor: 'border-sky-500/40',    icon: '💳', deepLinkScheme: 'paytmmp'  },
  { id: 'upi',     label: 'Other UPI App', color: 'text-orange-300', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/40', icon: '🏦', deepLinkScheme: 'upi'      },
];

function buildUPILink(app: UPIApp, amount: number, orderId: string, merchantUpi: string, merchantName: string): string {
  const params = new URLSearchParams({
    pa: merchantUpi,
    pn: merchantName,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `FlashDine Order #${orderId}`,
  });
  switch (app) {
    case 'gpay':    return `gpay://upi/pay?${params}`;
    case 'phonepe': return `phonepe://pay?${params}`;
    case 'paytm':   return `paytmmp://pay?${params}`;
    default:        return `upi://pay?${params}`;
  }
}

// Minimal type declaration for the Razorpay checkout.js global constructor.
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: Record<string, string>;
  theme: { color: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

interface RazorpayInstance {
  open(): void;
}

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => RazorpayInstance;
  }
}

// Dynamically load Razorpay checkout.js script.
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function UPIPaymentModal({ amount, orderId, onSuccess, onClose }: UPIPaymentModalProps) {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [selectedApp, setSelectedApp] = useState<UPIApp>('gpay');
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoadingRazorpay, setIsLoadingRazorpay] = useState(false);

  // Fetch payment config from backend on mount.
  useEffect(() => {
    getPaymentConfig()
      .then(setConfig)
      .catch(() => {
        // Backend not available — use defaults (deeplink fallback).
        setConfig({ razorpayEnabled: false, keyId: null, merchantUpi: 'flashdine@upi', merchantName: 'FlashDine' });
      });
  }, []);

  const merchantUpi  = config?.merchantUpi  ?? 'flashdine@upi';
  const merchantName = config?.merchantName ?? 'FlashDine';

  const upiQRValue = `upi://pay?${new URLSearchParams({
    pa: merchantUpi, pn: merchantName,
    am: amount.toFixed(2), cu: 'INR',
    tn: `FlashDine Order #${orderId}`,
  })}`;

  // Open Razorpay Checkout.js modal.
  const handleRazorpayPay = async () => {
    if (!config?.keyId) return;
    setIsLoadingRazorpay(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay script');

      const rpOrder = await createPaymentOrder(orderId, amount);

      if (!window.Razorpay) throw new Error('Razorpay not available');
      const rzp = new window.Razorpay({
        key: rpOrder.keyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: merchantName,
        description: `Order #${orderId}`,
        order_id: rpOrder.razorpayOrderId,
        prefill: {},
        theme: { color: '#f97316' },
        handler: async (response) => {
          // Verify payment on backend.
          await verifyPayment({
            orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          setPaid(true);
          setTimeout(onSuccess, 1000);
        },
      });
      rzp.open();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setIsLoadingRazorpay(false);
    }
  };

  const handleAppPay = () => {
    const link = buildUPILink(selectedApp, amount, orderId, merchantUpi, merchantName);
    window.location.href = link;
  };

  const handleCopyUPI = async () => {
    await navigator.clipboard.writeText(merchantUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fallback "I've Completed Payment" — used when Razorpay is not configured.
  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      await markOrderPaid(orderId);
      setPaid(true);
      setTimeout(onSuccess, 1000);
    } catch {
      // Even if backend call fails, let the user proceed.
      setPaid(true);
      setTimeout(onSuccess, 1000);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-700/60 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-bold text-lg">UPI Payment</h2>
            <p className="text-zinc-400 text-sm">Amount: <span className="text-orange-400 font-bold">₹{amount}</span></p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paid ? (
          <div className="p-8 text-center animate-fade-in-scale">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">Payment Confirmed!</h3>
            <p className="text-zinc-400 text-sm">Your order has been placed. Redirecting…</p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Razorpay CTA — shown when Razorpay is configured */}
            {config?.razorpayEnabled && (
              <button
                onClick={handleRazorpayPay}
                disabled={isLoadingRazorpay}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/30"
              >
                {isLoadingRazorpay ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading Payment…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ₹{amount} via Razorpay
                  </>
                )}
              </button>
            )}

            {/* Divider */}
            {config?.razorpayEnabled && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-zinc-500 text-xs">or scan / use UPI app directly</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>
            )}

            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center">
              <QRCodeSVG
                value={upiQRValue}
                size={160}
                bgColor="#ffffff"
                fgColor="#18181b"
                level="M"
                includeMargin={false}
              />
              <p className="text-zinc-500 text-xs mt-3 text-center">Scan with any UPI app to pay</p>
            </div>

            {/* UPI App Selector */}
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Or open directly in
              </p>
              <div className="grid grid-cols-2 gap-2">
                {UPI_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedApp(opt.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                      selectedApp === opt.id
                        ? `${opt.bgColor} ${opt.borderColor}`
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                    )}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className={cn('font-semibold text-sm', opt.color)}>{opt.label}</span>
                    {selectedApp === opt.id && (
                      <Check className="w-4 h-4 ml-auto text-orange-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI ID Copy */}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs mb-1">Merchant UPI ID</p>
                <p className="text-white font-mono text-sm">{merchantUpi}</p>
              </div>
              <button
                onClick={handleCopyUPI}
                className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 hover:bg-orange-500/20 px-3 py-2 rounded-lg"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAppPay}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-orange-500/50 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                <ExternalLink className="w-4 h-4 text-orange-400" />
                Open in {UPI_OPTIONS.find((o) => o.id === selectedApp)?.label}
              </button>

              {/* "I've paid" confirmation button — shown only when Razorpay is NOT active */}
              {!config?.razorpayEnabled && (
                <button
                  onClick={handleConfirmPayment}
                  disabled={isConfirming}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-green-500/30"
                >
                  {isConfirming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  I've Completed Payment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
