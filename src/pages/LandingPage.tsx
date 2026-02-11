import { QrCode, ChefHat, Smartphone, Clock, CreditCard, Lock, ArrowRight, Printer } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { QRScanner } from '@/components/QRScanner';
import { useStore } from '@/store/useStore';
import { cn } from '@/utils/cn';

export function LandingPage() {
  const navigate = useNavigate();
  const { orders, tableId } = useStore();
  const [showQRScanner, setShowQRScanner] = useState(false);

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
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Header with Admin Login */}
      <div className="flex justify-end p-4 animate-fade-in">
        <Link
          to="/admin-login"
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded-lg transition-all text-sm border border-zinc-700 hover:border-orange-500/50"
        >
          <Lock className="w-4 h-4" />
          <span>Admin</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/30 animate-float">
          <QrCode className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-3 animate-slide-up">
          Flash<span className="text-orange-500 animate-pulse">Dine</span>
        </h1>
        <p className="text-zinc-400 text-lg mb-8 max-w-xs animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Skip the queue. Order from your table. Pay in a flash.
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm">
          <div className="bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 rounded-xl p-4 border border-zinc-700/50 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10 animate-slide-up group cursor-pointer" style={{ animationDelay: '0.2s' }}>
            <Smartphone className="w-6 h-6 text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-zinc-400">Scan & Order</span>
          </div>
          <div className="bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 rounded-xl p-4 border border-zinc-700/50 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10 animate-slide-up group cursor-pointer" style={{ animationDelay: '0.25s' }}>
            <Clock className="w-6 h-6 text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-zinc-400">Track Live</span>
          </div>
          <div className="bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 rounded-xl p-4 border border-zinc-700/50 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10 animate-slide-up group cursor-pointer" style={{ animationDelay: '0.3s' }}>
            <CreditCard className="w-6 h-6 text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-zinc-400">Easy Pay</span>
          </div>
        </div>
        
        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <div className="w-full max-w-sm mb-8 space-y-3 animate-slide-up">
            <h2 className="text-white font-semibold text-sm px-2">Your Orders</h2>
            {activeOrders.map((order, index) => (
              <button
                key={order.id}
                onClick={() => navigate(`/track/${order.id}`)}
                className="w-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl p-5 text-left hover:border-orange-500/50 transition-all active:scale-[0.98] shadow-lg hover:shadow-lg hover:shadow-orange-500/10 overflow-hidden relative group animate-slide-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:via-orange-500/10 group-hover:to-orange-500/5 transition-all" />
                
                <div className="relative z-10 space-y-3">
                  {/* Order ID and Receipt */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-zinc-400 text-xs">Order #{order.id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Printer className="w-3 h-3 text-zinc-500" />
                        <span className="text-zinc-300 text-xs font-mono">{order.receiptId}</span>
                      </div>
                    </div>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold border',
                      getStatusColor(order.status)
                    )}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Estimated Time */}
                  {order.estimatedTime && (
                    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 text-sm font-medium">
                        {order.estimatedTime} mins
                      </span>
                    </div>
                  )}

                  {/* No time message */}
                  {!order.estimatedTime && order.status === 'received' && (
                    <div className="flex items-center gap-2 text-yellow-400 text-xs">
                      <Clock className="w-4 h-4" />
                      <span>Admin setting preparation time...</span>
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
                    <span className="text-white text-sm font-semibold">View Details</span>
                    <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Demo Links */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => setShowQRScanner(true)}
            className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 animate-slide-up border border-orange-400/50"
            style={{ animationDelay: '0.35s' }}
          >
            <div className="flex items-center justify-center gap-3">
              <Smartphone className="w-5 h-5" />
              <span>Use Camera to Scan QR</span>
            </div>
          </button>

          <Link
            to="/menu?table=12"
            className="block w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] border border-blue-400/50 animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center justify-center gap-3">
              <QrCode className="w-5 h-5" />
              <span>Demo Mode (Table 12)</span>
            </div>
          </Link>
          
          <Link
            to="/kitchen"
            className="block w-full bg-gradient-to-br from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-white font-semibold py-4 px-6 rounded-2xl border border-zinc-600 hover:border-orange-500/50 transition-all active:scale-[0.98] animate-slide-up"
            style={{ animationDelay: '0.45s' }}
          >
            <div className="flex items-center justify-center gap-3">
              <ChefHat className="w-5 h-5 text-orange-400" />
              <span>Kitchen Display System</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-zinc-500 text-sm">
          Demo Mode • Campus Dining Solution
        </p>
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
