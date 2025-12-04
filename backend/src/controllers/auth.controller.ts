import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tradepulse.com';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * User signup
 */
export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role = 'BasicUser' } = req.body;

        // Prevent admin signup
        if (role === 'Admin' || email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            return res.status(403).json({
                error: 'Admin accounts cannot be created through signup',
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                passwordHash,
                role: role as 'BasicUser' | 'Trader',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
        );

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(201).json({
            message: 'Account created successfully',
            user,
            token,
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Failed to create account' });
    }
};

/**
 * User login
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Generic error message for security
        const invalidCredentials = 'Invalid email or password';

        if (!user) {
            // Log failed attempt even if user doesn't exist
            await prisma.loginAttempt.create({
                data: {
                    email: email.toLowerCase(),
                    ipAddress,
                    userAgent,
                    status: 'FAILED',
                },
            });

            return res.status(401).json({ error: invalidCredentials });
        }

        // Check if account is banned
        if (user.banned) {
            await prisma.loginAttempt.create({
                data: {
                    userId: user.id,
                    email: user.email,
                    ipAddress,
                    userAgent,
                    status: 'FAILED',
                },
            });

            return res.status(403).json({ error: 'Account has been banned' });
        }

        // Check if account is locked due to failed attempts
        if (user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
            const lastFailedAttempt = await prisma.loginAttempt.findFirst({
                where: {
                    userId: user.id,
                    status: 'FAILED',
                },
                orderBy: { timestamp: 'desc' },
            });

            if (lastFailedAttempt) {
                const timeSinceLastAttempt = Date.now() - lastFailedAttempt.timestamp.getTime();
                if (timeSinceLastAttempt < LOCK_TIME) {
                    const remainingTime = Math.ceil((LOCK_TIME - timeSinceLastAttempt) / 60000);
                    return res.status(429).json({
                        error: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
                    });
                } else {
                    // Reset failed login count after lock time
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { failedLoginCount: 0 },
                    });
                }
            }
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            // Increment failed login count
            await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginCount: { increment: 1 } },
            });

            // Log failed attempt
            await prisma.loginAttempt.create({
                data: {
                    userId: user.id,
                    email: user.email,
                    ipAddress,
                    userAgent,
                    status: 'FAILED',
                },
            });

            return res.status(401).json({ error: invalidCredentials });
        }

        // Successful login - reset failed count
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginCount: 0,
                lastLoginAt: new Date(),
            },
        });

        // Log successful attempt
        await prisma.loginAttempt.create({
            data: {
                userId: user.id,
                email: user.email,
                ipAddress,
                userAgent,
                status: 'SUCCESS',
            },
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
        );

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * User logout
 */
export const logout = async (_req: AuthRequest, res: Response) => {
    try {
        // Clear cookie
        res.clearCookie('token');

        return res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Logout failed' });
    }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ error: 'Failed to get user' });
    }
};

/**
 * Change password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newPasswordHash },
        });

        return res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ error: 'Failed to change password' });
    }
};
