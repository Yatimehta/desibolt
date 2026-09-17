import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { db } from './db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
  requireRole,
  AuthRequest
} from './auth.js';
import { Product, Order, User, DeliveryAddress } from './types.js';
import { createPaymentsRouter } from './routes/payments.js';
import { createStripeWebhookRouter } from './webhooks/stripe.js';
import { createOrdersRouter, getUserOrdersHandler } from './routes/orders.js';
import { createPromosRouter } from './routes/promos.js';
import { createDriversRouter } from './routes/drivers.js';
import { sendAdminErrorAlert } from './services/email.js';

export const createApp = (socketEmitter?: (event: string, data: any) => void) => {
  const app = express();

  // --- SECURITY HEADERS MIDDLEWARE ---
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 1. HTTPS Redirect in production
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    // 2. HSTS (Strict-Transport-Security)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // 3. X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // 4. X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 5. Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 6. Permissions-Policy
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');

    // 7. Content Security Policy (CSP)
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://unpkg.com https://www.googletagmanager.com; connect-src 'self' http://localhost:* ws://localhost:* wss://* https://api.stripe.com https://*.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; frame-src 'self' https://js.stripe.com https://hooks.stripe.com;"
    );

    next();
  });

  // CORS — allow configured origins or wildcard in dev
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : '*';
  app.use(cors({ origin: corsOrigins }));

  // Raw body parser support for Stripe Webhook signatures
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use(express.json());

  // --- HEALTH & DATABASE ---
  app.get('/api/health', async (req: Request, res: Response) => {
    const dbHealth = await db.getHealth();
    res.json({
      status: 'ok',
      service: 'DESI BOLT Malta API',
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  });

  app.get('/api/db/health', async (req: Request, res: Response) => {
    try {
      const health = await db.getHealth();
      if (health.status === 'disconnected') {
        return res.status(503).json({ error: 'Database service unavailable', health });
      }
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- AUTHENTICATION ROUTES ---
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password, phone = '+356 9900 0000', role = 'customer' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (!email.includes('@') || password.length < 6) {
      return res.status(422).json({
        error: 'Invalid email format or password shorter than 6 characters.'
      });
    }

    try {
      const existing = await db.users.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'User with this email already exists.' });
      }

      const passwordHash = await hashPassword(password);
      const newUser = await db.users.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role === 'admin' ? 'admin' : 'customer',
        phone,
        createdAt: new Date().toISOString()
      });

      const token = generateToken(newUser);
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
      const user = await db.users.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password credentials.' });
      }

      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password credentials.' });
      }

      const token = generateToken(user);
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/auth/profile', authenticateToken, (req: AuthRequest, res: Response) => {
    res.json({
      user: {
        id: req.user?.id,
        name: req.user?.name,
        email: req.user?.email,
        role: req.user?.role,
        phone: req.user?.phone
      }
    });
  });

  // --- ADMIN OPERATIONS & METRICS (Admin Only) ---
  app.get('/api/admin/overview', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
    try {
      const orders = await db.orders.findAll();
      const { products, total: totalCatalog } = await db.products.findAll({ limit: 1000 });
      const drivers = await db.drivers.findAll();
      const health = await db.getHealth();

      const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const totalVat = orders.reduce((sum: number, o: any) => sum + (o.vatAmount || 0), 0);
      const activeDeliveriesCount = orders.filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled').length;
      const lowStockCount = products.filter((p: any) => (p.stock || 0) <= 10).length;
      const availableDriversCount = drivers.filter((d: any) => d.isAvailable && d.status === 'online').length;

      res.json({
        metrics: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalVat: Number(totalVat.toFixed(2)),
          totalOrders: orders.length,
          activeDeliveriesCount,
          totalCatalogCount: totalCatalog,
          lowStockCount,
          availableDriversCount,
          totalDriversCount: drivers.length,
        },
        recentOrders: orders.slice(0, 10),
        databaseHealth: health,
        serverTime: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CATEGORIES ---
  app.get('/api/categories', (req: Request, res: Response) => {
    const categories = [
      { id: 'fresh-produce',   name: 'Fresh Fruits & Vegetables',    count: 840  },
      { id: 'dairy-paneer',    name: 'Dairy, Paneer & Eggs',          count: 420  },
      { id: 'rice-atta',       name: 'Atta, Flours & Basmati Rice',   count: 650  },
      { id: 'dal-pulses',      name: 'Dals, Lentils & Pulses',        count: 530  },
      { id: 'spices-masalas',  name: 'Spices, Masalas & Seasonings',  count: 1240 },
      { id: 'frozen-ready',    name: 'Frozen Foods & Instant Meals',  count: 780  },
      { id: 'snacks-sweets',   name: 'Snacks, Namkeen & Mithai',      count: 1120 },
      { id: 'beverages-tea',   name: 'Tea, Coffee & Cold Beverages',  count: 690  },
      { id: 'bakery-breads',   name: 'Bakery, Rusk & Naan',           count: 412  },
      { id: 'household-care',  name: 'Household & Personal Care',     count: 480  }
    ];
    res.json({ categories, totalCatalogCount: 7162 });
  });

  // --- PRODUCTS CRUD & SEARCH ---
  app.get('/api/products', async (req: Request, res: Response) => {
    const { category, search, minPrice, maxPrice, inStock, limit = '50', page = '1' } = req.query;

    try {
      const pageNum = parseInt(String(page)) || 1;
      const limitNum = parseInt(String(limit)) || 50;
      const offset = (pageNum - 1) * limitNum;

      const { products, total } = await db.products.findAll({
        category: category as string | undefined,
        search: search as string | undefined,
        inStockOnly: inStock === 'true',
        limit: limitNum,
        offset,
      });

      res.json({
        products,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const product = await db.products.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: `Product with ID '${req.params.id}' not found.` });
      }
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    const { name, brand, category, price, unit, stock = 100, sku } = req.body;

    if (!name || !price || !category || !unit) {
      return res.status(400).json({ error: 'Name, price, category, and unit are required fields.' });
    }
    if (price <= 0) {
      return res.status(422).json({ error: 'Product price must be greater than zero.' });
    }

    try {
      const newProd = await db.products.create({
        name,
        brand: brand || 'DESI BOLT',
        category,
        price: Number(price),
        unit,
        image: req.body.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
        stock: Number(stock),
        rating: 5.0,
        reviewCount: 0,
        description: req.body.description || `Fresh ${name} in Malta.`,
        vatRate: ['snacks-sweets', 'household-care'].includes(category) ? 0.18 : 0,
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`
      });
      res.status(201).json(newProd);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const existing = await db.products.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      const updated = await db.products.update(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const deleted = await db.products.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      res.json({ message: 'Product deleted successfully', id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CART CALCULATION & VAT VALIDATION ---
  app.post('/api/cart/validate', async (req: Request, res: Response) => {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart must contain an array of items.' });
    }

    try {
      let subtotal = 0;
      let vatAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const product = await db.products.findById(item.productId);
        if (!product) {
          return res.status(404).json({ error: `Item '${item.productId}' does not exist.` });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`
          });
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        vatAmount += itemTotal * (product.vatRate || 0);

        validatedItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          total: Number(itemTotal.toFixed(2)),
          vatRate: product.vatRate
        });
      }

      const deliveryFee = subtotal >= 30.0 ? 0.0 : 2.50;
      const total = subtotal + deliveryFee;

      res.json({
        items: validatedItems,
        subtotal: Number(subtotal.toFixed(2)),
        vatAmount: Number(vatAmount.toFixed(2)),
        deliveryFee,
        freeDeliveryUnlocked: subtotal >= 30.0,
        amountNeededForFreeDelivery: Math.max(0, Number((30.0 - subtotal).toFixed(2))),
        total: Number(total.toFixed(2)),
        currency: 'EUR'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- USER ORDER HISTORY ---
  app.get('/api/users/:id/orders', authenticateToken, getUserOrdersHandler);

  // --- ORDERS ---
  app.use('/api/orders', createOrdersRouter(socketEmitter));

  // --- PROMOS ---
  app.use('/api/promos', createPromosRouter());

  // --- DRIVERS & FLEET ---
  app.use('/api/drivers', createDriversRouter(socketEmitter));

  // --- STRIPE PAYMENTS & WEBHOOKS (real SDK) ---
  app.use('/api/payments', createPaymentsRouter(socketEmitter));
  app.use('/api/webhooks', createStripeWebhookRouter(socketEmitter));

  // --- 404 NOT FOUND HANDLER ---
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Route '${req.method} ${req.originalUrl}' not found.` });
  });

  // --- GLOBAL ERROR HANDLER ---
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[API Error Handler]', err);
    sendAdminErrorAlert('API Error', err.message || 'Internal Server Error', err.stack);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  });

  return app;
};
