import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { UPIPaymentModal } from '@/components/UPIPaymentModal';
import { useStore } from '@/store/useStore';
import { ArrowLeft, Smartphone, Loader2, Clock, AlertCircle } from 'lucide-react';

import { createOrder } from '@/utils/api';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, tableId, clearCart, addOrder, markOrderAsPaid, customerDetails, currentRestaurant } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [showUPIModal, setShowUPIModal] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (!customerDetails) {
      navigate('/customer-details');
      return;
    }

    setIsProcessing(true);

    const orderId = `FD${Date.now().toString().slice(-6)}`;
    const receiptId = `RCP${Date.now().toString().slice(-8)}`;
    const paymentMethod = 'upi' as const;
    const targetRestaurantId = currentRestaurant?.id || 'default';

    try {
      // Persist order to backend
      const savedOrder = await createOrder({
        id: orderId,
        receiptId,
        tableId: tableId || 'unknown',
        restaurantId: targetRestaurantId,
        customerDetails,
        items: cart,
        subtotal,
        tax,
        total,
        paymentMethod,
      });

      // Also keep in local Zustand store for immediate access
      addOrder({
        id: savedOrder.id,
        receiptId: savedOrder.receiptId,
        restaurantId: savedOrder.restaurantId || targetRestaurantId,
        token: savedOrder.token,
        tableId: savedOrder.tableId,
        customerDetails: savedOrder.customerDetails,
        items: savedOrder.items.map(item => ({ ...item, description: item.description || '' })) as any,
        total: savedOrder.total,
        status: savedOrder.status,
        paymentMethod: savedOrder.paymentMethod,
        isPaid: savedOrder.isPaid,
        createdAt: new Date(savedOrder.createdAt),
        updatedAt: new Date(savedOrder.updatedAt),
      });

      setPendingOrderId(savedOrder.id);
      setShowUPIModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUPISuccess = () => {
    if (pendingOrderId) {
      markOrderAsPaid(pendingOrderId);
    }
    clearCart();
    setShowUPIModal(false);
    navigate(`/track/${pendingOrderId}`);
  };

  const handleUPIClose = () => {
    setShowUPIModal(false);
    if (pendingOrderId) {
      clearCart();
      navigate(`/track/${pendingOrderId}`);
    }
  };

  if (cart.length === 0 && !pendingOrderId) {
    navigate('/menu');
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-900 pb-32">
      <Header title="Checkout" showTableId={true} />
      
      {/* Back button */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to cart</span>
        </button>
      </div>
      
      {/* Order Summary */}
      <div className="px-4 py-4">
        {/* Customer Details */}
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 mb-4">
          <h3 className="text-white font-semibold mb-3">Delivery To</h3>
          {customerDetails ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Name</span>
                <span className="text-white">{customerDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Phone</span>
                <span className="text-white">{customerDetails.phone}</span>
              </div>
              <button
                onClick={() => navigate('/customer-details')}
                className="mt-2 text-orange-400 hover:text-orange-300 text-xs font-semibold transition-colors"
              >
                Edit Details
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-yellow-400 text-xs">
                Please enter your details before checkout
              </span>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 mb-4">
          <h3 className="text-white font-semibold mb-3">Order Summary</h3>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-400">
                  {item.name} x {item.quantity}
                </span>
                <span className="text-white">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t border-zinc-700 pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">GST (5%)</span>
                <span className="text-white">₹{tax}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2">
                <span className="text-white">Total</span>
                <span className="text-orange-400">₹{total}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Delivery Info */}
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 mb-4">
          <h3 className="text-white font-semibold mb-3">Delivery Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <span className="text-orange-400 font-bold text-lg">{tableId}</span>
              </div>
              <div>
                <p className="text-white font-medium">Table {tableId}</p>
                <p className="text-zinc-400 text-sm">Your order will be delivered here</p>
              </div>
            </div>

            {/* Estimated Time Info */}
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-semibold text-sm">Estimated Time</p>
                <p className="text-blue-300 text-xs">
                  Admin will provide estimated delivery time after order confirmation
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Method */}
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
          <h3 className="text-white font-semibold mb-3">Payment Method</h3>
          <div className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-orange-500 bg-orange-500/10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">UPI Only (GPay / PhonePe)</p>
              <p className="text-zinc-400 text-sm">Pay instantly with supported UPI apps</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">GPay</span>
                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">PhonePe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-transparent">
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing || !customerDetails}
          className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-orange-500/30 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>Place Order • ₹{total}</>
          )}
        </button>
      </div>

      {/* UPI Payment Modal */}
      {showUPIModal && pendingOrderId && (
        <UPIPaymentModal
          amount={total}
          orderId={pendingOrderId}
          onSuccess={handleUPISuccess}
          onClose={handleUPIClose}
        />
      )}
    </div>
  );
}
