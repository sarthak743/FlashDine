export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'snacks' | 'meals' | 'beverages' | 'desserts';
  image: string;
  inStock: boolean;
  prepTime: number; // in minutes
  isPopular?: boolean; // Mark popular items
  isFavorite?: boolean; // Mark as favorite
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image?: string;
  cuisine: string;
  rating?: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  minOrder?: number;
}

export interface Order {
  id: string;
  receiptId: string; // Receipt number for tracking and banning
  tableId: string;
  restaurantId?: string; // Restaurant ID for multi-restaurant support
  customerDetails: CustomerDetails;
  items: CartItem[];
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'completed';
  paymentMethod: 'upi' | 'counter';
  estimatedTime?: number; // in minutes
  isPaid: boolean; // Payment status
  receiptBannedAt?: Date; // When receipt was banned
  createdAt: Date;
  updatedAt: Date;
}

export type Category = 'all' | 'snacks' | 'meals' | 'beverages' | 'desserts';
