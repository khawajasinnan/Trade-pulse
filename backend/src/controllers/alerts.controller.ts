import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isDbBlocked } from '../utils/db-utils';
import { sendMail } from '../services/mail.service';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * Get user alerts
 */
export const getAlerts = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const alerts = await prisma.alert.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        const active = alerts.filter((a) => !a.triggered);
        const triggered = alerts.filter((a) => a.triggered);

        return res.json({
            alerts,
            active,
            triggered,
            counts: {
                total: alerts.length,
                active: active.length,
                triggered: triggered.length,
            },
        });
    } catch (error) {
        console.error('Get alerts error:', error);
        return res.status(500).json({ error: 'Failed to fetch alerts' });
    }
};

/**
 * Create alert
 */
export const createAlert = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { currencyPair, conditionType, targetValue } = req.body;

        // Email verification requirement removed — user may create alerts immediately

        // BasicUser role limitation: max 2 active alerts
        if (req.user.role === 'BasicUser') {
            const activeAlertsCount = await prisma.alert.count({
                where: {
                    userId: req.user.id,
                    triggered: false,
                },
            });

            if (activeAlertsCount >= 2) {
                return res.status(403).json({
                    error: 'BasicUser limited to 2 active alerts',
                    message: 'Upgrade to Trader for unlimited alerts',
                    upgradeRequired: true,
                });
            }
        }

        if (isDbBlocked()) {
            console.warn('Skipping alert creation because DB writes are currently blocked');
            return res.status(503).json({ error: 'Service temporarily unavailable - try again later' });
        }

        const alert = await prisma.alert.create({
            data: {
                userId: req.user.id,
                currencyPair,
                conditionType,
                targetValue,
            },
        });

        // Send confirmation email for alert creation
        try {
            await sendMail(req.user.email, `Alert created: ${alert.currencyPair}`, `<p>Your alert for ${alert.currencyPair} has been created. Condition: ${conditionType} ${targetValue}</p>`);
        } catch (emailErr) {
            console.warn('Failed to send alert creation email:', emailErr);
        }

        return res.status(201).json({
            message: 'Alert created successfully',
            alert,
        });
    } catch (error) {
        console.error('Create alert error:', error);
        return res.status(500).json({ error: 'Failed to create alert' });
    }
};

/**
 * Delete alert
 */
export const deleteAlert = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;

        // Verify ownership
        const alert = await prisma.alert.findFirst({
            where: {
                id,
                userId: req.user.id,
            },
        });

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        if (isDbBlocked()) {
            console.warn('Delete alert blocked - DB writes are currently blocked');
            return res.status(503).json({ error: 'Service temporarily unavailable - try again later' });
        }

        await prisma.alert.delete({
            where: { id },
        });

        return res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error('Delete alert error:', error);
        return res.status(500).json({ error: 'Failed to delete alert' });
    }
};
