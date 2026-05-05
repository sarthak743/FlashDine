export interface AdminRecord {
  id: number;
  restaurant_id: string;
  email: string;
  password_hash?: string | null;
  oauth_google_id?: string | null;
  oauth_google_email?: string | null;
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

export declare const pool: unknown;
export declare const getDbPool: () => unknown;
export declare function initializeSchema(): Promise<void>;
export declare function getAdminByEmailAndRestaurant(
  email: string,
  restaurantId: string
): Promise<AdminRecord | null>;
export declare function getAdminByGoogleId(
  googleId: string
): Promise<AdminRecord | null>;
export declare function upsertAdminManual(
  restaurantId: string,
  email: string,
  passwordHash: string
): Promise<AdminRecord>;
export declare function createAdminManual(
  restaurantId: string,
  email: string,
  passwordHash: string
): Promise<AdminRecord>;
export declare function upsertAdminGoogle(
  googleId: string,
  email: string,
  restaurantId: string | null | undefined
): Promise<AdminRecord>;
export declare function getRestaurantById(
  restaurantId: string
): Promise<RestaurantRecord | null>;
export declare function seedDefaultRestaurants(): Promise<void>;
