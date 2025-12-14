import { Request, Response } from 'express';
import * as authController from '../../controllers/auth.controller';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { mockRequest, mockResponse, mockAuthRequest, createMockUser } from '../helpers';
import { prismaMock } from '../setupTests';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('signup', () => {
        it('should create a new user successfully', async () => {
            const req = mockRequest({
                body: {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password@123',
                    role: 'BasicUser',
                },
            }) as Request;

            const res = mockResponse() as Response;

            const mockUser = createMockUser({
                email: 'test@example.com',
                name: 'Test User',
            });

            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue(mockUser as any);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

            await authController.signup(req, res);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(bcrypt.hash).toHaveBeenCalledWith('Password@123', 12);
            expect(prismaMock.user.create).toHaveBeenCalled();
            expect(res.cookie).toHaveBeenCalledWith('token', 'mock-jwt-token', expect.any(Object));
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should reject signup with existing email', async () => {
            const req = mockRequest({
                body: {
                    name: 'Test User',
                    email: 'existing@example.com',
                    password: 'Password@123',
                },
            }) as Request;

            const res = mockResponse() as Response;

            prismaMock.user.findUnique.mockResolvedValue(createMockUser() as any);

            await authController.signup(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
        });

        it('should reject admin signup from non-admin email', async () => {
            const req = mockRequest({
                body: {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password@123',
                    role: 'Admin',
                },
            }) as Request;

            const res = mockResponse() as Response;

            await authController.signup(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Admin accounts cannot be created through signup'
            });
        });

        it('should handle database errors gracefully', async () => {
            const req = mockRequest({
                body: {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password@123',
                },
            }) as Request;

            const res = mockResponse() as Response;

            prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

            await authController.signup(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create account' });
        });
    });

    describe('login', () => {
        it('should login successfully with correct credentials', async () => {
            const req = mockRequest({
                body: {
                    email: 'test@example.com',
                    password: 'Password@123',
                },
                ip: '127.0.0.1',
                headers: {
                    'user-agent': 'test-agent',
                },
            }) as Request;

            const res = mockResponse() as Response;

            const mockUser = createMockUser({
                email: 'test@example.com',
                passwordHash: 'hashedPassword',
                failedLoginCount: 0,
                banned: false,
            });

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.user.update.mockResolvedValue(mockUser as any);
            prismaMock.loginAttempt.create.mockResolvedValue({} as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

            await authController.login(req, res);

            expect(bcrypt.compare).toHaveBeenCalledWith('Password@123', 'hashedPassword');
            expect(res.cookie).toHaveBeenCalledWith('token', 'mock-jwt-token', expect.any(Object));
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login successful',
                user: expect.objectContaining({
                    id: mockUser.id,
                    email: mockUser.email,
                }),
                token: 'mock-jwt-token',
            });
        });

        it('should reject login for non-existent user', async () => {
            const req = mockRequest({
                body: {
                    email: 'nonexistent@example.com',
                    password: 'Password@123',
                },
                ip: '127.0.0.1',
            }) as Request;

            const res = mockResponse() as Response;

            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.loginAttempt.create.mockResolvedValue({} as any);

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
        });

        it('should reject login for banned user', async () => {
            const req = mockRequest({
                body: {
                    email: 'banned@example.com',
                    password: 'Password@123',
                },
                ip: '127.0.0.1',
            }) as Request;

            const res = mockResponse() as Response;

            const mockUser = createMockUser({ banned: true });
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.loginAttempt.create.mockResolvedValue({} as any);

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Account has been banned'
            });
        });

        it('should reject login with incorrect password', async () => {
            const req = mockRequest({
                body: {
                    email: 'test@example.com',
                    password: 'WrongPassword',
                },
                ip: '127.0.0.1',
            }) as Request;

            const res = mockResponse() as Response;

            const mockUser = createMockUser();
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.user.update.mockResolvedValue(mockUser as any);
            prismaMock.loginAttempt.create.mockResolvedValue({} as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
        });
    });

    describe('logout', () => {
        it('should logout successfully', async () => {
            const req = mockAuthRequest('test-user-id', 'BasicUser') as any;
            const res = mockResponse() as Response;

            await authController.logout(req, res);

            expect(res.clearCookie).toHaveBeenCalledWith('token');
            expect(res.json).toHaveBeenCalledWith({ message: 'Logout successful' });
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user data', async () => {
            const mockUser = createMockUser();
            const req = mockAuthRequest(mockUser.id, 'BasicUser') as any;
            const res = mockResponse() as Response;

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

            await authController.getCurrentUser(req, res);

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                select: expect.any(Object),
            });
            expect(res.json).toHaveBeenCalledWith({
                user: expect.objectContaining({
                    id: mockUser.id,
                    email: mockUser.email,
                }),
            });
        });

        it('should handle user not found', async () => {
            const req = mockAuthRequest('nonexistent-id', 'BasicUser') as any;
            const res = mockResponse() as Response;

            prismaMock.user.findUnique.mockResolvedValue(null);

            await authController.getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const mockUser = createMockUser();
            const req = mockAuthRequest(mockUser.id, 'BasicUser', {
                body: {
                    currentPassword: 'OldPassword@123',
                    newPassword: 'NewPassword@123',
                },
            }) as any;
            const res = mockResponse() as Response;

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.user.update.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

            await authController.changePassword(req, res);

            expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword@123', mockUser.passwordHash);
            expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword@123', 12);
            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { passwordHash: 'newHashedPassword' },
            });
            expect(res.json).toHaveBeenCalledWith({ message: 'Password changed successfully' });
        });

        it('should reject with incorrect current password', async () => {
            const mockUser = createMockUser();
            const req = mockAuthRequest(mockUser.id, 'BasicUser', {
                body: {
                    currentPassword: 'WrongPassword',
                    newPassword: 'NewPassword@123',
                },
            }) as any;
            const res = mockResponse() as Response;

            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await authController.changePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Current password is incorrect' });
        });
    });
});
