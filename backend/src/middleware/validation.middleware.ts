import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation schemas using Zod
 */

// Auth schemas
export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain uppercase, lowercase, number, and special character'
        ),
    role: z.enum(['BasicUser', 'Trader']).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    token: z.string(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain uppercase, lowercase, number, and special character'
        ),
});

// Portfolio schemas
export const addPortfolioSchema = z.object({
    currency: z.string().min(3).max(10), // Allow currency pairs like EUR/USD
    amount: z.coerce.number().positive('Amount must be positive'), // Coerce string to number
    purchasePrice: z.coerce.number().positive('Purchase price must be positive'), // Coerce string to number
});

export const updatePortfolioSchema = z.object({
    amount: z.number().positive('Amount must be positive').optional(),
});

// Alert schemas
export const createAlertSchema = z.object({
    currencyPair: z.string().regex(/^[A-Z]{3}\/[A-Z]{3}$/, 'Invalid currency pair format (e.g., USD/EUR)'),
    conditionType: z.enum(['GREATER_THAN', 'LESS_THAN', 'GREATER_EQUAL', 'LESS_EQUAL']),
    targetValue: z.number().positive('Target value must be positive'),
});

// Converter schema
export const convertCurrencySchema = z.object({
    from: z.string().min(3).max(3),
    to: z.string().min(3).max(3),
    amount: z.number().positive('Amount must be positive'),
});

// Historical data schema
export const historicalDataSchema = z.object({
    currencyPair: z.string().regex(/^[A-Z]{3}\/[A-Z]{3}$/),
    period: z.enum(['24h', '1w', '6m', '1y']),
});

// Admin schemas
export const updateUserRoleSchema = z.object({
    role: z.enum(['BasicUser', 'Trader', 'Admin']),
});

export const banUserSchema = z.object({
    banned: z.boolean(),
});

/**
 * Validation middleware factory
 */
export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            return next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            return next(error);
        }
    };
};

/**
 * Query parameter validation
 */
export const validateQuery = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.query);
            return next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Invalid query parameters',
                    details: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            return next(error);
        }
    };
};

/**
 * Params validation
 */
export const validateParams = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params);
            return next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Invalid parameters',
                    details: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            return next(error);
        }
    };
};
