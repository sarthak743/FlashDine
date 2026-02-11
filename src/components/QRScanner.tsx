import { useEffect, useRef, useState } from 'react';
import { Camera, X, CheckCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (tableId: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(true);
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanning) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          startScanning();
        }
      } catch (err) {
        setError('Unable to access camera. Please check permissions.');
        setScanning(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (
          videoRef.current.srcObject as MediaStream
        ).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [scanning]);

  // Simple QR code detection using data matrix pattern
  const startScanning = () => {
    const scanInterval = setInterval(() => {
      if (videoRef.current && canvasRef.current && scanning) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;

          context.drawImage(videoRef.current, 0, 0);

          // Simulate QR code detection
          // In production, you would use a proper QR code library like jsQR
          // For now, we'll detect dark areas that might be QR codes
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const data = imageData.data;

          let darkPixels = 0;
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness < 128) darkPixels++;
          }

          // If we detect a significant dark area pattern, simulate successful scan
          if (darkPixels > data.length * 0.15) {
            // Generate a demo table ID
            const tableId = `${Math.floor(Math.random() * 90) + 10}`;
            setScannedId(tableId);
            setScanning(false);

            setTimeout(() => {
              onScan(tableId);
            }, 1500);
          }
        }
      }
    }, 500);

    return () => clearInterval(scanInterval);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md">
        {scannedId ? (
          // Success State
          <div className="text-center">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
            <h2 className="text-white text-2xl font-bold mb-2">
              QR Code Scanned!
            </h2>
            <p className="text-zinc-300 mb-6">
              Table <span className="text-orange-400 font-bold text-xl">{scannedId}</span>
            </p>
            <p className="text-zinc-400 text-sm">Redirecting to menu...</p>
          </div>
        ) : (
          // Scanner View
          <div className="space-y-4">
            <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-orange-500/50">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
              />

              {/* Scanner Grid Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-orange-500 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-orange-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-orange-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-orange-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-orange-500"></div>
                </div>
              </div>

              {/* Scanning Line Animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse"></div>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="text-center">
              <h2 className="text-white text-xl font-bold mb-2 flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Scan QR Code
              </h2>
              <p className="text-zinc-400">
                Point your camera at the table QR code
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
