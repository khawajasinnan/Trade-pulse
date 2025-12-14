import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Mock Express Request
 */
export const mockRequest = (overrides?: Partial<Request>): Partial<Request> => {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        cookies: {},
        ip: '127.0.0.1',
        socket: {
            remoteAddress: '127.0.0.1',
        } as any,
        ...overrides,
    };
};

/**
 * Mock Express Response
 */
export const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
    };
    return res;
};

/**
 * Mock Authenticated Request
 */
export const mockAuthRequest = (
    userId: string,
    role: string,
    overrides?: Partial<AuthRequest>
): Partial<AuthRequest> => {
    return {
        ...mockRequest(),
        user: {
            id: userId,
            email: `${userId}@example.com`,
            role: role,
        },
        ...overrides,
    };
};

/**
 * Create mock user data
 */
export const createMockUser = (overrides?: any) => {
    return {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: '$2b$12$testHashedPassword',
        role: 'BasicUser',
        banned: false,
        failedLoginCount: 0,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
};

/**
 * Create mock portfolio item
 */
export const createMockPortfolio = (overrides?: any) => {
    return {
        id: 'test-portfolio-id',
        userId: 'test-user-id',
        currency: 'USD',
        amount: 1000,
        purchasePrice: 1.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
};

/**
 * Create mock alert
 */
export const createMockAlert = (overrides?: any) => {
    return {
        id: 'test-alert-id',
        userId: 'test-user-id',
        currencyPair: 'EUR-USD',
        conditionType: 'GREATER_THAN',
        targetValue: 1.2,
        triggered: false,
        triggeredAt: null,
        createdAt: new Date(),
        ...overrides,
    };
};

/**
 * Create mock historical data
 */
export const createMockHistoricalData = (overrides?: any) => {
    return {
        id: 'test-data-id',
        currencyPair: 'EUR-USD',
        open: 1.1,
        close: 1.12,
        high: 1.13,
        low: 1.09,
        volume: 1000000,
        date: new Date(),
        ...overrides,
    };
};
