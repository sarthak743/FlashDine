import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useStore } from '@/store/useStore';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, tableId } = useStore();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + tax;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <Header showTableId={false} />
        <div className="flex flex-col items-center justify-center p-8 mt-20">
          <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-zinc-600" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Your tray is empty</h2>
          <p className="text-zinc-400 text-center mb-6">Add some delicious items from our menu</p>
          <Link
            to={`/menu${tableId ? `?table=${tableId}` : ''}`}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-all"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 pb-40">
      <Header title="Your Tray" showTableId={true} />
      
      {/* Back button */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Continue ordering</span>
        </button>
      </div>
      
      {/* Cart Items */}
      <div className="px-4 py-4 space-y-3">
        {cart.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50"
          >
            <div className="flex gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-semibold">{item.name}</h3>
                    <p className="text-orange-400 font-semibold mt-1">₹{item.price}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-all"
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-600 rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-zinc-400 ml-auto">₹{item.price * item.quantity}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Bill Summary */}
      <div className="px-4 mt-4">
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
          <h3 className="text-white font-semibold mb-3">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Subtotal</span>
              <span className="text-white">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">GST (5%)</span>
              <span className="text-white">₹{tax}</span>
            </div>
            <div className="border-t border-zinc-700 pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-orange-400">₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-transparent">
        <button
          onClick={() => navigate('/customer-details')}
          className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-orange-500/30"
        >
          Proceed to Checkout • ₹{total}
        </button>
      </div>
    </div>
  );
}
