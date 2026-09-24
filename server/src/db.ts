import { Pool, PoolClient, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';
import { Product, User, Order, OrderItem, DeliveryAddress, Promo, Driver } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IS_TEST = process.env.NODE_ENV === 'test';
const USE_POSTGRES = !!process.env.DATABASE_URL && !IS_TEST;

// ---------------------------------------------------------------------------
// Database Health Type
// ---------------------------------------------------------------------------

export interface DatabaseHealth {
  status: 'connected' | 'degraded' | 'disconnected';
  database: string;
  latencyMs: number;
  poolSize: number;
  activeConnections: number;
}

// ---------------------------------------------------------------------------
// Row → Domain mappers
// ---------------------------------------------------------------------------

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    category: row.category_id,
    price: parseFloat(row.price),
    originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
    unit: row.unit,
    image: row.image_url || '',
    stock: row.stock,
    inStock: row.in_stock ?? row.stock > 0,
    rating: parseFloat(row.rating),
    reviewCount: row.review_count,
    description: row.description || '',
    origin: row.origin,
    isOrganic: row.is_organic,
    isVegetarian: row.is_vegetarian,
    isBestSeller: row.is_best_seller,
    vatRate: parseFloat(row.vat_rate),
  };
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as User['role'],
    phone: row.phone || '',
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

function rowToOrderItem(row: any): OrderItem {
  return {
    productId: row.product_id,
    name: row.name,
    price: parseFloat(row.price),
    quantity: row.quantity,
    image: row.image_url || '',
    unit: row.unit || '1 unit',
    vatRate: row.vat_rate != null ? parseFloat(row.vat_rate) : undefined,
  };
}

function rowToOrder(row: any, items: OrderItem[] = []): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    driverId: row.driver_id,
    promoCode: row.promo_code,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
    dispatchedAt: row.dispatched_at?.toISOString?.() ?? row.dispatched_at,
    deliveredAt: row.delivered_at?.toISOString?.() ?? row.delivered_at,
    deliveryPhoto: row.delivery_photo,
    status: row.status as Order['status'],
    items,
    subtotal: parseFloat(row.subtotal),
    vatAmount: parseFloat(row.vat_amount),
    deliveryFee: parseFloat(row.delivery_fee),
    discount: parseFloat(row.discount),
    total: parseFloat(row.total),
    address: {
      fullName: row.delivery_full_name || '',
      phone: row.delivery_phone || '',
      email: row.delivery_email || '',
      street: row.delivery_street || '',
      locality: row.delivery_locality || '',
      postalCode: row.delivery_postal_code || '',
      coordinates:
        row.delivery_lat != null
          ? { lat: parseFloat(row.delivery_lat), lng: parseFloat(row.delivery_lng) }
          : undefined,
    },
    paymentMethod: row.payment_method as Order['paymentMethod'],
    paymentStatus: row.payment_status as Order['paymentStatus'],
    stripePaymentIntentId: row.stripe_payment_intent_id,
    deliverySlot: row.delivery_slot,
    estimatedDeliveryTime: row.estimated_delivery_time || '',
    driver: row.driver_name
      ? {
          id: row.driver_id,
          name: row.driver_name,
          phone: row.driver_phone || '',
          vehicle: row.driver_vehicle || '',
          plateNumber: row.driver_plate || '',
          currentLocation: {
            lat: row.driver_lat != null ? parseFloat(row.driver_lat) : 35.8978,
            lng: row.driver_lng != null ? parseFloat(row.driver_lng) : 14.4795,
          },
        }
      : undefined,
  };
}

