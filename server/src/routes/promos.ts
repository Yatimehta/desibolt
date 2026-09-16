/**
 * DESI BOLT — Promo Codes Router
 * Mounted at: /api/promos
 *
 * Routes:
 *   POST /validate   — Validate promo code against cart subtotal and calculate discount
 *   GET /            — List all active promo codes (Admin)
 *   POST /           — Create a new promo code (Admin)
 */
import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';

export function createPromosRouter(): Router {
  const router = Router();

  /**
   * POST /api/promos/validate
   * Body: { code: string, cartSubtotal: number, userId?: string }
   */
  router.post('/validate', async (req: Request, res: Response) => {
    const { code, cartSubtotal } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        valid: false,
        message: 'Promo code is required.',
        code: 'missing_code',
      });
    }

    const subtotal = parseFloat(cartSubtotal);
    if (isNaN(subtotal) || subtotal < 0) {
      return res.status(400).json({
        valid: false,
        message: 'A valid cart subtotal is required.',
        code: 'invalid_subtotal',
      });
    }

    try {
      const promo = await db.promos.findByCode(code.trim());

      if (!promo) {
        return res.status(404).json({
          valid: false,
          message: 'Invalid promo code.',
          code: 'promo_not_found',
        });
      }

      // 1. Check if active
      if (!promo.active) {
        return res.status(400).json({
          valid: false,
          message: 'This promo code is inactive.',
          code: 'promo_inactive',
        });
      }

      // 2. Check expiration date
      if (promo.expiresAt) {
        const expiry = new Date(promo.expiresAt).getTime();
        if (Date.now() > expiry) {
          return res.status(400).json({
            valid: false,
            message: 'Code expired',
            code: 'promo_expired',
          });
        }
      }

      // 3. Check minimum cart amount
      if (subtotal < promo.minCartAmount) {
        return res.status(400).json({
          valid: false,
          message: `Min €${promo.minCartAmount.toFixed(2)} required to apply this code.`,
          minCartAmount: promo.minCartAmount,
          code: 'min_amount_not_met',
        });
      }

      // 4. Check max uses limit
      if (promo.maxUses != null && promo.usageCount >= promo.maxUses) {
        return res.status(400).json({
          valid: false,
          message: 'Promo code usage limit has been reached.',
          code: 'max_uses_reached',
        });
      }

      // 5. Calculate discount amount
      let discountAmount = 0;
      if (promo.discountType === 'percent') {
        discountAmount = (subtotal * promo.discountValue) / 100;
      } else {
        // fixed amount in EUR
        discountAmount = promo.discountValue;
      }

      // Cap discount so total cannot be negative
      discountAmount = Math.min(discountAmount, subtotal);
      discountAmount = Number(discountAmount.toFixed(2));
      const finalTotal = Number(Math.max(0, subtotal - discountAmount).toFixed(2));

      return res.json({
        valid: true,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount,
        finalTotal,
        message:
          promo.discountType === 'percent'
            ? `${promo.discountValue}% discount applied successfully!`
            : `€${promo.discountValue.toFixed(2)} discount applied successfully!`,
      });
    } catch (err: any) {
      console.error('[DESI BOLT Promos] Validation error:', err.message);
      return res.status(500).json({
        valid: false,
        message: 'Internal server error validating promo code.',
        code: 'server_error',
      });
    }
  });

  /**
   * GET /api/promos
   * List all promo codes (Admin only)
   */
  router.get('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
    try {
      const promos = await db.promos.findAll();
      return res.json({ promos, total: promos.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/promos
   * Create a new promo code (Admin only)
   */
  router.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
    const { code, discountType, discountValue, minCartAmount = 0, maxUses, expiresAt } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        error: 'Code, discountType (fixed|percent), and discountValue are required.',
      });
    }

    if (!['fixed', 'percent'].includes(discountType)) {
      return res.status(400).json({
        error: "discountType must be either 'fixed' or 'percent'.",
      });
    }

    try {
      const existing = await db.promos.findByCode(code);
      if (existing) {
        return res.status(409).json({ error: `Promo code '${code}' already exists.` });
      }

      const promo = await db.promos.create({
        code,
        discountType,
        discountValue: parseFloat(discountValue),
        minCartAmount: parseFloat(minCartAmount || 0),
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
        active: true,
        expiresAt,
      });

      return res.status(201).json(promo);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}
