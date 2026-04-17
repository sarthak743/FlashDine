import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, CheckCircle, QrCode } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      stopCamera();
      setScannedData(code.data);
      setTimeout(() => onScan(code.data), 1200);
      return;
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [onScan, stopCamera]);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsReady(true);
            animFrameRef.current = requestAnimationFrame(scanFrame);
          };
        }
      } catch (_err) {
        if (mounted) {
          setError('Unable to access camera. Please allow camera permissions and try again.');
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [scanFrame, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-2xl">
        {scannedData ? (
          // Success State - show only sanitized, truncated data
          <div className="text-center animate-fade-in-scale">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
            <h2 className="text-white text-2xl font-bold mb-2">QR Code Scanned!</h2>
            <div className="bg-zinc-800/70 border border-zinc-700 rounded-xl px-4 py-3 mb-4 inline-block">
              <p className="text-orange-400 font-mono text-sm break-all max-w-xs">
                {scannedData.slice(0, 80)}{scannedData.length > 80 ? '…' : ''}
              </p>
            </div>
            <p className="text-zinc-400 text-sm">Redirecting to menu...</p>
          </div>
        ) : (
          // Scanner View
          <div className="space-y-4">
            <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-orange-500/60 aspect-[4/3] sm:aspect-video min-h-[340px] sm:min-h-[420px] max-h-[72vh]">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Scanner Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Dark corners outside the scan area */}
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-transparent z-10">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-orange-400 rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-orange-400 rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-orange-400 rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-orange-400 rounded-br-md" />
                  {/* Animated scan line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse top-1/2" />
                </div>
              </div>

              {/* Loading overlay when camera not ready */}
              {!isReady && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                  <div className="text-center">
                    <Camera className="w-10 h-10 text-orange-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-zinc-400 text-sm">Starting camera…</p>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="text-center">
              <h2 className="text-white text-2xl font-bold mb-1 flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-orange-400" />
                Scan Restaurant QR Code
              </h2>
              <p className="text-zinc-400 text-sm">
                Point your camera at a FlashDine table QR code
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Keep the full QR inside the large frame for fastest detection
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              onClick={handleClose}
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
