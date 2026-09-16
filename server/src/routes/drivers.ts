/**
 * DESI BOLT — Drivers & Fleet Management Router
 * Mounted at: /api/drivers
 *
 * Routes:
 *   GET /                 — List all drivers with active status and locations (Admin only)
 *   GET /:id              — Get single driver profile (Admin or the driver themselves)
 *   POST /:id/accept-order — Driver accepts order for delivery (Driver auth)
 *   PATCH /:id/location   — Driver live GPS location update (Driver auth)
 *   PATCH /:id/status     — Update driver availability status (Driver auth or Admin)
 */
import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';

export function createDriversRouter(
  socketEmitter?: (event: string, data: any) => void
): Router {
  const router = Router();

  /**
   * GET /api/drivers
   * List all drivers with live location and current order counts (Admin only)
   */
  router.get('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
    try {
      const drivers = await db.drivers.findAll();
      return res.json({ drivers, total: drivers.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/drivers/:id
   * Get driver profile
   */
  router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const driver = await db.drivers.findById(req.params.id);
      if (!driver) {
        return res.status(404).json({ error: `Driver '${req.params.id}' not found.` });
      }

      // Permissions: Admin can view any driver; driver can view their own profile
      if (req.user?.role !== 'admin' && driver.userId && driver.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Access denied to this driver profile.' });
      }

      return res.json(driver);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/drivers/:id/accept-order
   * Driver accepts an order to deliver
   * Body: { orderId: string, eta?: string }
   */
  router.post('/:id/accept-order', authenticateToken, async (req: AuthRequest, res: Response) => {
    const driverId = req.params.id;
    const { orderId, eta = '22 mins' } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required.', code: 'missing_order_id' });
    }

    try {
      // 1. Verify Driver exists
      const driver = await db.drivers.findById(driverId);
      if (!driver) {
        return res.status(404).json({ error: `Driver '${driverId}' not found.`, code: 'driver_not_found' });
      }

      // Check permissions: requesting user must be the driver or an admin
      if (req.user?.role !== 'admin' && req.user?.role !== 'driver') {
        return res.status(403).json({ error: 'Driver privileges required.', code: 'forbidden' });
      }
      if (req.user?.role === 'driver' && driver.userId && driver.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Cannot accept orders for another driver.', code: 'forbidden' });
      }

      // 2. Verify Order exists
      const order = await db.orders.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: `Order '${orderId}' not found.`, code: 'order_not_found' });
      }

      if (['delivered', 'cancelled'].includes(order.status)) {
        return res.status(409).json({
          error: `Cannot accept order with status '${order.status}'.`,
          code: 'order_closed',
        });
      }

      const now = new Date().toISOString();

      // 3. Update Order status to 'dispatched' and assign driver
      const updatedOrder = await db.orders.updateDeliveryStatus(order.id, {
        status: 'dispatched',
        dispatchedAt: now,
        driverId: driver.id,
      });

      // 4. Update Driver status to 'on_delivery'
      const updatedDriver = await db.drivers.updateStatus(driver.id, 'on_delivery', order.id);

      // 5. Emit Socket event to subscriber channels
      if (socketEmitter) {
        socketEmitter('order:dispatched', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          driverId: driver.id,
          driverName: driver.name,
          driverPhone: driver.phone,
          vehicle: driver.vehicle,
          currentLocation: driver.currentLocation,
          status: 'dispatched',
          eta,
        });

        socketEmitter('order:status_updated', {
          id: order.id,
          status: 'dispatched',
          driver: {
            id: driver.id,
            name: driver.name,
            phone: driver.phone,
            vehicle: driver.vehicle,
            plateNumber: driver.plateNumber,
            currentLocation: driver.currentLocation,
          },
        });
      }

      console.log(
        `[DESI BOLT Fleet] 🛵 Driver ${driver.name} accepted delivery for order ${order.orderNumber}`
      );

      return res.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'dispatched',
        eta,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          vehicle: driver.vehicle,
          plateNumber: driver.plateNumber,
          currentLocation: driver.currentLocation,
        },
      });
    } catch (err: any) {
      console.error('[DESI BOLT Fleet] Accept order error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * PATCH /api/drivers/:id/location
   * Live GPS update for driver
   * Body: { latitude: number, longitude: number } OR { lat: number, lng: number }
   */
  router.patch('/:id/location', authenticateToken, async (req: AuthRequest, res: Response) => {
    const driverId = req.params.id;
    const lat = req.body.latitude ?? req.body.lat;
    const lng = req.body.longitude ?? req.body.lng;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: 'Latitude and longitude coordinates are required.',
        code: 'missing_coordinates',
      });
    }

    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);

    if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({
        error: 'Invalid latitude/longitude coordinates.',
        code: 'invalid_coordinates',
      });
    }

    try {
      const driver = await db.drivers.findById(driverId);
      if (!driver) {
        return res.status(404).json({ error: `Driver '${driverId}' not found.`, code: 'driver_not_found' });
      }

      // Check permissions: Driver or Admin
      if (req.user?.role !== 'admin' && req.user?.role !== 'driver') {
        return res.status(403).json({ error: 'Driver privileges required.', code: 'forbidden' });
      }

      const updatedDriver = await db.drivers.updateLocation(driverId, numLat, numLng);

      // Broadcast real-time location update to tracking customers
      if (socketEmitter) {
        socketEmitter('driver:location-update', {
          driverId,
          latitude: numLat,
          longitude: numLng,
          currentLocation: { lat: numLat, lng: numLng },
          currentOrderId: updatedDriver?.currentOrderId,
        });

        socketEmitter('driver:location_changed', {
          driverId,
          location: { lat: numLat, lng: numLng },
        });
      }

      return res.json({
        success: true,
        driverId,
        currentLocation: { lat: numLat, lng: numLng },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * PATCH /api/drivers/:id/status
   * Update driver availability ('available' | 'on_delivery' | 'offline')
   */
  router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
    const driverId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['available', 'on_delivery', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'invalid_status',
      });
    }

    try {
      const driver = await db.drivers.findById(driverId);
      if (!driver) {
        return res.status(404).json({ error: `Driver '${driverId}' not found.` });
      }

      if (req.user?.role !== 'admin' && req.user?.role !== 'driver') {
        return res.status(403).json({ error: 'Driver privileges required.' });
      }

      const updated = await db.drivers.updateStatus(driverId, status);
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}
