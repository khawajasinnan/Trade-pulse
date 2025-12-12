import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    banned: true,
                    failedLoginCount: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count(),
        ]);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Prevent changing admin role
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'Admin' && role !== 'Admin') {
            return res.status(403).json({ error: 'Cannot change admin role' });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return res.json({
            message: 'User role updated successfully',
            user: updated,
        });
    } catch (error) {
        console.error('Update user role error:', error);
        return res.status(500).json({ error: 'Failed to update user role' });
    }
};

/**
 * Ban/unban user (Admin only)
 */
export const toggleUserBan = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { banned } = req.body;

        // Prevent banning admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'Admin') {
            return res.status(403).json({ error: 'Cannot ban admin user' });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { banned },
            select: {
                id: true,
                name: true,
                email: true,
                banned: true,
            },
        });

        return res.json({
            message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
            user: updated,
        });
    } catch (error) {
        console.error('Toggle user ban error:', error);
        return res.status(500).json({ error: 'Failed to update user status' });
    }
};

/**
 * Get failed login attempts (Admin only)
 */
export const getFailedLogins = async (req: AuthRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;

        const failedAttempts = await prisma.loginAttempt.findMany({
            where: { status: 'FAILED' },
            orderBy: { timestamp: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.json({ failedAttempts });
    } catch (error) {
        console.error('Get failed logins error:', error);
        res.status(500).json({ error: 'Failed to fetch login attempts' });
    }
};

/**
 * Get system statistics (Admin only)
 */
export const getSystemStats = async (_req: AuthRequest, res: Response) => {
    try {
        // Use Promise.allSettled to handle partial failures gracefully
        const results = await Promise.allSettled([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'BasicUser' } }),
            prisma.user.count({ where: { role: 'Trader' } }),
            prisma.user.count({ where: { role: 'Admin' } }),
            prisma.user.count({ where: { banned: true } }),
            prisma.loginAttempt.count(),
            prisma.loginAttempt.count({ where: { status: 'FAILED' } }),
            prisma.exchangeRate.count(),
            prisma.historicalData.count(),
            prisma.news.count(),
            prisma.prediction.count(),
            prisma.portfolio.count(),
            prisma.alert.count(),
        ]);

        // Extract values or use 0 as fallback
        const [
            totalUsers,
            basicUsers,
            traders,
            admins,
            bannedUsers,
            totalLoginAttempts,
            failedLoginAttempts,
            totalExchangeRates,
            totalHistoricalData,
            totalNews,
            totalPredictions,
            totalPortfolios,
            totalAlerts,
        ] = results.map((result: PromiseSettledResult<number>) =>
            result.status === 'fulfilled' ? result.value : 0
        );

        return res.json({
            users: {
                total: totalUsers,
                basic: basicUsers,
                traders: traders,
                admins: admins,
                banned: bannedUsers,
                active: totalUsers - bannedUsers,
            },
            activity: {
                totalLoginAttempts,
                failedLoginAttempts,
                successfulLogins: totalLoginAttempts - failedLoginAttempts,
            },
            data: {
                exchangeRates: totalExchangeRates,
                historicalDataPoints: totalHistoricalData,
                news: totalNews,
                predictions: totalPredictions,
            },
            features: {
                portfolios: totalPortfolios,
                alerts: totalAlerts,
            },
        });
    } catch (error) {
        console.error('Get system stats error:', error);
        return res.status(500).json({ error: 'Failed to fetch system stats' });
    }
};

/**
 * Get API health status (Admin only)
 */
export const getAPIHealth = async (_req: AuthRequest, res: Response) => {
    try {
        // Check database connection
        const dbHealthy = await prisma.$queryRaw`SELECT 1`;

        // Check recent data updates
        const latestRate = await prisma.exchangeRate.findFirst({
            orderBy: { timestamp: 'desc' },
        });

        const latestNews = await prisma.news.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        const latestPrediction = await prisma.prediction.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        res.json({
            database: {
                status: dbHealthy ? 'healthy' : 'unhealthy',
            },
            forexAPI: {
                status:
                    latestRate && now - latestRate.timestamp.getTime() < oneHour
                        ? 'healthy'
                        : 'stale',
                lastUpdate: latestRate?.timestamp,
            },
            newsAPI: {
                status:
                    latestNews && now - latestNews.createdAt.getTime() < oneHour
                        ? 'healthy'
                        : 'stale',
                lastUpdate: latestNews?.createdAt,
            },
            mlModel: {
                status:
                    latestPrediction && now - latestPrediction.createdAt.getTime() < 24 * oneHour
                        ? 'healthy'
                        : 'stale',
                lastUpdate: latestPrediction?.createdAt,
            },
        });
    } catch (error) {
        console.error('API health check error:', error);
        res.status(500).json({ error: 'Failed to check API health' });
    }
};
