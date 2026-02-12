import { QrCode, ChefHat, Smartphone, Clock, CreditCard, Lock, ArrowRight, Printer, Zap, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { QRScanner } from '@/components/QRScanner';
import { useStore } from '@/store/useStore';
import { cn } from '@/utils/cn';

export function LandingPage() {
  const navigate = useNavigate();
  const { orders, tableId } = useStore();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = "Order smarter. Dine faster.";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  const handleQRScan = (tableId: string) => {
    navigate(`/menu?table=${tableId}`);
  };

  // Get active orders for current table
  const activeOrders = tableId 
    ? orders.filter((order) => order.tableId === tableId && order.status !== 'completed')
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'preparing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ready':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-zinc-700/20 text-zinc-400 border-zinc-700/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received':
        return 'Order Received';
      case 'preparing':
        return 'Preparing...';
      case 'ready':
        return 'Ready for Pickup!';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black animate-gradient" />
      
      {/* Floating Particle Orbs */}
      <div className="particle-orb w-96 h-96 bg-orange-500/20 absolute top-10 -left-48 animate-float-slow" style={{ animationDelay: '0s' }} />
      <div className="particle-orb w-80 h-80 bg-orange-600/15 absolute bottom-20 -right-40 animate-float-slow" style={{ animationDelay: '2s' }} />
      <div className="particle-orb w-64 h-64 bg-orange-400/10 absolute top-1/2 left-1/3 animate-float-slow" style={{ animationDelay: '4s' }} />
      
      {/* Light Streaks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-1 h-32 bg-gradient-to-b from-transparent via-orange-500/30 to-transparent animate-light-streak" style={{ left: '20%', animationDelay: '0s' }} />
        <div className="absolute w-1 h-24 bg-gradient-to-b from-transparent via-orange-400/20 to-transparent animate-light-streak" style={{ left: '60%', animationDelay: '1.5s' }} />
        <div className="absolute w-1 h-28 bg-gradient-to-b from-transparent via-orange-600/25 to-transparent animate-light-streak" style={{ left: '80%', animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
      {/* Header with Admin Login */}
      <div className="flex justify-end p-6 animate-fade-in">
        <Link
          to="/admin-login"
          className="glass-card hover:bg-zinc-800/80 text-zinc-400 hover:text-white px-5 py-2.5 rounded-xl transition-all text-sm border border-zinc-700/50 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 flex items-center gap-2 group"
        >
          <Lock className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span className="font-medium">Admin</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* Animated Logo */}
        <div className="relative mb-8 animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/40 to-orange-600/40 rounded-3xl blur-2xl animate-glow" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/50 transform hover:scale-105 transition-transform duration-300">
            <QrCode className="w-12 h-12 text-white" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-zinc-900 animate-pulse" />
          </div>
        </div>
        
        {/* Brand Name with Animation */}
        <h1 className="text-6xl font-black text-white mb-4 animate-fade-in-scale tracking-tight" style={{ animationDelay: '0.4s' }}>
          Flash<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 animate-gradient">Dine</span>
        </h1>
        
        {/* Typing Effect Tagline */}
        <div className="h-8 mb-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p className="text-zinc-400 text-lg font-medium inline-block">
            <span>{typedText}</span>
            <span className="inline-block w-0.5 h-5 bg-orange-500 ml-1 animate-pulse" />
          </p>
        </div>
        
        <p className="text-zinc-500 text-sm mb-12 max-w-md animate-slide-up" style={{ animationDelay: '0.8s' }}>
          Revolutionary QR-based ordering system for modern restaurants. Skip queues, order instantly, track live.
        </p>
        
        {/* Feature Cards with Glassmorphism and Staggered Animation */}
        <div className="grid grid-cols-3 gap-4 mb-12 w-full max-w-2xl px-4">
          <div 
            className="glass-card rounded-2xl p-6 hover:bg-zinc-800/60 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2 group cursor-pointer animate-slide-up"
            style={{ animationDelay: '1s' }}
          >
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-orange-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7 text-orange-400" />
              </div>
            </div>
            <h3 className="text-white font-bold text-sm mb-2">Scan & Order</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">Instant QR code scanning for seamless ordering</p>
          </div>
          
          <div 
            className="glass-card rounded-2xl p-6 hover:bg-zinc-800/60 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2 group cursor-pointer animate-slide-up"
            style={{ animationDelay: '1.15s' }}
          >
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-orange-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-orange-400" />
              </div>
            </div>
            <h3 className="text-white font-bold text-sm mb-2">Track Live</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">Real-time order status with kitchen updates</p>
          </div>
          
          <div 
            className="glass-card rounded-2xl p-6 hover:bg-zinc-800/60 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2 group cursor-pointer animate-slide-up"
            style={{ animationDelay: '1.3s' }}
          >
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-orange-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7 text-orange-400" />
              </div>
            </div>
            <h3 className="text-white font-bold text-sm mb-2">Easy Pay</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">Quick checkout with multiple payment options</p>
          </div>
        </div>
        
        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <div className="w-full max-w-2xl mb-10 space-y-4 animate-slide-up px-4" style={{ animationDelay: '1.45s' }}>
            <div className="flex items-center justify-between px-2">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Active Orders
              </h2>
              <span className="text-zinc-500 text-sm">{activeOrders.length} order{activeOrders.length > 1 ? 's' : ''}</span>
            </div>
            {activeOrders.map((order, index) => (
              <button
                key={order.id}
                onClick={() => navigate(`/track/${order.id}`)}
                className="w-full glass-card rounded-2xl p-6 text-left hover:bg-zinc-800/70 transition-all duration-300 active:scale-[0.98] shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 overflow-hidden relative group animate-slide-up border border-zinc-700/50 hover:border-orange-500/50"
                style={{ animationDelay: `${1.5 + index * 0.1}s` }}
              >
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 space-y-4">
                  {/* Order ID and Receipt */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-zinc-500 text-xs font-medium mb-1">Order ID</p>
                      <p className="text-white font-bold text-lg">#{order.id}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Printer className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-400 text-xs font-mono">{order.receiptId}</span>
                      </div>
                    </div>
                    <span className={cn(
                      'px-4 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-sm',
                      getStatusColor(order.status)
                    )}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Estimated Time */}
                  {order.estimatedTime && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-blue-400 text-xs font-medium mb-0.5">Estimated Time</p>
                        <p className="text-blue-300 text-lg font-bold">{order.estimatedTime} mins</p>
                      </div>
                    </div>
                  )}

                  {/* No time message */}
                  {!order.estimatedTime && order.status === 'received' && (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span className="font-medium">Kitchen is preparing your estimate...</span>
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
                    <span className="text-white text-sm font-bold">Track Order Progress</span>
                    <ArrowRight className="w-5 h-5 text-orange-400 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* CTA Buttons with Premium Effects */}
        <div className="w-full max-w-2xl space-y-4 px-4">
          <button
            onClick={() => setShowQRScanner(true)}
            className="relative block w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-500 hover:to-orange-600 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 animate-slide-up border border-orange-400/50 overflow-hidden group bg-[length:200%] hover:bg-[position:100%]"
            style={{ animationDelay: activeOrders.length > 0 ? '1.8s' : '1.45s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="relative flex items-center justify-center gap-3">
              <Smartphone className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-lg">Scan QR Code to Order</span>
            </div>
          </button>

          <Link
            to="/menu?table=12"
            className="relative block w-full glass-card hover:bg-zinc-800/80 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 active:scale-[0.98] border border-zinc-700/50 hover:border-blue-500/50 animate-slide-up shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 overflow-hidden group"
            style={{ animationDelay: activeOrders.length > 0 ? '1.9s' : '1.55s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-center gap-3">
              <QrCode className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-lg">Try Demo Mode (Table 12)</span>
            </div>
          </Link>
          
          <Link
            to="/kitchen"
            className="relative block w-full glass-card hover:bg-zinc-800/80 text-white font-semibold py-5 px-8 rounded-2xl border border-zinc-700/50 hover:border-orange-500/50 transition-all duration-300 active:scale-[0.98] animate-slide-up shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 overflow-hidden group"
            style={{ animationDelay: activeOrders.length > 0 ? '2s' : '1.65s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/10 to-orange-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-center gap-3">
              <ChefHat className="w-6 h-6 text-orange-400 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
              <span className="text-lg">Kitchen Display System</span>
            </div>
          </Link>
        </div>
        
        {/* Scroll Indicator */}
        <div className="mt-16 animate-scroll-bounce opacity-50">
          <ChevronDown className="w-6 h-6 text-zinc-500" />
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-zinc-500 text-sm font-medium">
            Live Demo • Campus Dining Solution
          </p>
        </div>
        <p className="text-zinc-600 text-xs">
          Powered by restaurant technology • Built for speed & efficiency
        </p>
      </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}
