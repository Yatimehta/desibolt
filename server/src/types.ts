export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image: string;
  stock: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  origin?: string;
  isOrganic?: boolean;
  isVegetarian?: boolean;
  isBestSeller?: boolean;
  discountPercent?: number;
  vatRate: number; // 0 for basic staples, 0.18 for standard
  sku: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin' | 'driver';
  phone: string;
  createdAt: string;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  locality: string;
  postalCode: string;
  notes?: string;
  coordinates?: { lat: number; lng: number };
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  unit: string;
  vatRate?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  driverId?: string;
  promoCode?: string;
  createdAt: string;
  updatedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  deliveryPhoto?: string;
  status: 'confirmed' | 'packing' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  vatAmount: number;
  deliveryFee: number;
  discount: number;
  total: number;
  address: DeliveryAddress;
  paymentMethod: 'stripe' | 'cod' | 'revolut' | 'apple_pay';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  deliverySlot: string;
  estimatedDeliveryTime: string;
  driver?: {
    id?: string;
    name: string;
    phone: string;
    vehicle: string;
    plateNumber: string;
    currentLocation: { lat: number; lng: number };
  };
}

export type OrderStatus = Order['status'];

export interface Promo {
  id: string;
  code: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  minCartAmount: number;
  maxUses?: number;
  usageCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  vehicle: string;
  plateNumber?: string;
  rating: number;
  status: 'available' | 'on_delivery' | 'offline';
  currentLocation: { lat: number; lng: number };
  currentOrderId?: string | null;
  activeOrders?: number;
  createdAt?: string;
  updatedAt?: string;
}
