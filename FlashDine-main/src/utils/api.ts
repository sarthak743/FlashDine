/**
 * FlashDine API client.
 * All requests go to /api/* which Vite proxies to the Express backend in dev,
 * or to the same origin in production.
 */

const BASE = '/api';
const DEFAULT_RESTAURANT_ID = 'default';
const CAMPUS_DELIGHTS_ALIAS = 'campus-delights';

function normalizeRestaurantId(restaurantId?: string | null): string {
  if (!restaurantId) {
    return DEFAULT_RESTAURANT_ID;
  }

  const normalized = restaurantId.trim().toLowerCase();
  if (!normalized || normalized === CAMPUS_DELIGHTS_ALIAS) {
    return DEFAULT_RESTAURANT_ID;
  }

  return normalized;
}

// ---------------------------------------------------------------------------
// Session persistence helper (restaurant id only)
// ---------------------------------------------------------------------------
let _restaurantId: string | null = null;

export function setAdminToken(_token: string | null, restaurantId?: string | null) {
  if (restaurantId) {
    _restaurantId = normalizeRestaurantId(restaurantId);
    localStorage.setItem('restaurantId', _restaurantId);
  } else {
    _restaurantId = null;
    localStorage.removeItem('restaurantId');
  }
}

export function getAdminToken(): string | null {
  // Session auth uses httpOnly cookies. Token is no longer used.
  return null;
}

export function getRestaurantId(): string | null {
  if (!_restaurantId) {
    _restaurantId = normalizeRestaurantId(localStorage.getItem('restaurantId'));
    localStorage.setItem('restaurantId', _restaurantId);
  }
  return _restaurantId;
}

export function clearAdminSession() {
  _restaurantId = null;
  localStorage.removeItem('restaurantId');
}

// ---------------------------------------------------------------------------
// Low-level fetch helper
// ---------------------------------------------------------------------------
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  _adminAuth = false,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, err?.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface AuthUser {
  id: number;
  email: string;
  restaurantId: string;
}

export interface LoginResponse {
  success: boolean;
  user: AuthUser;
}

export interface VerifyTokenResponse {
  authenticated: boolean;
  user?: AuthUser;
}

/**
 * Manual login with restaurant ID, email, and password
 */
export async function manualLogin(
  restaurantId: string,
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await request<LoginResponse>('POST', '/auth/login/manual', {
    restaurantId,
    email,
    password,
  });

  if (response.user?.restaurantId) {
    setAdminToken(null, response.user.restaurantId);
  }

  return response;
}

/**
 * Manual register with restaurant ID, email, and password
 */
export async function manualRegister(
  restaurantId: string,
  email: string,
  password: string
): Promise<LoginResponse> {
  const registrationRestaurantId = restaurantId || 'default';
  const response = await request<LoginResponse>('POST', '/auth/register/manual', {
    restaurantId: registrationRestaurantId,
    email,
    password,
  });

  if (response.user?.restaurantId) {
    setAdminToken(null, response.user.restaurantId);
  }

  return response;
}

/**
 * Initiate Google OAuth for login or register.
 */
export async function initiateGoogleLogin(
  mode: 'login',
  restaurantId?: string,
  redirectPath?: string
): Promise<{ redirectUrl: string }> {
  return request<{ redirectUrl: string }>('POST', '/auth/login/google/initiate', {
    mode,
    restaurantId,
    redirectPath,
  });
}

/**
 * Verify active session
 */
export async function verifyToken(): Promise<VerifyTokenResponse> {
  try {
    const result = await request<VerifyTokenResponse>('POST', '/auth/verify');
    if (result.user?.restaurantId) {
      setAdminToken(null, result.user.restaurantId);
    }
    return result;
  } catch (err) {
    clearAdminSession();
    throw err;
  }
}

/**
 * Logout — clear server and client session
 */
export function logout() {
  void request<{ success: boolean }>('POST', '/auth/logout').catch(() => {
    // Ignore network failures during logout; client state is still cleared.
  });
  clearAdminSession();
}

// Legacy function kept for compatibility with old imports.
export function adminLogin(password: string) {
  return manualLogin('default', 'admin@campus-delights.com', password);
}

// ---------------------------------------------------------------------------
// Menu / Stock Management
// ---------------------------------------------------------------------------
export async function getMenuStock(restaurantId: string): Promise<Record<string, boolean>> {
  return request<Record<string, boolean>>('GET', `/menu/stock/${restaurantId}`);
}

export async function updateMenuStock(itemId: string, inStock: boolean): Promise<{ success: boolean; itemId: string; inStock: boolean }> {
  return request<{ success: boolean; itemId: string; inStock: boolean }>('POST', '/menu/stock', { itemId, inStock }, true);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export interface ApiOrder {
  id: string;
  receiptId: string;
  restaurantId?: string;
  token: number;
  tableId: string;
  customerDetails: { name: string; phone: string; email?: string };
  items: ApiCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'completed';
  paymentMethod: 'upi';
  isPaid: boolean;
  estimatedTime?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  receiptBannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;
  description?: string;
  inStock?: boolean;
  prepTime?: number;
  isPopular?: boolean;
}

export interface CreateOrderPayload {
  id: string;
  receiptId: string;
  tableId: string;
  restaurantId?: string;
  customerDetails: { name: string; phone: string; email?: string };
  items: ApiCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'upi';
}

export function createOrder(payload: CreateOrderPayload) {
  return request<ApiOrder>('POST', '/orders', {
    ...payload,
    restaurantId: normalizeRestaurantId(payload.restaurantId),
  });
}

export function getOrder(orderId: string) {
  return request<ApiOrder>('GET', `/orders/${orderId}`);
}

export function getAllOrders() {
  return request<ApiOrder[]>('GET', '/orders', undefined, true);
}

export function updateOrderStatus(orderId: string, status: ApiOrder['status']) {
  return request<ApiOrder>('PATCH', `/orders/${orderId}/status`, { status }, true);
}

export function setEstimatedTime(orderId: string, estimatedTime: number) {
  return request<ApiOrder>('PATCH', `/orders/${orderId}/estimated-time`, { estimatedTime }, true);
}

export function markOrderPaid(orderId: string, razorpayPaymentId?: string) {
  return request<ApiOrder>('PATCH', `/orders/${orderId}/paid`, { razorpayPaymentId });
}

export function banReceipt(receiptId: string) {
  return request<{ success: boolean; receiptId: string }>('POST', '/orders/ban-receipt', { receiptId }, true);
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export interface PaymentConfig {
  razorpayEnabled: boolean;
  keyId: string | null;
  merchantUpi: string;
  merchantName: string;
}

export interface CreatePaymentOrderResponse {
  razorpayOrderId: string;
  amount: number;   // paise
  currency: string;
  keyId: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export function getPaymentConfig() {
  return request<PaymentConfig>('GET', '/payments/config');
}

export function createPaymentOrder(orderId: string, amount: number) {
  return request<CreatePaymentOrderResponse>('POST', '/payments/create-order', { orderId, amount });
}

export function verifyPayment(payload: VerifyPaymentPayload) {
  return request<{ success: boolean; orderId: string; razorpayPaymentId: string }>(
    'POST',
    '/payments/verify',
    payload,
  );
}
