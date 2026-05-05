import { useStore } from '@/store/useStore';
import { menuItems } from '@/data/menuData';
import { cn } from '@/utils/cn';
import { Package, X } from 'lucide-react';
import { updateMenuStock } from '@/utils/api';

interface StockManagerProps {
  onClose: () => void;
}

export function StockManager({ onClose }: StockManagerProps) {
  const { menuStock, toggleStock } = useStore();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-zinc-900 w-full max-w-lg max-h-[80vh] rounded-t-3xl sm:rounded-3xl border border-zinc-700 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Stock Manager</h3>
              <p className="text-zinc-400 text-sm">Toggle item availability</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        
        {/* Items List */}
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
          {menuItems.map((item) => {
            const stockInfo = menuStock[item.id] || { inStock: item.inStock };
            const isInStock = stockInfo.inStock;
            const isLimited = stockInfo.isLimited || false;
            const estimatedRestockTime = stockInfo.estimatedRestockTime || '';
            
            const handleToggleStock = async () => {
              const newInStock = !isInStock;
              toggleStock(item.id, { inStock: newInStock });
              try {
                await updateMenuStock(item.id, newInStock, isLimited, estimatedRestockTime);
              } catch (err) {
                console.error('Failed to update stock in backend', err);
                toggleStock(item.id, { inStock: !newInStock });
              }
            };
            
            const handleToggleLimited = async () => {
              const newIsLimited = !isLimited;
              toggleStock(item.id, { isLimited: newIsLimited });
              try {
                await updateMenuStock(item.id, isInStock, newIsLimited, estimatedRestockTime);
              } catch (err) {
                toggleStock(item.id, { isLimited: !newIsLimited });
              }
            };

            const handleTimeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
              const newTime = e.target.value;
              toggleStock(item.id, { estimatedRestockTime: newTime });
              try {
                await updateMenuStock(item.id, isInStock, isLimited, newTime);
              } catch (err) {
                console.error(err);
              }
            };

            return (
              <div
                key={item.id}
                className="flex flex-col bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <p className="text-white font-medium text-sm">{item.name}</p>
                      <p className="text-zinc-500 text-xs capitalize">{item.category}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleToggleStock}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0',
                      isInStock
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    )}
                  >
                    {isInStock ? 'In Stock' : 'Sold Out'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center pl-[60px]">
                  {isInStock ? (
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400">
                      <input 
                        type="checkbox" 
                        checked={isLimited} 
                        onChange={handleToggleLimited}
                        className="rounded border-zinc-600 bg-zinc-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-800"
                      />
                      Mark as Limited Stock
                    </label>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">Restock in:</span>
                      <input 
                        type="text" 
                        placeholder="e.g. 30 mins" 
                        defaultValue={estimatedRestockTime}
                        onBlur={handleTimeBlur}
                        onChange={(e) => toggleStock(item.id, { estimatedRestockTime: e.target.value })}
                        className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm text-white w-32 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
