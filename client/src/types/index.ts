export type CategoryId =
  | 'all'
  | 'fresh-produce'
  | 'rice-atta'
  | 'dal-pulses'
  | 'spices-masalas'
  | 'dairy-paneer'
  | 'frozen-ready'
  | 'snacks-sweets'
  | 'beverages-tea'
  | 'bakery-breads'
  | 'household-care';

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  icon: string;
  count: number;
  image: string;
  description: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategoryId;
  subCategory?: string;
  price: number; // in EUR (€)
  originalPrice?: number;
  unit: string; // e.g. "1 kg", "500 g", "1 L", "Pack of 4"
  image: string;
  images?: string[];
  stock: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  reviews?: Review[];
  description: string;
  origin?: string; // e.g. "Malta", "India", "Italy", "Spain"
  isOrganic?: boolean;
  isVegetarian?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  discountPercent?: number;
  vatRate: number; // 0 for basic staples, 0.18 for standard
  sku: string;
  barcode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'confirmed'
  | 'packing'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  buildingName?: string;
  locality: string; // e.g. "Sliema", "Valletta", "St. Julian's", "Birkirkara", "Mosta"
  postalCode: string;
  notes?: string;
  coordinates?: { lat: number; lng: number };
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    unit: string;
  }[];
  subtotal: number;
  vatAmount: number;
  deliveryFee: number;
  discount: number;
  total: number;
  address: DeliveryAddress;
  paymentMethod: 'whatsapp' | 'stripe' | 'cod' | 'revolut' | 'apple_pay';
  paymentStatus: 'paid' | 'pending' | 'failed';
  deliverySlot: 'instant_bolt' | 'today_evening' | 'tomorrow_morning';
  estimatedDeliveryTime: string;
  driver?: {
    name: string;
    phone: string;
    vehicle: string;
    plateNumber: string;
    currentLocation: { lat: number; lng: number };
  };
  deliveryPhoto?: string;
  promoCode?: string;
}

export interface MaltaLocality {
  name: string;
  region: 'Central' | 'Northern' | 'Southern' | 'Harbour' | 'Gozo';
  postalPrefix: string;
  deliveryTimeMins: number;
  deliveryFee: number;
  coordinates: { lat: number; lng: number };
}
