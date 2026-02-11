import { useState } from 'react';
import { Header } from '@/components/Header';
import { useStore } from '@/store/useStore';
import { StockManager } from '@/components/StockManager';
import { Clock, ChefHat, Bell, CheckCircle, RefreshCw, Package, Plus, X, Ban } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Order } from '@/types';

type FilterStatus = 'all' | 'received' | 'preparing' | 'ready' | 'completed';

const statusConfig = {
  received: { label: 'Received', color: 'bg-blue-500', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-yellow-500', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-500', icon: Bell },
  completed: { label: 'Completed', color: 'bg-zinc-500', icon: CheckCircle },
};

export function KitchenDisplayPage() {
  const { orders, updateOrderStatus, updateOrderEstimatedTime, banReceipt, addOrder } = useStore();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showStockManager, setShowStockManager] = useState(false);
  const [selectedOrderForTime, setSelectedOrderForTime] = useState<string | null>(null);
  const [estimatedTimeInput, setEstimatedTimeInput] = useState<string>('15');
  const [selectedOrderForBan, setSelectedOrderForBan] = useState<string | null>(null);

  const addDemoOrder = () => {
    const orderId = `FD${Date.now().toString().slice(-6)}`;
    const receiptId = `RCP${Date.now().toString().slice(-8)}`;
    const demoItems = [
      { id: 'meal-1', name: 'Butter Chicken Thali', description: 'Creamy butter chicken', price: 180, category: 'meals' as const, image: '', inStock: true, prepTime: 15, quantity: 1 },
      { id: 'bev-1', name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 20, category: 'beverages' as const, image: '', inStock: true, prepTime: 3, quantity: 2 },
    ];
    const newOrder = {
      id: orderId,
      receiptId,
      tableId: String(Math.floor(Math.random() * 20) + 1),
      items: demoItems,
      total: 220,
      status: 'received' as const,
      paymentMethod: Math.random() > 0.5 ? 'upi' as const : 'counter' as const,
      isPaid: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addOrder(newOrder);
  };

  const handleSetEstimatedTime = (orderId: string) => {
    const time = parseInt(estimatedTimeInput, 10);
    if (!isNaN(time) && time > 0) {
      updateOrderEstimatedTime(orderId, time);
      setSelectedOrderForTime(null);
      setEstimatedTimeInput('15');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'received':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      default:
        return null;
    }
  };

  const handleStatusUpdate = (orderId: string, currentStatus: Order['status']) => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      updateOrderStatus(orderId, nextStatus);
    }
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header title="Kitchen Display" showTableId={false} variant="kitchen" />
      
      {/* Filter Tabs */}
      <div className="sticky top-[60px] z-30 bg-zinc-950 border-b border-zinc-800 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(['all', 'received', 'preparing', 'ready', 'completed'] as FilterStatus[]).map((status) => {
            const count = status === 'all' 
              ? orders.length 
              : orders.filter((o) => o.status === status).length;
            
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  filterStatus === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  filterStatus === status ? 'bg-white/20' : 'bg-zinc-700'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Orders Grid */}
      <div className="p-4">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-zinc-400 text-lg font-medium mb-2">No orders yet</h3>
            <p className="text-zinc-500 text-sm">New orders will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;
              const nextStatus = getNextStatus(order.status);
              
              return (
                <div
                  key={order.id}
                  className={cn(
                    'bg-zinc-900 rounded-2xl border-2 overflow-hidden transition-all',
                    order.status === 'received' && 'border-blue-500/50 shadow-lg shadow-blue-500/10',
                    order.status === 'preparing' && 'border-yellow-500/50 shadow-lg shadow-yellow-500/10',
                    order.status === 'ready' && 'border-green-500/50 shadow-lg shadow-green-500/10 animate-pulse',
                    order.status === 'completed' && 'border-zinc-700 opacity-60'
                  )}
                >
                  {/* Order Header */}
                  <div className={cn('px-4 py-3 flex items-center justify-between', config.color)}>
                    <div className="flex items-center gap-2 text-white">
                      <StatusIcon className="w-5 h-5" />
                      <span className="font-semibold">{config.label}</span>
                    </div>
                    <span className="text-white/80 text-sm">Table {order.tableId}</span>
                  </div>
                  
                  {/* Order Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-bold text-lg">#{order.id}</span>
                      <span className="text-zinc-500 text-sm">{getTimeAgo(order.createdAt)}</span>
                    </div>
                    
                    {/* Items List */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2"
                        >
                          <span className="text-white">{item.name}</span>
                          <span className="text-orange-400 font-bold">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Payment Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        order.paymentMethod === 'upi' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                      )}>
                        {order.paymentMethod === 'upi' ? '✓ UPI Paid' : '⏳ Pay at Counter'}
                      </span>
                      <span className="text-zinc-400 text-sm ml-auto">₹{order.total}</span>
                    </div>

                    {/* Estimated Time Display */}
                    {order.estimatedTime && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300 text-sm font-medium">{order.estimatedTime} mins</span>
                      </div>
                    )}

                    {/* Receipt Display */}
                    <div className={cn(
                      'rounded-lg px-3 py-2 mb-4 flex items-center justify-between',
                      order.receiptBannedAt
                        ? 'bg-red-500/10 border border-red-500/30'
                        : 'bg-purple-500/10 border border-purple-500/30'
                    )}>
                      <span className={cn('text-sm font-medium', order.receiptBannedAt ? 'text-red-400' : 'text-purple-400')}>
                        Receipt: {order.receiptId}
                      </span>
                      {order.receiptBannedAt && (
                        <Ban className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    
                    {/* Action Button */}
                    {order.status === 'received' && !order.estimatedTime ? (
                      <button
                        onClick={() => {
                          setSelectedOrderForTime(order.id);
                          setEstimatedTimeInput('15');
                        }}
                        className="w-full py-3 rounded-xl font-semibold transition-all active:scale-[0.98] bg-purple-500 hover:bg-purple-600 text-white mb-3"
                      >
                        Set Preparation Time
                      </button>
                    ) : null}
                    
                    {nextStatus && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, order.status)}
                        className={cn(
                          'w-full py-3 rounded-xl font-semibold transition-all active:scale-[0.98] mb-3',
                          order.status === 'received' && 'bg-yellow-500 hover:bg-yellow-600 text-black',
                          order.status === 'preparing' && 'bg-green-500 hover:bg-green-600 text-white',
                          order.status === 'ready' && 'bg-zinc-600 hover:bg-zinc-500 text-white'
                        )}
                      >
                        {order.status === 'received' && 'Start Preparing →'}
                        {order.status === 'preparing' && 'Mark as Ready →'}
                        {order.status === 'ready' && 'Complete Order →'}
                      </button>
                    )}

                    {/* Ban Receipt Button - Show for ready or completed orders */}
                    {(order.status === 'ready' || order.status === 'completed') && !order.receiptBannedAt && (
                      <button
                        onClick={() => setSelectedOrderForBan(order.id)}
                        className="w-full py-2 rounded-xl font-semibold transition-all active:scale-[0.98] bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 text-sm flex items-center justify-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Ban Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button
          onClick={addDemoOrder}
          className="bg-blue-500 hover:bg-blue-600 border border-blue-400 rounded-full px-4 py-3 flex items-center gap-2 shadow-xl transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="text-white text-sm font-medium">Add Demo Order</span>
        </button>
        <button
          onClick={() => setShowStockManager(true)}
          className="bg-orange-500 hover:bg-orange-600 border border-orange-400 rounded-full px-4 py-3 flex items-center gap-2 shadow-xl transition-all active:scale-95"
        >
          <Package className="w-5 h-5 text-white" />
          <span className="text-white text-sm font-medium">Manage Stock</span>
        </button>
        <div className="bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 flex items-center gap-2 shadow-xl">
          <RefreshCw className="w-4 h-4 text-green-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-zinc-400 text-sm">Live updates</span>
        </div>
      </div>
      
      {/* Stock Manager Modal */}
      {showStockManager && <StockManager onClose={() => setShowStockManager(false)} />}

      {/* Set Preparation Time Modal */}
      {selectedOrderForTime && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-xl">Set Preparation Time</h3>
              <button
                onClick={() => setSelectedOrderForTime(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm font-medium mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={estimatedTimeInput}
                  onChange={(e) => setEstimatedTimeInput(e.target.value)}
                  min="1"
                  max="120"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Enter time in minutes"
                />
              </div>

              <p className="text-zinc-400 text-sm">
                Customer will see this time and proceed to payment after confirmation.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedOrderForTime(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSetEstimatedTime(selectedOrderForTime)}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all"
                >
                  Set Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban Receipt Confirmation Modal */}
      {selectedOrderForBan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Ban className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-bold text-xl">Ban Receipt?</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForBan(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-zinc-400 text-sm">
                Are you sure you want to ban this receipt? The customer will not be able to use this receipt to place a new order.
              </p>

              {selectedOrderForBan && orders.find(o => o.id === selectedOrderForBan) && (
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                  <p className="text-zinc-400 text-xs mb-1">Receipt ID</p>
                  <p className="text-white font-mono font-bold">{orders.find(o => o.id === selectedOrderForBan)?.receiptId}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedOrderForBan(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedOrderForBan) {
                      const order = orders.find(o => o.id === selectedOrderForBan);
                      if (order) {
                        banReceipt(order.receiptId);
                        setSelectedOrderForBan(null);
                      }
                    }
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Ban Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
