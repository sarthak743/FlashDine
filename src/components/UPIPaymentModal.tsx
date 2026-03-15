import { useState } from 'react';
import { X, Check, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/utils/cn';

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
  icon: string; // emoji / text placeholder
  deepLinkScheme: string;
}

const UPI_OPTIONS: UPIOption[] = [
  {
    id: 'gpay',
    label: 'Google Pay',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    icon: '🅶',
    deepLinkScheme: 'gpay',
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
    icon: '📱',
    deepLinkScheme: 'phonepe',
  },
  {
    id: 'paytm',
    label: 'Paytm',
    color: 'text-blue-200',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/40',
    icon: '💳',
    deepLinkScheme: 'paytmmp',
  },
  {
    id: 'upi',
    label: 'Other UPI App',
    color: 'text-orange-300',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/40',
    icon: '🏦',
    deepLinkScheme: 'upi',
  },
];

// Demo merchant UPI ID – replace with the actual merchant VPA in production.
const MERCHANT_UPI = 'flashdine@upi';
const MERCHANT_NAME = 'FlashDine';

function buildUPILink(app: UPIApp, amount: number, orderId: string): string {
  const params = new URLSearchParams({
    pa: MERCHANT_UPI,
    pn: MERCHANT_NAME,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `FlashDine Order #${orderId}`,
  });

  switch (app) {
    case 'gpay':
      return `gpay://upi/pay?${params.toString()}`;
    case 'phonepe':
      return `phonepe://pay?${params.toString()}`;
    case 'paytm':
      return `paytmmp://pay?${params.toString()}`;
    default:
      return `upi://pay?${params.toString()}`;
  }
}

export function UPIPaymentModal({ amount, orderId, onSuccess, onClose }: UPIPaymentModalProps) {
  const [selectedApp, setSelectedApp] = useState<UPIApp>('gpay');
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);

  const upiParams = new URLSearchParams({
    pa: MERCHANT_UPI,
    pn: MERCHANT_NAME,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `FlashDine Order #${orderId}`,
  });
  const upiQRValue = `upi://pay?${upiParams.toString()}`;

  const handleAppPay = () => {
    const link = buildUPILink(selectedApp, amount, orderId);
    // Use location.href to trigger native UPI app on mobile; window.open may open a browser tab
    window.location.href = link;
  };

  const handleCopyUPI = async () => {
    await navigator.clipboard.writeText(MERCHANT_UPI);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = () => {
    setPaid(true);
    setTimeout(() => onSuccess(), 1000);
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
                <p className="text-white font-mono text-sm">{MERCHANT_UPI}</p>
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

              <button
                onClick={handleConfirmPayment}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-green-500/30"
              >
                <Check className="w-5 h-5" />
                I've Completed Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
