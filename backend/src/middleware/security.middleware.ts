import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

/**
 * Helmet security headers configuration
 */
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
});

/**
 * CORS configuration
 */
export const corsConfig = cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
});

/**
 * Input sanitization middleware
 * Prevents XSS by escaping HTML characters
 */
export const sanitizeInput = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    // Sanitize body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query params
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    // Sanitize params
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }

    next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    if (obj !== null && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }

    return obj;
}

/**
 * Sanitize string by escaping HTML characters
 */
function sanitizeString(str: string): string {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * CSRF token generation and validation
 */
export const csrfProtection = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // In production, implement proper CSRF token validation
    // For now, we rely on SameSite cookie attribute
    next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
};