function rowToPromo(row: any): Promo {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: parseFloat(row.discount_value),
    minCartAmount: parseFloat(row.min_cart_amount || 0),
    maxUses: row.max_uses != null ? parseInt(row.max_uses, 10) : undefined,
    usageCount: parseInt(row.usage_count || 0, 10),
    active: row.active,
    expiresAt: row.expires_at?.toISOString?.() ?? row.expires_at,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

function rowToDriver(row: any, activeOrders: number = 0): Driver {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone || '',
    vehicle: row.vehicle || '',
    plateNumber: row.plate_number || '',
    rating: parseFloat(row.rating || 5.0),
    status: row.status as Driver['status'],
    currentLocation: {
      lat: parseFloat(row.current_lat || 35.8978),
      lng: parseFloat(row.current_lng || 14.4795),
    },
    currentOrderId: row.current_order_id,
    activeOrders,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Real PostgreSQL Database Manager
// ---------------------------------------------------------------------------

class PostgresDatabase {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    const connectionString = process.env.DATABASE_URL || '';
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
    });

    this.pool.on('error', (err) => {
      console.error('[DESI BOLT PostgreSQL] Unexpected pool error:', err.message);
      this.isConnected = false;
    });
  }

  async connectWithRetry(maxAttempts = 5, baseDelayMs = 1000): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const client = await this.pool.connect();
        const res = await client.query('SELECT current_database(), version()');
        client.release();
        this.isConnected = true;
        console.log(
          `[DESI BOLT PostgreSQL] ✅ Connected to '${res.rows[0].current_database}' (attempt ${attempt}/${maxAttempts})`
        );
        return;
      } catch (err: any) {
        this.isConnected = false;
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `[DESI BOLT PostgreSQL] ⚠️ Connection attempt ${attempt}/${maxAttempts} failed: ${err.message}. Retrying in ${delay}ms…`
        );
        if (attempt === maxAttempts) {
          throw new Error(
            `[DESI BOLT PostgreSQL] Could not connect after ${maxAttempts} attempts: ${err.message}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
    console.log('[DESI BOLT PostgreSQL] Pool drained and closed.');
  }

  async getHealth(): Promise<DatabaseHealth> {
    const start = Date.now();
    try {
      const client = await this.pool.connect();
      const res = await client.query('SELECT current_database()');
      client.release();
      const latencyMs = Date.now() - start;
      return {
        status: latencyMs > 1000 ? 'degraded' : 'connected',
        database: res.rows[0]?.current_database ?? 'desibolt_malta_pg',
        latencyMs,
        poolSize: this.pool.totalCount,
        activeConnections: this.pool.waitingCount,
      };
    } catch {
      return {
        status: 'disconnected',
        database: 'desibolt_malta_pg',
        latencyMs: -1,
        poolSize: this.pool.totalCount,
        activeConnections: 0,
      };
    }
  }

  async runMigration(): Promise<void> {
    const candidates = [
      path.resolve(process.cwd(), 'migrate.sql'),
      path.resolve(process.cwd(), '..', 'migrate.sql'),
    ];
    const migratePath = candidates.find((p) => fs.existsSync(p));
    if (!migratePath) {
      console.warn('[DESI BOLT DB] migrate.sql not found — skipping migration.');
      return;
    }

    const sql = fs.readFileSync(migratePath, 'utf-8');
    let client: PoolClient | null = null;
    try {
      client = await this.pool.connect();
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('[DESI BOLT DB] ✅ Migration applied successfully.');
    } catch (err: any) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('[DESI BOLT DB] ❌ Migration failed:', err.message);
      throw err;
    } finally {
      client?.release();
    }
  }

  // ── Products Repository ──────────────────────────────────────────────────

  get products() {
    const self = this;
    return {
      findAll: async (filters: {
        category?: string;
        search?: string;
        inStockOnly?: boolean;
        limit?: number;
        offset?: number;
      } = {}): Promise<{ products: Product[]; total: number }> => {
        const conditions: string[] = ['is_active = true'];
        const params: any[] = [];

        if (filters.category && filters.category !== 'all') {
          params.push(filters.category);
          conditions.push(`category_id = $${params.length}`);
        }
        if (filters.search) {
          params.push(`%${filters.search}%`);
          conditions.push(`(name ILIKE $${params.length} OR brand ILIKE $${params.length})`);
        }
        if (filters.inStockOnly) {
          conditions.push('stock > 0');
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const countRes = await self.pool.query(`SELECT COUNT(*) FROM products ${where}`, params);
        const total = parseInt(countRes.rows[0].count, 10);

        const limit = filters.limit ?? 50;
        const offset = filters.offset ?? 0;
        params.push(limit, offset);

        const res = await self.pool.query(
          `SELECT * FROM products ${where} ORDER BY is_best_seller DESC, name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
          params
        );
        return { products: res.rows.map(rowToProduct), total };
      },

      findById: async (id: string): Promise<Product | null> => {
        const res = await self.pool.query('SELECT * FROM products WHERE id = $1', [id]);
        return res.rows[0] ? rowToProduct(res.rows[0]) : null;
      },

      create: async (data: Omit<Product, 'id' | 'inStock'>): Promise<Product> => {
        const res = await self.pool.query(
          `INSERT INTO products
            (sku, name, brand, category_id, price, original_price, unit, image_url, stock, rating, review_count, description, origin, is_organic, is_vegetarian, is_best_seller, vat_rate)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           RETURNING *`,
          [
            data.sku,
            data.name,
            data.brand,
            data.category,
            data.price,
            data.originalPrice ?? null,
            data.unit,
            data.image,
            data.stock,
            data.rating ?? 5.0,
            data.reviewCount ?? 0,
            data.description ?? '',
            data.origin ?? null,
            data.isOrganic ?? false,
            data.isVegetarian ?? false,
            data.isBestSeller ?? false,
            data.vatRate ?? 0,
          ]
        );
        return rowToProduct(res.rows[0]);
      },

      update: async (id: string, patch: Partial<Product>): Promise<Product | null> => {
        const fieldMap: Record<string, string> = {
          name: 'name',
          brand: 'brand',
          category: 'category_id',
          price: 'price',
          originalPrice: 'original_price',
          unit: 'unit',
          image: 'image_url',
          stock: 'stock',
          description: 'description',
          origin: 'origin',
          isOrganic: 'is_organic',
          isVegetarian: 'is_vegetarian',
          isBestSeller: 'is_best_seller',
          vatRate: 'vat_rate',
        };

        const sets: string[] = [];
        const values: any[] = [];

        for (const [key, col] of Object.entries(fieldMap)) {
          if (key in patch) {
            values.push((patch as any)[key]);
            sets.push(`${col} = $${values.length}`);
          }
        }

        if (!sets.length) return self.products.findById(id);

        values.push(id);
        const res = await self.pool.query(
          `UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
          values
        );
        return res.rows[0] ? rowToProduct(res.rows[0]) : null;
      },

      delete: async (id: string): Promise<boolean> => {
        const res = await self.pool.query(
          'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1',
          [id]
        );
        return (res.rowCount ?? 0) > 0;
      },
    };
  }

  // ── Users Repository ─────────────────────────────────────────────────────

  get users() {
    const self = this;
    return {
      findById: async (id: string): Promise<User | null> => {
        const res = await self.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return res.rows[0] ? rowToUser(res.rows[0]) : null;
      },

      findByEmail: async (email: string): Promise<User | null> => {
        const res = await self.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        return res.rows[0] ? rowToUser(res.rows[0]) : null;
      },

      create: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
        const res = await self.pool.query(
          `INSERT INTO users (name, email, password_hash, role, phone)
           VALUES ($1, LOWER($2), $3, $4, $5)
           RETURNING *`,
          [data.name, data.email, data.passwordHash, data.role ?? 'customer', data.phone || null]
        );
        return rowToUser(res.rows[0]);
      },
    };
  }

  // ── Orders Repository ────────────────────────────────────────────────────

  get orders() {
    const self = this;
    return {
      findAll: async (): Promise<Order[]> => {
        const res = await self.pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        const orders: Order[] = [];
        for (const row of res.rows) {
          const itemsRes = await self.pool.query('SELECT * FROM order_items WHERE order_id = $1', [row.id]);
          orders.push(rowToOrder(row, itemsRes.rows.map(rowToOrderItem)));
        }
        return orders;
      },

      findById: async (id: string): Promise<Order | null> => {
        const res = await self.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (!res.rows[0]) return null;
        const itemsRes = await self.pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        return rowToOrder(res.rows[0], itemsRes.rows.map(rowToOrderItem));
      },

      findByUserId: async (
        userId: string,
        options: { page?: number; limit?: number; status?: string } = {}
      ): Promise<{ orders: Order[]; total: number; page: number; limit: number }> => {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        const offset = (page - 1) * limit;

        const conditions: string[] = ['user_id = $1'];
        const params: any[] = [userId];

        if (options.status) {
          params.push(options.status);
          conditions.push(`status = $${params.length}`);
        }

        const whereClause = conditions.join(' AND ');

        const countRes = await self.pool.query(`SELECT COUNT(*) FROM orders WHERE ${whereClause}`, params);
        const total = parseInt(countRes.rows[0].count, 10);

        const res = await self.pool.query(
          `SELECT * FROM orders WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, limit, offset]
        );

        const orders: Order[] = [];
        for (const row of res.rows) {
          const itemsRes = await self.pool.query('SELECT * FROM order_items WHERE order_id = $1', [row.id]);
          orders.push(rowToOrder(row, itemsRes.rows.map(rowToOrderItem)));
        }

        return { orders, total, page, limit };
      },

      findByStripeIntentId: async (intentId: string): Promise<Order | null> => {
        const res = await self.pool.query('SELECT * FROM orders WHERE stripe_payment_intent_id = $1', [intentId]);
        if (!res.rows[0]) return null;
        const itemsRes = await self.pool.query('SELECT * FROM order_items WHERE order_id = $1', [res.rows[0].id]);
        return rowToOrder(res.rows[0], itemsRes.rows.map(rowToOrderItem));
      },

      create: async (data: {
        orderNumber: string;
        userId?: string;
        driverId?: string;
        promoCode?: string;
        status: Order['status'];
        items: OrderItem[];
        subtotal: number;
        vatAmount: number;
        deliveryFee: number;
        discount: number;
        total: number;
        address: DeliveryAddress;
        paymentMethod: Order['paymentMethod'];
        paymentStatus: Order['paymentStatus'];
        stripePaymentIntentId?: string;
        deliverySlot: string;
        estimatedDeliveryTime: string;
        driver?: Order['driver'];
      }): Promise<Order> => {
        let client: PoolClient | null = null;
        try {
          client = await self.pool.connect();
          await client.query('BEGIN');

          const orderRes = await client.query(
            `INSERT INTO orders
              (order_number, user_id, driver_id, promo_code, status,
               delivery_full_name, delivery_phone, delivery_email,
               delivery_street, delivery_locality, delivery_postal_code,
               delivery_lat, delivery_lng,
               subtotal, vat_amount, delivery_fee, discount, total,
               payment_method, payment_status, stripe_payment_intent_id,
               delivery_slot, estimated_delivery_time,
               driver_name, driver_phone, driver_vehicle, driver_plate,
               driver_lat, driver_lng)
             VALUES
              ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
             RETURNING *`,
            [
              data.orderNumber,
              data.userId ?? null,
              data.driverId ?? null,
              data.promoCode ?? null,
              data.status,
              data.address.fullName,
              data.address.phone,
              data.address.email,
              data.address.street,
              data.address.locality,
              data.address.postalCode,
              data.address.coordinates?.lat ?? null,
              data.address.coordinates?.lng ?? null,
              data.subtotal,
              data.vatAmount,
              data.deliveryFee,
              data.discount,
              data.total,
              data.paymentMethod,
              data.paymentStatus,
              data.stripePaymentIntentId ?? null,
              data.deliverySlot,
              data.estimatedDeliveryTime,
              data.driver?.name ?? null,
              data.driver?.phone ?? null,
              data.driver?.vehicle ?? null,
              data.driver?.plateNumber ?? null,
              data.driver?.currentLocation?.lat ?? null,
              data.driver?.currentLocation?.lng ?? null,
            ]
          );

          const orderId = orderRes.rows[0].id;

          for (const item of data.items) {
            await client.query(
              `INSERT INTO order_items
                (order_id, product_id, sku, name, brand, image_url, price, quantity, unit, vat_rate)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [
                orderId,
                item.productId || null,
                null,
                item.name,
                null,
                item.image,
                item.price,
                item.quantity,
                item.unit,
                item.vatRate ?? 0,
              ]
            );
          }

          await client.query('COMMIT');
          return rowToOrder(orderRes.rows[0], data.items);
        } catch (err) {
          if (client) await client.query('ROLLBACK').catch(() => {});
          throw err;
        } finally {
          client?.release();
        }
      },

      updateStatus: async (id: string, status: Order['status']): Promise<Order | null> => {
        const res = await self.pool.query(
          `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
          [status, id]
        );
        if (!res.rows[0]) return null;
        const itemsRes = await self.pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        return rowToOrder(res.rows[0], itemsRes.rows.map(rowToOrderItem));
      },

      updateDeliveryStatus: async (
        id: string,
        data: {
          status: Order['status'];
          deliveredAt?: string;
          dispatchedAt?: string;
          deliveryPhoto?: string;
          driverId?: string;
        }
      ): Promise<Order | null> => {
        const sets: string[] = ['status = $1', 'updated_at = NOW()'];
        const params: any[] = [data.status];

        if (data.deliveredAt) {
          params.push(data.deliveredAt);
          sets.push(`delivered_at = $${params.length}`);
        }
        if (data.dispatchedAt) {
          params.push(data.dispatchedAt);
          sets.push(`dispatched_at = $${params.length}`);
        }
        if (data.deliveryPhoto !== undefined) {
          params.push(data.deliveryPhoto);
          sets.push(`delivery_photo = $${params.length}`);
        }
        if (data.driverId) {
          params.push(data.driverId);
          sets.push(`driver_id = $${params.length}`);
        }

        params.push(id);
        const res = await self.pool.query(
          `UPDATE orders SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params
        );
        if (!res.rows[0]) return null;
        const itemsRes = await self.pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
        return rowToOrder(res.rows[0], itemsRes.rows.map(rowToOrderItem));
      },

      updatePaymentStatus: async (
        id: string,
        paymentStatus: Order['paymentStatus'],
        stripePaymentIntentId?: string
      ): Promise<void> => {
        await self.pool.query(
          `UPDATE orders SET payment_status = $1, stripe_payment_intent_id = COALESCE($2, stripe_payment_intent_id), updated_at = NOW() WHERE id = $3`,
          [paymentStatus, stripePaymentIntentId ?? null, id]
        );
      },

      saveRefund: async (id: string, stripeRefundId: string): Promise<void> => {
        await self.pool.query(
          `UPDATE orders
             SET payment_status = 'refunded',
                 stripe_refund_id = $1,
                 refunded_at = NOW(),
                 updated_at = NOW()
           WHERE id = $2`,
          [stripeRefundId, id]
        );
      },
    };
  }

  // ── Promos Repository ────────────────────────────────────────────────────

  get promos() {
    const self = this;
    return {
      findByCode: async (code: string): Promise<Promo | null> => {
        const res = await self.pool.query('SELECT * FROM promos WHERE UPPER(code) = UPPER($1)', [code]);
        return res.rows[0] ? rowToPromo(res.rows[0]) : null;
      },

      findAll: async (): Promise<Promo[]> => {
        const res = await self.pool.query('SELECT * FROM promos ORDER BY created_at DESC');
        return res.rows.map(rowToPromo);
      },

      create: async (data: Omit<Promo, 'id' | 'createdAt' | 'usageCount'>): Promise<Promo> => {
        const res = await self.pool.query(
          `INSERT INTO promos (code, discount_type, discount_value, min_cart_amount, max_uses, active, expires_at)
           VALUES (UPPER($1), $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            data.code,
            data.discountType,
            data.discountValue,
            data.minCartAmount || 0,
            data.maxUses ?? null,
            data.active ?? true,
            data.expiresAt ?? null,
          ]
        );
        return rowToPromo(res.rows[0]);
      },

      incrementUsage: async (code: string): Promise<void> => {
        await self.pool.query(
          'UPDATE promos SET usage_count = usage_count + 1 WHERE UPPER(code) = UPPER($1)',
          [code]
        );
      },
    };
  }

  // ── Drivers Repository ───────────────────────────────────────────────────

  get drivers() {
    const self = this;
    return {
      findAll: async (): Promise<Driver[]> => {
        const res = await self.pool.query('SELECT * FROM drivers ORDER BY name ASC');
        return res.rows.map((r: any) => rowToDriver(r, r.current_order_id ? 1 : 0));
      },

      findById: async (id: string): Promise<Driver | null> => {
        const res = await self.pool.query('SELECT * FROM drivers WHERE id = $1', [id]);
        return res.rows[0] ? rowToDriver(res.rows[0], res.rows[0].current_order_id ? 1 : 0) : null;
      },

      findByUserId: async (userId: string): Promise<Driver | null> => {
        const res = await self.pool.query('SELECT * FROM drivers WHERE user_id = $1', [userId]);
        return res.rows[0] ? rowToDriver(res.rows[0], res.rows[0].current_order_id ? 1 : 0) : null;
      },

      updateLocation: async (id: string, lat: number, lng: number): Promise<Driver | null> => {
        const res = await self.pool.query(
          `UPDATE drivers SET current_lat = $1, current_lng = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
          [lat, lng, id]
        );
        return res.rows[0] ? rowToDriver(res.rows[0]) : null;
      },

      updateStatus: async (
        id: string,
        status: Driver['status'],
        currentOrderId?: string | null
      ): Promise<Driver | null> => {
        const res = await self.pool.query(
          `UPDATE drivers SET status = $1, current_order_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
          [status, currentOrderId === undefined ? null : currentOrderId, id]
        );
        return res.rows[0] ? rowToDriver(res.rows[0]) : null;
      },
    };
  }
}

