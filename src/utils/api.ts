/**
 * FlashDine API client.
 * All requests go to /api/* which Vite proxies to the Express backend in dev,
 * or to the same origin in production.
 */

const BASE = '/api';

// ---------------------------------------------------------------------------
// Token storage — admin JWT kept only in memory (not localStorage) for security.
// ---------------------------------------------------------------------------
let _adminToken: string | null = null;

export function setAdminToken(token: string | null) {
  _adminToken = token;
}

export function getAdminToken(): string | null {
  return _adminToken;
}

// ---------------------------------------------------------------------------
// Low-level fetch helper
// ---------------------------------------------------------------------------
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  adminAuth = false,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminAuth && _adminToken) {
    headers['Authorization'] = `Bearer ${_adminToken}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
export interface LoginResponse {
  token: string;
  expiresIn: string;
}

export function adminLogin(password: string) {
  return request<LoginResponse>('POST', '/auth/login', { password });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export interface ApiOrder {
  id: string;
  receiptId: string;
  tableId: string;
  customerDetails: { name: string; phone: string; email?: string };
  items: ApiCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'completed';
  paymentMethod: 'upi' | 'counter';
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
  customerDetails: { name: string; phone: string; email?: string };
  items: ApiCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'upi' | 'counter';
}

export function createOrder(payload: CreateOrderPayload) {
  return request<ApiOrder>('POST', '/orders', payload);
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
