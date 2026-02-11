import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { MenuItem } from '@/components/MenuItem';
import { FloatingCartButton } from '@/components/FloatingCartButton';
import { menuItems } from '@/data/menuData';
import { restaurants, getRestaurantByQRCode } from '@/data/restaurants';
import { useStore } from '@/store/useStore';
import { Category } from '@/types';
import { Search, Star, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';

export function MenuPage() {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { setTableId, initializeStock, setCurrentRestaurant, currentRestaurant, recentlyOrdered } = useStore();

  useEffect(() => {
    const tableId = searchParams.get('table');
    const restaurantId = searchParams.get('restaurant');
    
    if (tableId) {
      setTableId(tableId);
    }
    
    // Get restaurant from QR code or use default
    const qrData = searchParams.get('qr');
    if (qrData) {
      const restaurant = getRestaurantByQRCode(qrData);
      setCurrentRestaurant(restaurant);
    } else if (restaurantId) {
      const restaurant = restaurants[restaurantId as keyof typeof restaurants] || restaurants.default;
      setCurrentRestaurant(restaurant);
    } else {
      setCurrentRestaurant(restaurants.default);
    }
    
    initializeStock(menuItems);
  }, [searchParams, setTableId, setCurrentRestaurant, initializeStock]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get popular items (first 4)
  const popularItems = menuItems.filter(item => item.isPopular).slice(0, 4);
  
  // Get recently ordered items
  const recentItems = recentlyOrdered
    .map(id => menuItems.find(item => item.id === id))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-zinc-900 pb-28">
      <Header />
      
      {/* Restaurant Header Banner */}
      {currentRestaurant && (
        <div className="bg-gradient-to-b from-orange-500/20 to-zinc-900 px-4 py-6 animate-fade-in">
          <div className="space-y-3">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">{currentRestaurant.name}</h2>
              <p className="text-orange-400 text-sm">{currentRestaurant.cuisine}</p>
            </div>
            <p className="text-zinc-300 text-sm">{currentRestaurant.description}</p>
            
            {/* Restaurant Info Grid */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 backdrop-blur-sm hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-bold">{currentRestaurant.rating ?? 4.5}</span>
                </div>
                <span className="text-xs text-zinc-400">Rating</span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 backdrop-blur-sm hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-bold">{currentRestaurant.deliveryTimeMax}m</span>
                </div>
                <span className="text-xs text-zinc-400">Delivery</span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 backdrop-blur-sm hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-white font-bold">₹{currentRestaurant.minOrder}</span>
                </div>
                <span className="text-xs text-zinc-400">Min Order</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Bar */}
      <div className="px-4 py-3 bg-zinc-900 sticky top-[60px] z-35">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>
      
      {/* Popular Items Section */}
      {popularItems.length > 0 && activeCategory === 'all' && !searchQuery && (
        <div className="px-4 py-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <h3 className="text-white font-bold text-lg">Popular Picks</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-in">
            {popularItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Ordered Section */}
      {recentItems.length > 0 && activeCategory === 'all' && !searchQuery && (
        <div className="px-4 py-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-bold text-lg">Order Again</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-in" style={{ animationDelay: '0.1s' }}>
            {recentItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
      
      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      
      {/* Menu Grid */}
      <div className="px-4 py-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-zinc-400 text-lg">No items found</p>
            <p className="text-zinc-500 text-sm mt-2">Try searching for something else</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filteredItems.map((item, index) => (
              <div key={item.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-slide-in-slow">
                <MenuItem key={item.id} item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      <FloatingCartButton />
    </div>
  );
}
