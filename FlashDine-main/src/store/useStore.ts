import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem, Order, CustomerDetails, Restaurant, StockInfo } from '@/types';

interface StoreState {
  // Cart
  cart: CartItem[];
  tableId: string | null;
  customerDetails: CustomerDetails | null;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setTableId: (id: string) => void;
  setCustomerDetails: (details: CustomerDetails) => void;
  
  // Orders
  orders: Order[];
  currentOrderId: string | null;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderEstimatedTime: (orderId: string, estimatedTime: number) => void;
  markOrderAsPaid: (orderId: string) => void;
  banReceipt: (receiptId: string) => void;
  isReceiptBanned: (receiptId: string) => boolean;
  setCurrentOrderId: (id: string | null) => void;
  getOrderById: (id: string) => Order | undefined;
  
  // Receipt management
  bannedReceipts: Set<string>;
  
  // Restaurant
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  restaurantId: string | null;
  setRestaurantId: (id: string | null) => void;
  
  // Favorites & Preferences
  favoriteItems: Set<string>;
  toggleFavorite: (itemId: string) => void;
  recentlyOrdered: string[];
  addToRecentlyOrdered: (itemId: string) => void;
  
  // Admin
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  
  // Menu stock management
  menuStock: Record<string, StockInfo>;
  toggleStock: (itemId: string, info?: Partial<StockInfo>) => void;
  initializeStock: (items: MenuItem[] | Record<string, StockInfo>) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Cart
  cart: [],
  tableId: null,
  customerDetails: null,
  
  addToCart: (item) => {
    set((state) => {
      const existingItem = state.cart.find((i) => i.id === item.id);
      if (existingItem) {
        return {
          cart: state.cart.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { cart: [...state.cart, { ...item, quantity: 1 }] };
    });
  },
  
  removeFromCart: (itemId) => {
    set((state) => ({
      cart: state.cart.filter((i) => i.id !== itemId),
    }));
  },
  
  updateQuantity: (itemId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((i) => i.id !== itemId) };
      }
      return {
        cart: state.cart.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        ),
      };
    });
  },
  
  clearCart: () => set({ cart: [] }),
  
  setTableId: (id) => set({ tableId: id }),
  
  setCustomerDetails: (details) => set({ customerDetails: details }),
  
  // Orders
  orders: [],
  currentOrderId: null,
  
  addOrder: (order) => {
    set((state) => ({
      orders: [order, ...state.orders],
      currentOrderId: order.id,
    }));
  },
  
  updateOrderStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: new Date() } : o
      ),
    }));
  },
  
  updateOrderEstimatedTime: (orderId, estimatedTime) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, estimatedTime } : o
      ),
    }));
  },
  
  markOrderAsPaid: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, isPaid: true, updatedAt: new Date() } : o
      ),
    }));
  },

  banReceipt: (receiptId) => {
    set((state) => {
      const newBannedReceipts = new Set(state.bannedReceipts);
      newBannedReceipts.add(receiptId);
      return {
        bannedReceipts: newBannedReceipts,
        orders: state.orders.map((o) =>
          o.receiptId === receiptId 
            ? { ...o, receiptBannedAt: new Date(), updatedAt: new Date() }
            : o
        ),
      };
    });
  },

  isReceiptBanned: (receiptId) => {
    return get().bannedReceipts.has(receiptId);
  },
  
  setCurrentOrderId: (id) => set({ currentOrderId: id }),
  
  getOrderById: (id) => {
    return get().orders.find((o) => o.id === id);
  },
  
  // Receipt management
  bannedReceipts: new Set(),
  
  // Admin
  isAdmin: false,
  setIsAdmin: (value) => set({ isAdmin: value }),
  
  // Restaurant
  currentRestaurant: null,
  setCurrentRestaurant: (restaurant) => set({ currentRestaurant: restaurant }),
  
  restaurantId: null,
  setRestaurantId: (id) => set({ restaurantId: id }),
  
  // Favorites & Preferences
  favoriteItems: new Set(),
  toggleFavorite: (itemId) => {
    set((state) => {
      const newFavorites = new Set(state.favoriteItems);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      return { favoriteItems: newFavorites };
    });
  },
  
  recentlyOrdered: [],
  addToRecentlyOrdered: (itemId) => {
    set((state) => {
      // Add to beginning and keep only last 5
      const updated = [itemId, ...state.recentlyOrdered.filter(id => id !== itemId)].slice(0, 5);
      return { recentlyOrdered: updated };
    });
  },
  
  // Menu stock management
  menuStock: {},
  
  toggleStock: (itemId, info) => {
    set((state) => {
      const current = state.menuStock[itemId] || { inStock: true };
      
      let newInStock = current.inStock;
      if (info?.inStock !== undefined) {
        newInStock = info.inStock;
      } else if (!info || Object.keys(info).length === 0) {
        newInStock = !current.inStock;
      }
      
      return {
        menuStock: {
          ...state.menuStock,
          [itemId]: { 
            ...current, 
            ...info,
            inStock: newInStock 
          },
        },
      };
    });
  },
  
  initializeStock: (items) => {
    // If we receive an array as fallback
    if (Array.isArray(items)) {
      const stock: Record<string, StockInfo> = {};
      items.forEach((item) => {
        stock[item.id] = { inStock: item.inStock };
      });
      set({ menuStock: stock });
    } else {
      // Direct object assignment when fetched from backend
      set({ menuStock: items });
    }
  }
}),
{
    name: 'flashdine-storage',
      partialize: (state) => ({
        cart: state.cart,
        tableId: state.tableId,
        customerDetails: state.customerDetails,
        orders: state.orders,
        currentOrderId: state.currentOrderId,
        bannedReceipts: Array.from(state.bannedReceipts),
        restaurantId: state.restaurantId,
        favoriteItems: Array.from(state.favoriteItems),
        recentlyOrdered: state.recentlyOrdered,
        isAdmin: state.isAdmin,
      }),
      merge: (persistedState: any, currentState: StoreState) => ({
        ...currentState,
        ...persistedState,
        bannedReceipts: new Set(persistedState.bannedReceipts || []),
        favoriteItems: new Set(persistedState.favoriteItems || []),
        orders: (persistedState.orders || []).map((o: any) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt),
          receiptBannedAt: o.receiptBannedAt ? new Date(o.receiptBannedAt) : undefined,
        })),
      }),
    }
  )
);