// ---------------------------------------------------------------------------
// In-Memory Fallback (used when NODE_ENV=test or DATABASE_URL not set)
// ---------------------------------------------------------------------------

class InMemoryDatabase {
  public products: Map<string, Product> = new Map();
  public users: Map<string, User> = new Map();
  public orders: Map<string, Order> = new Map();
  public promos: Map<string, Promo> = new Map();
  public drivers: Map<string, Driver> = new Map();
  private _connected: boolean = true;

  constructor() {
    this.seedInitialData();
  }

  async connectWithRetry(): Promise<void> {
    console.log('[DESI BOLT DB] 🧪 Using in-memory database (test/dev mode).');
  }

  async disconnect(): Promise<void> {}

  async runMigration(): Promise<void> {
    console.log('[DESI BOLT DB] 🧪 In-memory mode — skipping SQL migration.');
  }

  /** For db-connection.test.ts compatibility */
  setConnectionState(connected: boolean) {
    this._connected = connected;
  }

  async getHealth(): Promise<DatabaseHealth> {
    return {
      status: this._connected ? 'connected' : 'disconnected',
      database: 'desibolt_malta_pg',
      latencyMs: 1,
      poolSize: 1,
      activeConnections: 1,
    };
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this._connected) {
      throw new Error('Database connection failed: ECONNREFUSED');
    }
    return { rowCount: 1, rows: [] };
  }

  // ── Products Repo ────────────────────────────────────────────────────────

  get productsRepo() {
    const self = this;
    return {
      findAll: async (filters: {
        category?: string;
        search?: string;
        inStockOnly?: boolean;
        limit?: number;
        offset?: number;
      } = {}) => {
        let list = Array.from(self.products.values());
        if (filters.category && filters.category !== 'all') {
          list = list.filter((p) => p.category === filters.category);
        }
        if (filters.search) {
          const s = filters.search.toLowerCase();
          list = list.filter(
            (p) => p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s)
          );
        }
        if (filters.inStockOnly) {
          list = list.filter((p) => p.inStock);
        }
        const total = list.length;
        const offset = filters.offset ?? 0;
        const limit = filters.limit ?? 50;
        const products = list.slice(offset, offset + limit);
        return { products, total };
      },
      findById: async (id: string) => self.products.get(id) ?? null,
      create: async (data: Omit<Product, 'id' | 'inStock'>) => {
        const id = `prod_${Date.now()}`;
        const product: Product = { ...data, id, inStock: (data.stock ?? 0) > 0 };
        self.products.set(id, product);
        return product;
      },
      update: async (id: string, patch: Partial<Product>) => {
        const existing = self.products.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...patch, id };
        if (updated.stock !== undefined) updated.inStock = updated.stock > 0;
        self.products.set(id, updated);
        return updated;
      },
      delete: async (id: string) => {
        return self.products.delete(id);
      },
    };
  }

  // ── Users Repo ───────────────────────────────────────────────────────────

  get usersRepo() {
    const self = this;
    return {
      findById: async (id: string) => self.users.get(id) ?? null,
      findByEmail: async (email: string) =>
        Array.from(self.users.values()).find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        ) ?? null,
      create: async (data: Omit<User, 'id'>) => {
        const id = `usr_${Date.now()}`;
        const user: User = { ...data, id, email: data.email.toLowerCase() };
        self.users.set(id, user);
        return user;
      },
    };
  }

  // ── Orders Repo ──────────────────────────────────────────────────────────

  get ordersRepo() {
    const self = this;
    return {
      findAll: async () => Array.from(self.orders.values()),
      findById: async (id: string) => self.orders.get(id) ?? null,
      findByUserId: async (
        userId: string,
        options: { page?: number; limit?: number; status?: string } = {}
      ) => {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 20));
        let userOrders = Array.from(self.orders.values()).filter(
          (o) => o.userId === userId
        );
        if (options.status) {
          userOrders = userOrders.filter((o) => o.status === options.status);
        }
        userOrders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const total = userOrders.length;
        const paginated = userOrders.slice((page - 1) * limit, page * limit);
        return { orders: paginated, total, page, limit };
      },
      findByStripeIntentId: async (intentId: string) =>
        Array.from(self.orders.values()).find(
          (o) => o.stripePaymentIntentId === intentId
        ) ?? null,
      create: async (data: any) => {
        const id = `ord-${Date.now()}`;
        const order: Order = { ...data, id };
        self.orders.set(id, order);
        return order;
      },
      updateStatus: async (id: string, status: Order['status']) => {
        const order = self.orders.get(id);
        if (!order) return null;
        order.status = status;
        self.orders.set(id, order);
        return order;
      },
      updateDeliveryStatus: async (
        id: string,
        data: {
          status: Order['status'];
          deliveredAt?: string;
          dispatchedAt?: string;
          deliveryPhoto?: string;
          driverId?: string;
        }
      ) => {
        const order = self.orders.get(id);
        if (!order) return null;
        order.status = data.status;
        if (data.deliveredAt) order.deliveredAt = data.deliveredAt;
        if (data.dispatchedAt) order.dispatchedAt = data.dispatchedAt;
        if (data.deliveryPhoto !== undefined) order.deliveryPhoto = data.deliveryPhoto;
        if (data.driverId) order.driverId = data.driverId;
        self.orders.set(id, order);
        return order;
      },
      updatePaymentStatus: async (
        id: string,
        paymentStatus: Order['paymentStatus'],
        intentId?: string
      ) => {
        const order = self.orders.get(id);
        if (order) {
          order.paymentStatus = paymentStatus;
          if (intentId) order.stripePaymentIntentId = intentId;
          self.orders.set(id, order);
        }
      },
      saveRefund: async (id: string, stripeRefundId: string) => {
        const order = self.orders.get(id);
        if (order) {
          order.paymentStatus = 'refunded';
          (order as any).stripeRefundId = stripeRefundId;
          self.orders.set(id, order);
        }
      },
    };
  }

  // ── Promos Repo ──────────────────────────────────────────────────────────

  get promosRepo() {
    const self = this;
    return {
      findByCode: async (code: string): Promise<Promo | null> => {
        const upper = code.toUpperCase();
        return (
          Array.from(self.promos.values()).find(
            (p) => p.code.toUpperCase() === upper
          ) ?? null
        );
      },
      findAll: async () => Array.from(self.promos.values()),
      create: async (data: Omit<Promo, 'id' | 'createdAt' | 'usageCount'>) => {
        const id = `prm_${Date.now()}`;
        const promo: Promo = {
          ...data,
          id,
          code: data.code.toUpperCase(),
          usageCount: 0,
          active: data.active ?? true,
          minCartAmount: data.minCartAmount || 0,
          createdAt: new Date().toISOString(),
        };
        self.promos.set(id, promo);
        return promo;
      },
      incrementUsage: async (code: string) => {
        const promo = Array.from(self.promos.values()).find(
          (p) => p.code.toUpperCase() === code.toUpperCase()
        );
        if (promo) {
          promo.usageCount = (promo.usageCount || 0) + 1;
          self.promos.set(promo.id, promo);
        }
      },
    };
  }

  // ── Drivers Repo ─────────────────────────────────────────────────────────

  get driversRepo() {
    const self = this;
    return {
      findAll: async (): Promise<Driver[]> => {
        return Array.from(self.drivers.values()).map((d) => ({
          ...d,
          activeOrders: d.currentOrderId ? 1 : 0,
        }));
      },
      findById: async (id: string): Promise<Driver | null> => {
        const d = self.drivers.get(id);
        if (!d) return null;
        return { ...d, activeOrders: d.currentOrderId ? 1 : 0 };
      },
      findByUserId: async (userId: string): Promise<Driver | null> => {
        const d = Array.from(self.drivers.values()).find((drv) => drv.userId === userId);
        if (!d) return null;
        return { ...d, activeOrders: d.currentOrderId ? 1 : 0 };
      },
      create: async (data: Omit<Driver, 'id'>) => {
        const id = `drv_${Date.now()}`;
        const driver: Driver = { ...data, id };
        self.drivers.set(id, driver);
        return driver;
      },
      updateLocation: async (id: string, lat: number, lng: number): Promise<Driver | null> => {
        const driver = self.drivers.get(id);
        if (!driver) return null;
        driver.currentLocation = { lat, lng };
        driver.updatedAt = new Date().toISOString();
        self.drivers.set(id, driver);
        return driver;
      },
      updateStatus: async (
        id: string,
        status: Driver['status'],
        currentOrderId?: string | null
      ): Promise<Driver | null> => {
        const driver = self.drivers.get(id);
        if (!driver) return null;
        driver.status = status;
        if (currentOrderId !== undefined) driver.currentOrderId = currentOrderId;
        driver.updatedAt = new Date().toISOString();
        self.drivers.set(id, driver);
        return driver;
      },
    };
  }

  resetDatabase() {
    this.products.clear();
    this.users.clear();
    this.orders.clear();
    this.promos.clear();
    this.drivers.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const sampleProducts: Product[] = [
      {
        id: 'fp-01',
        name: 'Maltese Farm Fresh Tomatoes',
        brand: 'Malta Fresh Farms',
        category: 'fresh-produce',
        price: 1.85,
        originalPrice: 2.20,
        unit: '1 kg',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
        stock: 140,
        inStock: true,
        rating: 4.8,
        reviewCount: 94,
        description: 'Vine-ripened, locally grown juicy Maltese red tomatoes.',
        origin: 'Malta',
        isOrganic: true,
        isVegetarian: true,
        isBestSeller: true,
        vatRate: 0,
        sku: 'FP-TOM-MLT-01',
      },
      {
        id: 'dp-01',
        name: 'Amul Malai Fresh Paneer',
        brand: 'Amul',
        category: 'dairy-paneer',
        price: 3.49,
        originalPrice: 3.99,
        unit: '400 g',
        image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600',
        stock: 75,
        inStock: true,
        rating: 4.9,
        reviewCount: 154,
        description: 'Super soft, creamy cottage cheese made from 100% pure milk.',
        origin: 'India',
        isVegetarian: true,
        isBestSeller: true,
        vatRate: 0,
        sku: 'DP-AML-PAN-01',
      },
      {
        id: 'ar-01',
        name: 'Aashirvaad Superior Sharbati Atta',
        brand: 'Aashirvaad',
        category: 'rice-atta',
        price: 14.50,
        originalPrice: 16.50,
        unit: '10 kg Bag',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600',
        stock: 90,
        inStock: true,
        rating: 4.9,
        reviewCount: 310,
        description: 'Chakki-ground from Madhya Pradesh Sharbati wheat.',
        origin: 'India',
        isVegetarian: true,
        isBestSeller: true,
        vatRate: 0,
        sku: 'AR-ASH-ATT-10K',
      },
      {
        id: 'ss-01',
        name: "Haldiram's Aloo Bhujia",
        brand: 'Haldirams',
        category: 'snacks-sweets',
        price: 2.75,
        unit: '400 g',
        image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600',
        stock: 120,
        inStock: true,
        rating: 4.9,
        reviewCount: 410,
        description: 'Crispy spicy potato sev infused with mint & chillies.',
        origin: 'India',
        isVegetarian: true,
        isBestSeller: true,
        vatRate: 0.18,
        sku: 'SS-HLD-ALU-01',
      },
    ];
    sampleProducts.forEach((p) => this.products.set(p.id, p));

    const passwordHash = '$2a$10$7vN8K9QWp9e6qG2aYn4zLeO6mP8xK5wJ3kL2mQ1wE4rT7yU0iO.Pa';
    this.users.set('usr_customer_1', {
      id: 'usr_customer_1',
      name: 'Alex Camilleri',
      email: 'alex@example.com.mt',
      passwordHash,
      role: 'customer',
      phone: '+356 9912 3456',
      createdAt: '2026-01-10T10:00:00.000Z',
    });
    this.users.set('usr_admin_1', {
      id: 'usr_admin_1',
      name: 'DESI BOLT Operations Admin',
      email: 'admin@desibolt.com',
      passwordHash,
      role: 'admin',
      phone: '+356 2133 8899',
      createdAt: '2026-01-01T08:00:00.000Z',
    });
    this.users.set('usr_driver_1', {
      id: 'usr_driver_1',
      name: 'Josef Vella (Driver)',
      email: 'driver@desibolt.com',
      passwordHash,
      role: 'driver',
      phone: '+356 7944 8833',
      createdAt: '2026-01-01T08:00:00.000Z',
    });

    this.orders.set('ord-88329', {
      id: 'ord-88329',
      orderNumber: 'DB-MLT-88329',
      userId: 'usr_customer_1',
      driverId: 'drv-01',
      createdAt: new Date().toISOString(),
      status: 'out_for_delivery',
      items: [
        {
          productId: 'fp-01',
          name: 'Maltese Farm Fresh Tomatoes',
          price: 1.85,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
          unit: '1 kg',
          vatRate: 0,
        },
        {
          productId: 'dp-01',
          name: 'Amul Malai Fresh Paneer',
          price: 3.49,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600',
          unit: '400 g',
          vatRate: 0,
        },
      ],
      subtotal: 7.19,
      vatAmount: 0.0,
      deliveryFee: 2.50,
      discount: 0.0,
      total: 9.69,
      address: {
        fullName: 'Alex Camilleri',
        phone: '+356 9912 3456',
        email: 'alex@example.com.mt',
        street: '42, Tower Road, Apt 4B',
        locality: 'Sliema',
        postalCode: 'SLM 1604',
        coordinates: { lat: 35.9122, lng: 14.5042 },
      },
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      stripePaymentIntentId: 'pi_test_88329',
      deliverySlot: 'instant_bolt',
      estimatedDeliveryTime: '15 mins',
      driver: {
        id: 'drv-01',
        name: 'Josef Vella',
        phone: '+356 7944 8833',
        vehicle: 'DESI BOLT Eco-Scooter #14',
        plateNumber: 'BOLT-77-MT',
        currentLocation: { lat: 35.8978, lng: 14.4795 },
      },
    });

    // Seed initial Promos
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    this.promos.set('prm-01', {
      id: 'prm-01',
      code: 'WELCOME20',
      discountType: 'percent',
      discountValue: 20,
      minCartAmount: 15,
      maxUses: 100,
      usageCount: 0,
      active: true,
      expiresAt: expiryDate.toISOString(),
      createdAt: new Date().toISOString(),
    });

    this.promos.set('prm-02', {
      id: 'prm-02',
      code: 'SAVE5EUR',
      discountType: 'fixed',
      discountValue: 5,
      minCartAmount: 25,
      maxUses: 50,
      usageCount: 0,
      active: true,
      expiresAt: expiryDate.toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Seed initial Drivers
    this.drivers.set('drv-01', {
      id: 'drv-01',
      userId: 'usr_driver_1',
      name: 'Josef Vella',
      phone: '+356 7944 8833',
      vehicle: 'DESI BOLT Eco-Scooter #14',
      plateNumber: 'BOLT-77-MT',
      rating: 4.9,
      status: 'available',
      currentLocation: { lat: 35.8978, lng: 14.4795 },
      currentOrderId: null,
      activeOrders: 0,
    });

    this.drivers.set('drv-02', {
      id: 'drv-02',
      name: 'Marco Grech',
      phone: '+356 7988 2211',
      vehicle: 'Honda PCX 125',
      plateNumber: 'DB-892-MT',
      rating: 4.8,
      status: 'available',
      currentLocation: { lat: 35.9065, lng: 14.4920 },
      currentOrderId: null,
      activeOrders: 0,
    });

    this.drivers.set('drv-03', {
      id: 'drv-03',
      name: 'Kurt Borg',
      phone: '+356 7955 1144',
      vehicle: 'Yamaha NMAX 155',
      plateNumber: 'DB-341-MT',
      rating: 5.0,
      status: 'available',
      currentLocation: { lat: 35.9122, lng: 14.5042 },
      currentOrderId: null,
      activeOrders: 0,
    });
  }
}

// ---------------------------------------------------------------------------
// Unified DB facade — same interface regardless of backend
// ---------------------------------------------------------------------------

type DbBackend = PostgresDatabase | InMemoryDatabase;

function createDb(): DbBackend {
  if (USE_POSTGRES) {
    console.log('[DESI BOLT DB] 🐘 Initialising PostgreSQL pool…');
    return new PostgresDatabase();
  }
  return new InMemoryDatabase();
}

const _db = createDb();

export const db = new Proxy(_db as any, {
  get(target, prop) {
    if (prop === 'products' && target instanceof InMemoryDatabase) {
      const map = target.products;
      const repo = target.productsRepo;
      return new Proxy(map, {
        get(mapTarget, p) {
          if (p in repo) return (repo as any)[p];
          const val = (mapTarget as any)[p];
          return typeof val === 'function' ? val.bind(mapTarget) : val;
        },
      });
    }
    if (prop === 'users' && target instanceof InMemoryDatabase) {
      const map = target.users;
      const repo = target.usersRepo;
      return new Proxy(map, {
        get(mapTarget, p) {
          if (p in repo) return (repo as any)[p];
          const val = (mapTarget as any)[p];
          return typeof val === 'function' ? val.bind(mapTarget) : val;
        },
      });
    }
    if (prop === 'orders' && target instanceof InMemoryDatabase) {
      const map = target.orders;
      const repo = target.ordersRepo;
      return new Proxy(map, {
        get(mapTarget, p) {
          if (p in repo) return (repo as any)[p];
          const val = (mapTarget as any)[p];
          return typeof val === 'function' ? val.bind(mapTarget) : val;
        },
      });
    }
    if (prop === 'promos' && target instanceof InMemoryDatabase) {
      const map = target.promos;
      const repo = target.promosRepo;
      return new Proxy(map, {
        get(mapTarget, p) {
          if (p in repo) return (repo as any)[p];
          const val = (mapTarget as any)[p];
          return typeof val === 'function' ? val.bind(mapTarget) : val;
        },
      });
    }
    if (prop === 'drivers' && target instanceof InMemoryDatabase) {
      const map = target.drivers;
      const repo = target.driversRepo;
      return new Proxy(map, {
        get(mapTarget, p) {
          if (p in repo) return (repo as any)[p];
          const val = (mapTarget as any)[p];
          return typeof val === 'function' ? val.bind(mapTarget) : val;
        },
      });
    }
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  },
});
