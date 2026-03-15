import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, QrCode, Smartphone, Info } from 'lucide-react';

interface SampleQR {
  label: string;
  restaurantId: string;
  tableId: string;
  description: string;
  color: string;
}

const sampleQRCodes: SampleQR[] = [
  {
    label: 'Campus Delights — Table 1',
    restaurantId: 'default',
    tableId: '1',
    description: 'Multi-Cuisine • Table 1',
    color: '#f97316',
  },
  {
    label: 'Spice House — Table 5',
    restaurantId: 'spice_house',
    tableId: '5',
    description: 'Authentic Indian • Table 5',
    color: '#ef4444',
  },
  {
    label: 'Pizza Palace — Table 3',
    restaurantId: 'pizza_palace',
    tableId: '3',
    description: 'Italian Delights • Table 3',
    color: '#22c55e',
  },
  {
    label: 'Fusion Hub — Table 7',
    restaurantId: 'fusion_hub',
    tableId: '7',
    description: 'East meets West • Table 7',
    color: '#3b82f6',
  },
];

export function SampleQRPage() {
  const navigate = useNavigate();
  const [selectedQR, setSelectedQR] = useState<SampleQR>(sampleQRCodes[0]);

  // QR value format: "restaurant_id:table_id"
  const qrValue = `${selectedQR.restaurantId}:${selectedQR.tableId}`;

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-orange-400" />
          <h1 className="text-white font-bold text-lg">Sample QR Codes</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 font-semibold text-sm mb-1">How to use</p>
            <p className="text-blue-400/80 text-xs leading-relaxed">
              Select a QR code below, then go back to the home page and tap{' '}
              <span className="font-semibold text-orange-400">"Scan QR Code to Order"</span>.
              Point your camera at the QR code displayed here to be redirected to the restaurant menu.
            </p>
          </div>
        </div>

        {/* Selected QR Code Display */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow-2xl shadow-black/50">
          <QRCodeSVG
            value={qrValue}
            size={220}
            bgColor="#ffffff"
            fgColor="#18181b"
            level="H"
            includeMargin={false}
          />
          <div className="mt-4 text-center">
            <p className="text-zinc-800 font-bold text-base">{selectedQR.label}</p>
            <p className="text-zinc-500 text-xs mt-1">{selectedQR.description}</p>
            <div className="mt-2 px-3 py-1 bg-zinc-100 rounded-full inline-block">
              <p className="text-zinc-600 font-mono text-xs">{qrValue}</p>
            </div>
          </div>
        </div>

        {/* Restaurant selector */}
        <div>
          <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider text-zinc-400">
            Select Restaurant
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {sampleQRCodes.map((qr) => (
              <button
                key={`${qr.restaurantId}-${qr.tableId}`}
                onClick={() => setSelectedQR(qr)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedQR.restaurantId === qr.restaurantId && selectedQR.tableId === qr.tableId
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${qr.color}20`, border: `2px solid ${qr.color}40` }}
                >
                  <QrCode className="w-5 h-5" style={{ color: qr.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{qr.label}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{qr.description}</p>
                </div>
                {selectedQR.restaurantId === qr.restaurantId && selectedQR.tableId === qr.tableId && (
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scan CTA */}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-orange-500/30 active:scale-[0.98]"
        >
          <Smartphone className="w-5 h-5" />
          <span>Go to Home &amp; Scan This QR</span>
        </button>
      </div>
    </div>
  );
}
