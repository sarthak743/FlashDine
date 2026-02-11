import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';

export function FloatingCartButton() {
  const cart = useStore((state) => state.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-transparent z-50">
      <Link
        to="/cart"
        className="flex items-center justify-between w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-orange-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </div>
          <span className="text-lg">View Tray</span>
        </div>
        <span className="text-lg font-bold">₹{totalPrice}</span>
      </Link>
    </div>
  );
}
