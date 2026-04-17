import { Restaurant } from '@/types';

export const restaurants: Record<string, Restaurant> = {
  default: {
    id: 'default',
    name: 'Campus Delights',
    description: 'Your favorite campus dining destination',
    cuisine: 'Multi-Cuisine',
    rating: 4.5,
    deliveryTimeMin: 10,
    deliveryTimeMax: 20,
    minOrder: 100,
  },
  spice_house: {
    id: 'spice_house',
    name: 'Spice House',
    description: 'Authentic Indian flavors with a modern twist',
    cuisine: 'Indian',
    rating: 4.7,
    deliveryTimeMin: 15,
    deliveryTimeMax: 25,
    minOrder: 150,
  },
  pizza_palace: {
    id: 'pizza_palace',
    name: 'Pizza Palace',
    description: 'Freshly baked pizzas and Italian delights',
    cuisine: 'Italian',
    rating: 4.6,
    deliveryTimeMin: 12,
    deliveryTimeMax: 22,
    minOrder: 200,
  },
  fusion_hub: {
    id: 'fusion_hub',
    name: 'Fusion Hub',
    description: 'East meets West with innovative dishes',
    cuisine: 'Fusion',
    rating: 4.4,
    deliveryTimeMin: 20,
    deliveryTimeMax: 30,
    minOrder: 120,
  },
};

export function getRestaurantByQRCode(qrData: string): Restaurant {
  // Parse QR data format: "restaurant_id:table_id"
  const [restaurantId] = qrData.split(':');
  return restaurants[restaurantId] || restaurants.default;
}
