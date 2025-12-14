import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireTrader, requireAdmin, AuthRequest } from '../../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { mockRequest, mockResponse, createMockUser } from '../helpers';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('@prisma/client');

describe('Auth Middleware', () => {
    let mockPrisma: any;
    let mockNext: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNext = jest.fn();

        mockPrisma = {
            user: {
                findUnique: jest.fn(),
            },
        };

        (PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);
    });

    describe('requireAuth', () => {
        it('should authenticate valid JWT token from cookie', async () => {
            const req = mockRequest({
                cookies: {
                    token: 'valid-jwt-token',
                },
            }) as Request;
            const res = mockResponse() as Response;

            const mockUser = createMockUser();
            const decodedToken = {
                userId: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
            };

            (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            await requireAuth(req as AuthRequest, res, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', process.env.JWT_SECRET);
            expect((req as AuthRequest).user?.id).toBe(mockUser.id);
            expect((req as AuthRequest).user?.role).toBe(mockUser.role);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should authenticate valid JWT token from authorization header', async () => {
            const req = mockRequest({
                headers: {
                    authorization: 'Bearer valid-jwt-token',
                },
            }) as Request;
            const res = mockResponse() as Response;

            const mockUser = createMockUser();
            const decodedToken = {
                userId: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
            };

            (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            await requireAuth(req as AuthRequest, res, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', process.env.JWT_SECRET);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should reject request without token', async () => {
            const req = mockRequest({
                cookies: {},
                headers: {},
            }) as Request;
            const res = mockResponse() as Response;

            await requireAuth(req as AuthRequest, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject invalid JWT token', async () => {
            const req = mockRequest({
                cookies: {
                    token: 'invalid-token',
                },
            }) as Request;
            const res = mockResponse() as Response;

            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await requireAuth(req as AuthRequest, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject banned user', async () => {
            const req = mockRequest({
                cookies: {
                    token: 'valid-jwt-token',
                },
            }) as Request;
            const res = mockResponse() as Response;

            const bannedUser = createMockUser({ banned: true });
            const decodedToken = {
                userId: bannedUser.id,
                email: bannedUser.email,
                role: bannedUser.role,
            };

            (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
            mockPrisma.user.findUnique.mockResolvedValue(bannedUser);

            await requireAuth(req as AuthRequest, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject non-existent user', async () => {
            const req = mockRequest({
                cookies: {
                    token: 'valid-jwt-token',
                },
            }) as Request;
            const res = mockResponse() as Response;

            const decodedToken = {
                userId: 'nonexistent-id',
                email: 'test@example.com',
                role: 'BasicUser',
            };

            (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
            mockPrisma.user.findUnique.mockResolvedValue(null);

            await requireAuth(req as AuthRequest, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireTrader', () => {
        it('should allow Trader role', () => {
            const req = {
                ...mockRequest(),
                user: { id: 'test-id', email: 'trader@example.com', role: 'Trader' },
            } as AuthRequest;
            const res = mockResponse() as Response;

            requireTrader(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow Admin role', () => {
            const req = {
                ...mockRequest(),
                user: { id: 'test-id', email: 'admin@example.com', role: 'Admin' },
            } as AuthRequest;
            const res = mockResponse() as Response;

            requireTrader(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject BasicUser role', () => {
            const req = {
                ...mockRequest(),
                user: { id: 'test-id', email: 'user@example.com', role: 'BasicUser' },
            } as AuthRequest;
            const res = mockResponse() as Response;

            requireTrader(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Trader access required' });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireAdmin', () => {
        it('should allow Admin role', () => {
            const req = {
                ...mockRequest(),
                user: { id: 'test-id', email: 'admin@example.com', role: 'Admin' },
            } as AuthRequest;
            const res = mockResponse() as Response;

            requireAdmin(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject Trader role', () => {
            const req = {
                ...mockRequest(),
                user: { id: 'test-id', email: 'trader@example.com', role: 'Trader' },
            } as AuthRequest;
            const res = mockResponse() as Response;

            requireAdmin(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject BasicUser role', () => {
            const req = {
                ...mockRequest(),
                user: { id: 'test-id', email: 'user@example.com', role: 'BasicUser' },
            } as AuthRequest;
            const res = mockResponse() as Response;

            requireAdmin(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
