import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useStore } from '@/store/useStore';
import { CheckCircle2, Clock, ChefHat, Bell, ArrowRight, Loader2, AlertCircle, CreditCard, Printer, Ban } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Order } from '@/types';

const statusSteps = [
  { key: 'received', label: 'Order Received', icon: CheckCircle2, description: 'Your order has been received' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Chef is preparing your food' },
  { key: 'ready', label: 'Ready!', icon: Bell, description: 'Your order is ready for pickup' },
];

export function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, getOrderById, markOrderAsPaid } = useStore();
  const [order, setOrder] = useState<Order | undefined>();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (orderId) {
      setOrder(getOrderById(orderId));
    }
  }, [orderId, orders, getOrderById]);

  const handleProceedToPayment = async () => {
    if (!orderId) return;
    setIsProcessingPayment(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    markOrderAsPaid(orderId);
    setIsProcessingPayment(false);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <Header showTableId={false} />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-12 h-12 text-zinc-600" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Order not found</h2>
          <p className="text-zinc-400 text-center mb-6">We couldn't find this order</p>
          <Link
            to="/"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-zinc-900 pb-32">
      <Header title="Order Tracking" showTableId={false} />
      
      {/* Order ID Card */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm">Order ID</p>
              <p className="text-2xl font-bold">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-100 text-sm">Table</p>
              <p className="text-2xl font-bold">{order.tableId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Ordered at {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Estimated Time */}
          {order.estimatedTime && (
            <div className="mt-4 bg-white/20 rounded-xl px-4 py-3">
              <p className="text-orange-100 text-xs mb-1">Estimated Delivery Time</p>
              <p className="text-2xl font-bold">{order.estimatedTime} mins</p>
            </div>
          )}

          {/* Waiting for Admin Message */}
          {!order.estimatedTime && !order.isPaid && (
            <div className="mt-4 bg-yellow-400/20 rounded-xl px-4 py-3 border border-yellow-400/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-yellow-300 text-sm font-semibold">Waiting for Admin</p>
                <p className="text-yellow-200/80 text-xs">Admin is setting the preparation time...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Section */}
      <div className="px-4 mb-6">
        <div className={cn(
          'rounded-2xl p-4 border',
          order.receiptBannedAt
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-zinc-800/50 border-zinc-700/50'
        )}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={cn('font-semibold flex items-center gap-2', order.receiptBannedAt ? 'text-red-400' : 'text-white')}>
              {order.receiptBannedAt ? (
                <>
                  <Ban className="w-5 h-5" />
                  Receipt Banned
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  Receipt
                </>
              )}
            </h3>
            {!order.receiptBannedAt && (
              <span className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-full">Active</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={order.receiptBannedAt ? 'text-red-300/70' : 'text-zinc-400'}>Receipt #</span>
              <span className={cn('text-lg font-bold', order.receiptBannedAt ? 'text-red-400' : 'text-white')}>{order.receiptId}</span>
            </div>
            {order.receiptBannedAt && (
              <div className="mt-3 pt-3 border-t border-red-500/30 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm">
                  This receipt has been invalidated by admin. No more orders can be placed with this receipt.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 mb-6">
        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/50">
          <h3 className="text-white font-semibold mb-3">Delivery To</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Name</span>
              <span className="text-white">{order.customerDetails.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Phone</span>
              <span className="text-white">{order.customerDetails.phone}</span>
            </div>
            {order.customerDetails.email && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Email</span>
                <span className="text-white text-xs">{order.customerDetails.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Timeline */}
      <div className="px-4 mb-6">
        <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700/50">
          <h3 className="text-white font-semibold mb-6">Order Status</h3>
          
          <div className="space-y-0">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                          isCompleted
                            ? 'bg-orange-500 shadow-lg shadow-orange-500/30'
                            : 'bg-zinc-700',
                          isCurrent && 'ring-4 ring-orange-500/30 animate-pulse'
                        )}
                      >
                        <Icon className={cn('w-6 h-6', isCompleted ? 'text-white' : 'text-zinc-400')} />
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={cn(
                            'w-0.5 h-12 -mb-1',
                            index < currentStepIndex ? 'bg-orange-500' : 'bg-zinc-700'
                          )}
                        />
                      )}
                    </div>
                    <div className="pt-2">
                      <p className={cn('font-semibold', isCompleted ? 'text-white' : 'text-zinc-500')}>
                        {step.label}
                      </p>
                      <p className={cn('text-sm', isCompleted ? 'text-zinc-400' : 'text-zinc-600')}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Order Items */}
      <div className="px-4 mb-6">
        <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/50">
          <h3 className="text-white font-semibold mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-400">
                  {item.name} x {item.quantity}
                </span>
                <span className="text-white">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t border-zinc-700 pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-orange-400">₹{order.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section - Show when estimated time is set and not yet paid */}
      {order.estimatedTime && !order.isPaid && (
        <div className="px-4 mb-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-blue-400 font-semibold">Ready to Pay</p>
                <p className="text-blue-300/80 text-sm">Estimated time is set. Proceed to payment.</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Order Amount</span>
                <span className="text-white font-bold text-lg">₹{order.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation */}
      {order.isPaid && (
        <div className="px-4 mb-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-green-400 font-bold text-xl mb-2">Payment Confirmed!</h3>
            <p className="text-green-300/80">Your order will be delivered soon</p>
          </div>
        </div>
      )}
      
      {/* Ready Notification */}
      {order.status === 'ready' && (
        <div className="px-4 mb-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-green-400 font-bold text-xl mb-2">Your Order is Ready!</h3>
            <p className="text-green-300/80">Please collect from the counter</p>
          </div>
        </div>
      )}
      
      {/* Payment or New Order Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-transparent">
        {order.estimatedTime && !order.isPaid ? (
          <button
            onClick={handleProceedToPayment}
            disabled={isProcessingPayment}
            className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-blue-500/30"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Proceed to Payment • ₹{order.total}
              </>
            )}
          </button>
        ) : (
          <Link
            to={`/menu?table=${order.tableId}`}
            className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-4 px-6 rounded-2xl border border-zinc-700 transition-all active:scale-[0.98]"
          >
            Order More
            <ArrowRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </div>
  );
}
