import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const requireAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
            email: string;
            role: string;
        };

        // Check if user exists and is not banned
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, banned: true },
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.banned) {
            return res.status(403).json({ error: 'Account has been banned' });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Middleware to require Trader or Admin role
 */
export const requireTrader = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'Trader' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Trader access required' });
    }

    return next();
};

/**
 * Middleware to require Admin role
 */
export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    return next();
};

/**
 * Optional auth - attaches user if token exists but doesn't fail if missing
 */
export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
                userId: string;
                email: string;
                role: string;
            };

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, role: true, banned: true },
            });

            if (user && !user.banned) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                };
            }
        }
    } catch (error) {
        // Silently fail for optional auth
    }

    return next();
};
