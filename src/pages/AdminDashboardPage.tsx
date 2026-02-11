import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useStore } from '@/store/useStore';
import { LogOut, Clock, Eye, EyeOff } from 'lucide-react';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { orders, isAdmin, setIsAdmin, updateOrderEstimatedTime } = useStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  if (!isAdmin) {
    navigate('/admin-login');
    return null;
  }

  const handleLogout = () => {
    setIsAdmin(false);
    navigate('/');
  };

  const handleSetEstimatedTime = (orderId: string) => {
    const timeInMinutes = parseInt(estimatedTime);
    if (timeInMinutes > 0) {
      updateOrderEstimatedTime(orderId, timeInMinutes);
      setSelectedOrderId(null);
      setEstimatedTime('');
    }
  };

  const toggleDetails = (orderId: string) => {
    setShowDetails((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-900 pb-10">
      <Header title="Admin Dashboard" showTableId={false} />

      {/* Logout Button */}
      <div className="flex justify-end p-4 border-b border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="p-4">
        {orders.length === 0 ? (
          <div className="bg-zinc-800/50 rounded-xl p-8 border border-zinc-700/50 text-center">
            <p className="text-zinc-400">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg mb-4">
              All Orders ({orders.length})
            </h2>

            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-4 border-b border-zinc-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-bold text-lg">
                        Order #{order.id}
                      </p>
                      <p className="text-zinc-400 text-sm">
                        Table {order.tableId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-400 font-bold text-lg">
                        ₹{order.total}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                          order.status === 'received'
                            ? 'bg-blue-500/20 text-blue-400'
                            : order.status === 'preparing'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : order.status === 'ready'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Details Section */}
                <div className="px-4 py-3 bg-zinc-700/20 border-b border-zinc-700/50">
                  <button
                    onClick={() => toggleDetails(order.id)}
                    className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white font-semibold flex items-center gap-2">
                      {showDetails[order.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      Customer Details
                    </span>
                  </button>

                  {showDetails[order.id] && (
                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <p className="text-zinc-400">Name</p>
                        <p className="text-white font-medium">
                          {order.customerDetails.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Phone</p>
                        <p className="text-white font-medium">
                          {order.customerDetails.phone}
                        </p>
                      </div>
                      {order.customerDetails.email && (
                        <div>
                          <p className="text-zinc-400">Email</p>
                          <p className="text-white font-medium">
                            {order.customerDetails.email}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="p-4 border-b border-zinc-700/50">
                  <p className="text-zinc-400 font-semibold mb-2">Items:</p>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm text-zinc-300"
                      >
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estimated Time Section */}
                <div className="p-4 bg-zinc-700/20">
                  {selectedOrderId === order.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-white font-semibold text-sm block mb-2">
                          Estimated Time (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={estimatedTime}
                          onChange={(e) => setEstimatedTime(e.target.value)}
                          placeholder="e.g., 15"
                          className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleSetEstimatedTime(order.id)
                          }
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderId(null);
                            setEstimatedTime('');
                          }}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="w-full flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-semibold py-3 px-4 rounded-lg transition-colors border border-orange-500/30"
                    >
                      <Clock className="w-4 h-4" />
                      {order.estimatedTime
                        ? `Update Time (${order.estimatedTime} min)`
                        : 'Set Estimated Time'}
                    </button>
                  )}
                </div>

                {/* Payment Method */}
                <div className="px-4 py-3 text-sm text-zinc-400">
                  <span className="capitalize">
                    Payment: {order.paymentMethod === 'upi' ? 'UPI' : 'Counter'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
