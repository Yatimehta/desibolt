import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, OrderStatus, DeliveryAddress, CartItem } from '../types';
import { DESI_BOLT_HUB } from '../data/maltaLocalities';

interface OrderContextType {
  orders: Order[];
  activeOrder: Order | null;
  createOrder: (
    items: CartItem[],
    address: DeliveryAddress,
    paymentMethod: Order['paymentMethod'],
    deliverySlot: 'instant_bolt' | 'today_evening' | 'tomorrow_morning'
  ) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  setActiveOrderId: (orderId: string | null) => void;
}

const INITIAL_DEMO_ORDER: Order = {
  id: 'ord-88329',
  orderNumber: 'DB-MLT-88329',
  createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  status: 'out_for_delivery',
  items: [
    {
      productId: 'fp-01',
      name: 'Maltese Farm Fresh Tomatoes',
      price: 1.85,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      unit: '1 kg'
    },
    {
      productId: 'dp-01',
      name: 'Amul Malai Fresh Paneer',
      price: 3.49,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&auto=format&fit=crop&q=80',
      unit: '400 g'
    },
    {
      productId: 'ar-01',
      name: 'Aashirvaad Superior Sharbati Atta',
      price: 14.50,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      unit: '10 kg Bag'
    }
  ],
  subtotal: 21.69,
  vatAmount: 0.0,
  deliveryFee: 2.50,
  discount: 0.0,
  total: 24.19,
  address: {
    fullName: 'Alex Camilleri',
    phone: '+356 79791146',
    email: 'alex@example.com.mt',
    street: 'Central store. Triq weid il ghajan  haz zabbar',
    buildingName: 'Central Store',
    locality: 'Haz-Zabbar',
    postalCode: 'ZBR 1000',
    notes: 'Ring buzzer, delivery ready',
    coordinates: { lat: 35.8761, lng: 14.5350 }
  },
  paymentMethod: 'whatsapp',
  paymentStatus: 'paid',
  deliverySlot: 'instant_bolt',
  estimatedDeliveryTime: '12 mins',
  driver: {
    name: 'Marco Grech',
    phone: '+356 7988 2211',
    vehicle: 'Honda PCX 125 (Red Bolt Edition)',
    plateNumber: 'DB-892-MT',
    currentLocation: { lat: 35.9065, lng: 14.4920 }
  }
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('desibolt_orders');
      return saved ? JSON.parse(saved) : [INITIAL_DEMO_ORDER];
    } catch {
      return [INITIAL_DEMO_ORDER];
    }
  });

  const [activeOrderId, setActiveOrderId] = useState<string | null>(INITIAL_DEMO_ORDER.id);

  useEffect(() => {
    try {
      localStorage.setItem('desibolt_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  // Real-time Driver Movement & Order Progress Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((ord) => {
          if (ord.status === 'out_for_delivery' && ord.driver && ord.address.coordinates) {
            const destLat = ord.address.coordinates.lat;
            const destLng = ord.address.coordinates.lng;
            const currentLat = ord.driver.currentLocation.lat;
            const currentLng = ord.driver.currentLocation.lng;

            // Interpolate driver position closer to destination
            const step = 0.08;
            const newLat = currentLat + (destLat - currentLat) * step;
            const newLng = currentLng + (destLng - currentLng) * step;

            const distance = Math.sqrt(
              Math.pow(destLat - newLat, 2) + Math.pow(destLng - newLng, 2)
            );

            if (distance < 0.001) {
              return {
                ...ord,
                status: 'delivered',
                estimatedDeliveryTime: 'Delivered just now',
                driver: {
                  ...ord.driver,
                  currentLocation: { lat: destLat, lng: destLng }
                }
              };
            }

            return {
              ...ord,
              estimatedDeliveryTime: `${Math.max(2, Math.round(distance * 300))} mins`,
              driver: {
                ...ord.driver,
                currentLocation: { lat: newLat, lng: newLng }
              }
            };
          }
          return ord;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const createOrder = (
    cartItems: CartItem[],
    address: DeliveryAddress,
    paymentMethod: Order['paymentMethod'] = 'whatsapp',
    deliverySlot: 'instant_bolt' | 'today_evening' | 'tomorrow_morning' = 'instant_bolt'
  ): Order => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const vatAmount = cartItems.reduce((sum, item) => {
      return sum + item.product.price * item.quantity * (item.product.vatRate || 0);
    }, 0);

    const deliveryFee = subtotal >= 30.0 ? 0.0 : 2.50;
    const total = subtotal + deliveryFee;

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `ord-${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber: `DB-MLT-${randomNum}`,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      items: cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        unit: item.product.unit
      })),
      subtotal: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      deliveryFee,
      discount: 0.0,
      total: Number(total.toFixed(2)),
      address,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      deliverySlot,
      estimatedDeliveryTime: '20-25 mins',
      driver: {
        name: 'Josef Vella',
        phone: '+356 7944 8833',
        vehicle: 'DESI BOLT Eco-Scooter #14',
        plateNumber: 'BOLT-77-MT',
        currentLocation: { ...DESI_BOLT_HUB.coordinates }
      }
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrderId(orderId);

    // Auto-progress simulated timeline
    setTimeout(() => {
      updateOrderStatus(orderId, 'packing');
    }, 4000);

    setTimeout(() => {
      updateOrderStatus(orderId, 'dispatched');
    }, 9000);

    setTimeout(() => {
      updateOrderStatus(orderId, 'out_for_delivery');
    }, 15000);

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
    );
  };

  const activeOrder = orders.find((o) => o.id === activeOrderId) || orders[0] || null;

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrder,
        createOrder,
        updateOrderStatus,
        setActiveOrderId
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
