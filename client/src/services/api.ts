/**
 * DESI BOLT — Frontend API Client
 * Connects to the backend REST API with automatic JWT token attachment.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
    const token = localStorage.getItem('desibolt_jwt');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = this.getHeaders(options.headers as Record<string, string>);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
      const err: any = new Error(errorMsg);
      err.status = response.status;
      err.code = data?.code;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  // ── Auth Endpoints ───────────────────────────────────────────────────────

  auth = {
    login: (body: { email: string; password: string }) =>
      this.request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    register: (body: { name: string; email: string; password: string; phone?: string; role?: string }) =>
      this.request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    getProfile: () => this.request<{ user: any }>('/auth/profile'),
  };

  // ── Products Endpoints ───────────────────────────────────────────────────

  products = {
    list: (params: { category?: string; search?: string; inStock?: boolean; page?: number; limit?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.category && params.category !== 'all') q.set('category', params.category);
      if (params.search) q.set('search', params.search);
      if (params.inStock) q.set('inStock', 'true');
      if (params.page) q.set('page', String(params.page));
      if (params.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return this.request<{ products: any[]; total: number; page: number; totalPages: number }>(
        `/products${qs ? `?${qs}` : ''}`
      );
    },

    get: (id: string) => this.request<any>(`/products/${id}`),

    getCategories: () => this.request<{ categories: any[]; totalCatalogCount: number }>('/categories'),
  };

  // ── Orders Endpoints ─────────────────────────────────────────────────────

  orders = {
    create: (orderData: any) =>
      this.request<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),

    get: (id: string) => this.request<any>(`/orders/${id}`),

    getUserOrders: (userId: string, params: { page?: number; limit?: number; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.page) q.set('page', String(params.page));
      if (params.limit) q.set('limit', String(params.limit));
      if (params.status && params.status !== 'all') q.set('status', params.status);
      const qs = q.toString();
      return this.request<{ orders: any[]; total: number; page: number; limit: number }>(
        `/users/${userId}/orders${qs ? `?${qs}` : ''}`
      );
    },

    updateStatus: (id: string, status: string, photoUrl?: string) =>
      this.request<any>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, photoUrl }),
      }),
  };

  // ── Promos Endpoints ─────────────────────────────────────────────────────

  promos = {
    validate: (code: string, cartSubtotal: number) =>
      this.request<{
        valid: boolean;
        code: string;
        discountType: 'fixed' | 'percent';
        discountValue: number;
        discountAmount: number;
        finalTotal: number;
        message: string;
      }>('/promos/validate', {
        method: 'POST',
        body: JSON.stringify({ code, cartSubtotal }),
      }),
  };

  // ── Payments Endpoints ───────────────────────────────────────────────────

  payments = {
    createIntent: (orderId: string, amount: number, currency: string = 'eur') =>
      this.request<{
        clientSecret: string;
        paymentIntentId: string;
        amount: number;
        amountInCents: number;
        currency: string;
        orderId: string;
        status: string;
      }>('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ orderId, amount, currency }),
      }),

    refund: (orderId: string, reason: string = 'requested_by_customer') =>
      this.request<{
        message: string;
        refundId: string;
        orderId: string;
        amount: number;
        currency: string;
      }>('/payments/refund', {
        method: 'POST',
        body: JSON.stringify({ orderId, reason }),
      }),
  };

  // ── Drivers & Fleet Endpoints ────────────────────────────────────────────

  drivers = {
    list: () => this.request<{ drivers: any[]; total: number }>('/drivers'),
  };

  // ── Admin Operations Endpoints ───────────────────────────────────────────

  admin = {
    getOverview: () => this.request<any>('/admin/overview'),

    createProduct: (productData: any) =>
      this.request<any>('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      }),

    updateProduct: (id: string, productData: any) =>
      this.request<any>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      }),

    deleteProduct: (id: string) =>
      this.request<any>(`/products/${id}`, {
        method: 'DELETE',
      }),

    getPromos: () => this.request<{ promos: any[] }>('/promos'),

    createPromo: (promoData: any) =>
      this.request<any>('/promos', {
        method: 'POST',
        body: JSON.stringify(promoData),
      }),
  };
}

export const api = new ApiClient();
