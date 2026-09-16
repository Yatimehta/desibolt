/**
 * DESI BOLT — Orders Router
 * Mounted at: /api/orders (and user history at /api/users/:id/orders)
 *
 * Routes:
 *   GET /users/:id/orders — Get user order history with pagination and status filters
 *   GET /                 — List all orders (Admin or authenticated user)
 *   GET /:id              — Get single order details
 *   POST /                — Create a new order
 *   PATCH /:id/status     — Update order status (with photoUrl, driver unassign, email on delivery)
 */
import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';
import { Order, OrderItem, Driver } from '../types.js';
import { 
  sendDeliveryConfirmationEmail, 
  sendOrderConfirmationEmail, 
  sendAdminNewOrderNotification 
} from '../services/email.js';

export function createOrdersRouter(
  socketEmitter?: (event: string, data: any) => void
): Router {
  const router = Router();

  /**
   * GET /api/orders
   * List all orders (Admin or fleet management)
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const orders = await db.orders.findAll();
      return res.json(orders);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/orders/:id
   * Get single order by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const order = await db.orders.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: `Order '${req.params.id}' not found.` });
      }
      return res.json(order);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/orders
   * Create new order
   */
  router.post('/', async (req: Request, res: Response) => {
    const {
      items,
      address,
      paymentMethod = 'stripe',
      deliverySlot = 'instant_bolt',
      promoCode,
      discount = 0,
      userId,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    if (!address || !address.street || !address.locality) {
      return res.status(400).json({ error: 'Valid delivery address is required.' });
    }

    try {
      // Validate stock availability
      for (const item of items) {
        const product = await db.products.findById(item.productId);
        if (product && item.quantity > product.stock) {
          return res.status(400).json({
            error: `Requested quantity for '${product.name}' (${item.quantity}) exceeds available stock (${product.stock}).`,
          });
        }
      }

      // Calculate financials
      let subtotal = 0;
      let vatAmount = 0;

      for (const item of items) {
        const lineTotal = item.price * item.quantity;
        subtotal += lineTotal;
        const rate = item.vatRate ?? 0;
        vatAmount += lineTotal * rate;
      }

      const deliveryFee = subtotal >= 30.0 ? 0.0 : 2.5;
      const parsedDiscount = parseFloat(discount) || 0;
      const total = Math.max(0, subtotal + vatAmount + deliveryFee - parsedDiscount);

      const orderNumber = `DB-MLT-${Math.floor(10000 + Math.random() * 90000)}`;

      // Assign an active available driver
      const drivers = await db.drivers.findAll();
      const assignedDriver = drivers.find((d: Driver) => d.status === 'available') || drivers[0];

      const newOrder = await db.orders.create({
        orderNumber,
        userId: userId ?? (req as AuthRequest).user?.id,
        driverId: assignedDriver?.id,
        promoCode,
        status: 'confirmed',
        items,
        subtotal: Number(subtotal.toFixed(2)),
        vatAmount: Number(vatAmount.toFixed(2)),
        deliveryFee,
        discount: Number(parsedDiscount.toFixed(2)),
        total: Number(total.toFixed(2)),
        address,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        deliverySlot,
        estimatedDeliveryTime: '15-25 mins',
        driver: assignedDriver
          ? {
              id: assignedDriver.id,
              name: assignedDriver.name,
              phone: assignedDriver.phone,
              vehicle: assignedDriver.vehicle,
              plateNumber: assignedDriver.plateNumber || 'BOLT-MT',
              currentLocation: assignedDriver.currentLocation,
            }
          : {
              name: 'Josef Vella',
              phone: '+356 7944 8833',
              vehicle: 'DESI BOLT Eco-Scooter #14',
              plateNumber: 'BOLT-77-MT',
              currentLocation: { lat: 35.8978, lng: 14.4795 },
            },
      });

      // If a promo code was used, increment its usage count
      if (promoCode) {
        await db.promos.incrementUsage(promoCode).catch(() => {});
      }

      // Send Order Confirmation & Admin Notification Emails
      const trackingUrl = `https://desibolt.com.mt/tracking?order=${newOrder.orderNumber}`;
      sendOrderConfirmationEmail(newOrder, trackingUrl).catch(() => {});
      sendAdminNewOrderNotification(newOrder).catch(() => {});

      if (socketEmitter) {
        socketEmitter('order:created', newOrder);
      }

      return res.status(201).json(newOrder);
    } catch (err: any) {
      console.error('[DESI BOLT Orders] Create error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * PATCH /api/orders/:id/status
   * Update order lifecycle status (supports delivered status, photoUrl, driver status update, email dispatch)
   */
  router.patch('/:id/status', async (req: Request, res: Response) => {
    const { status, photoUrl, driverId } = req.body;
    const validStatuses = [
      'confirmed',
      'packing',
      'dispatched',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    try {
      const order = await db.orders.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      const now = new Date().toISOString();
      const updatePayload: any = { status };

      if (status === 'dispatched') {
        updatePayload.dispatchedAt = now;
        if (driverId) updatePayload.driverId = driverId;
      }

      if (status === 'delivered') {
        updatePayload.deliveredAt = now;
        if (photoUrl) updatePayload.deliveryPhoto = photoUrl;
      }

      const updatedOrder = await db.orders.updateDeliveryStatus(req.params.id, updatePayload);
      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      // If marked delivered, release driver back to 'available'
      if (status === 'delivered') {
        const assignedDriverId = updatedOrder.driverId || updatedOrder.driver?.id;
        if (assignedDriverId) {
          await db.drivers.updateStatus(assignedDriverId, 'available', null).catch(() => {});
        }

        const ratingUrl = `https://desibolt.com/rate/${updatedOrder.orderNumber}`;

        // Send delivery confirmation email
        await sendDeliveryConfirmationEmail(updatedOrder, ratingUrl).catch((e) =>
          console.warn('[DESI BOLT Email] Error dispatching delivery email:', e.message)
        );

        if (socketEmitter) {
          socketEmitter('order:delivered', {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            status: 'delivered',
            deliveredAt: updatedOrder.deliveredAt || now,
            deliveryPhoto: updatedOrder.deliveryPhoto,
          });
        }

        return res.json({
          ...updatedOrder,
          rating_url: ratingUrl,
        });
      }

      if (socketEmitter) {
        socketEmitter('order:status_updated', {
          id: updatedOrder.id,
          status: updatedOrder.status,
        });
      }

      return res.json(updatedOrder);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}

/**
 * Controller helper for GET /api/users/:id/orders
 * Returns user order history with pagination & status filtering
 */
export async function getUserOrdersHandler(req: AuthRequest, res: Response) {
  const targetUserId = req.params.id;

  // 1. Verify Authentication & Authorization
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // User can only access their own orders unless they are an admin
  if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
    return res.status(403).json({
      error: 'Access denied. You can only view your own order history.',
      code: 'forbidden',
    });
  }

  // 2. Check if target user exists
  const targetUser = await db.users.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({
      error: `User '${targetUserId}' not found.`,
      code: 'user_not_found',
    });
  }

  // 3. Parse query parameters
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const status = req.query.status as string | undefined;

  try {
    const result = await db.orders.findByUserId(targetUserId, { page, limit, status });

    return res.json({
      orders: result.orders.map((o: Order) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        itemCount: o.items.reduce((sum: number, it: OrderItem) => sum + it.quantity, 0),
        items: o.items,
        address: o.address,
        createdAt: o.createdAt,
        deliveredAt: o.deliveredAt,
        dispatchedAt: o.dispatchedAt,
        deliveryPhoto: o.deliveryPhoto,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err: any) {
    console.error('[DESI BOLT Orders] User orders error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
