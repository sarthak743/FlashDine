declare module '../db/postgres' {
  export interface AdminRecord {
    id: number;
    restaurant_id: string;
    email: string;
    password_hash?: string | null;
  }

  export interface RestaurantRecord {
    id: string;
    name: string;
    description?: string | null;
    cuisine?: string | null;
    rating?: number | null;
    delivery_time_min?: number | null;
    delivery_time_max?: number | null;
    min_order?: number | null;
  }

  export const pool: unknown;
  export const getDbPool: () => unknown;
  export function initializeSchema(): Promise<void>;
  export function getAdminByEmailAndRestaurant(
    email: string,
    restaurantId: string
  ): Promise<AdminRecord | null>;
  export function upsertAdminManual(
    restaurantId: string,
    email: string,
    passwordHash: string
  ): Promise<AdminRecord>;
  export function getRestaurantById(
    restaurantId: string
  ): Promise<RestaurantRecord | null>;
  export function seedDefaultRestaurants(): Promise<void>;
}
