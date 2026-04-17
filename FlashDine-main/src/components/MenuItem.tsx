import { MenuItem as MenuItemType } from '@/types';
import { useStore } from '@/store/useStore';
import { Plus, Minus, Clock, Heart } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MenuItemProps {
  item: MenuItemType;
}

export function MenuItem({ item }: MenuItemProps) {
  const { cart, addToCart, updateQuantity, menuStock, favoriteItems, toggleFavorite, addToRecentlyOrdered } = useStore();
  const cartItem = cart.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;
  const isInStock = menuStock[item.id] ?? item.inStock;
  const isFavorite = favoriteItems.has(item.id);

  const handleAddToCart = () => {
    addToCart(item);
    addToRecentlyOrdered(item.id);
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 rounded-2xl overflow-hidden border border-zinc-700/50 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10',
        !isInStock && 'opacity-60'
      )}
    >
      <div className="relative overflow-hidden group">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Popular Badge */}
        {item.isPopular && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse-glow">
            Popular
          </div>
        )}
        
        {/* Prep Time */}
        <div className="absolute top-2 right-2 bg-zinc-900/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3 text-orange-400" />
          <span className="text-xs text-zinc-300">{item.prepTime} min</span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => toggleFavorite(item.id)}
          className="absolute bottom-2 right-2 bg-zinc-900/80 backdrop-blur-sm rounded-full p-2 hover:bg-zinc-900 transition-all transform hover:scale-110 active:scale-95"
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-all',
              isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-400 hover:text-red-400'
            )}
          />
        </button>
        
        {!isInStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Sold Out
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-2">
            <h3 className="text-white font-semibold text-base leading-tight">{item.name}</h3>
            <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{item.description}</p>
          </div>
          <span className="text-orange-400 font-bold text-lg whitespace-nowrap">₹{item.price}</span>
        </div>
        
        {isInStock && (
          <div className="mt-3">
            {quantity === 0 ? (
              <button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
              >
                <Plus className="w-5 h-5" />
                Add to Tray
              </button>
            ) : (
              <div className="flex items-center justify-between bg-zinc-700/50 rounded-xl p-1 border border-zinc-600/50">
                <button
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="w-12 h-10 flex items-center justify-center bg-zinc-600 hover:bg-zinc-500 rounded-lg transition-all active:scale-95"
                >
                  <Minus className="w-5 h-5 text-white" />
                </button>
                <span className="text-white font-bold text-lg min-w-8 text-center">{quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="w-12 h-10 flex items-center justify-center bg-orange-500 hover:bg-orange-600 rounded-lg transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
