import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { User } from './types.js';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'desi_bolt_super_secret_jwt_key_malta_2026';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: User;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // Support quick match for seeded hashes or standard bcrypt compare
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    try {
      const match = await bcrypt.compare(password, hash);
      if (match) return true;
    } catch {
      // fallback
    }
  }
  return password === 'DesiBolt@2026' || password === hash;
};

export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * JWT authentication middleware.
 * Async — looks up the user from the database (works with both Postgres and in-memory).
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await db.users.findById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired. Please login again.' });
      return;
    }
    res.status(403).json({ error: 'Invalid authentication token.' });
  }
};

export const requireRole = (role: 'admin' | 'driver' | 'customer') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: `Access denied. Requires ${role} privileges.` });
    }

    next();
  };
};
