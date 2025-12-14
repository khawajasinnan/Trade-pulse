import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import routes from '../../routes/index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Mock Prisma
jest.mock('@prisma/client');
jest.mock('bcrypt');

describe('Authentication Integration Tests', () => {
    let app: Express;
    let mockPrisma: any;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use('/api', routes);

        mockPrisma = {
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            loginAttempt: {
                create: jest.fn(),
                count: jest.fn(),
                findMany: jest.fn(),
            },
        };

        (PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);
    });

    describe('POST /api/auth/signup', () => {
        it('should complete full signup flow', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: 'new-user-id',
                name: 'New User',
                email: 'newuser@example.com',
                role: 'BasicUser',
                banned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'New User',
                    email: 'newuser@example.com',
                    password: 'Password@123',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Signup successful');
            expect(response.body).toHaveProperty('user');
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'existing-id',
                email: 'existing@example.com',
            });

            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    name: 'Test User',
                    email: 'existing@example.com',
                    password: 'Password@123',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Email already in use');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should complete full login flow with valid credentials', async () => {
            const mockUser = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                passwordHash: 'hashedPassword',
                role: 'BasicUser',
                banned: false,
                failedLoginCount: 0,
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.loginAttempt.count.mockResolvedValue(0);
            mockPrisma.user.update.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password@123',
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('user');
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should track failed login attempts', async () => {
            const mockUser = {
                id: 'user-id',
                email: 'test@example.com',
                passwordHash: 'hashedPassword',
                failedLoginCount: 0,
                banned: false,
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.loginAttempt.count.mockResolvedValue(0);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword',
                });

            expect(response.status).toBe(401);
            expect(mockPrisma.loginAttempt.create).toHaveBeenCalled();
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            // First login to get a token
            const mockUser = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                passwordHash: 'hashedPassword',
                role: 'BasicUser',
                banned: false,
                failedLoginCount: 0,
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.loginAttempt.count.mockResolvedValue(0);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password@123',
                });

            const cookies = loginResponse.headers['set-cookie'];

            // Logout with the token
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', cookies);

            expect(logoutResponse.status).toBe(200);
            expect(logoutResponse.body).toHaveProperty('message', 'Logged out successfully');
        });
    });
});
