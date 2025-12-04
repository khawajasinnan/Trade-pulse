import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login attempts
 * Max 5 attempts per minute per IP
 */
export const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.LOGIN_RATE_LIMIT || '5'),
    message: {
        error: 'Too many login attempts. Please try again after 1 minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

/**
 * Rate limiter for signup attempts
 * Max 3 attempts per minute per IP
 */
export const signupRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.SIGNUP_RATE_LIMIT || '3'),
    message: {
        error: 'Too many signup attempts. Please try again after 1 minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * General API rate limiter
 * Max 100 requests per minute per IP
 */
export const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.API_RATE_LIMIT || '100'),
    message: {
        error: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

/**
 * Strict rate limiter for sensitive operations
 * Max 10 requests per minute
 */
export const strictRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        error: 'Rate limit exceeded for this operation.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
