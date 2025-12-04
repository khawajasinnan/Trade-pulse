import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { getRealTimeRate } from '../services/forex.service';

const prisma = new PrismaClient();

/**
 * Get user portfolio
 */
export const getPortfolio = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const portfolio = await prisma.portfolio.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate current values and profit/loss
        const enrichedPortfolio = await Promise.all(
            portfolio.map(async (holding) => {
                try {
                    const currentRate = await getRealTimeRate('USD', holding.currency);
                    const currentValue = holding.amount * currentRate;
                    const purchaseValue = holding.amount * holding.purchasePrice;
                    const profitLoss = currentValue - purchaseValue;
                    const profitLossPercent = (profitLoss / purchaseValue) * 100;

                    return {
                        ...holding,
                        currentRate,
                        currentValue,
                        purchaseValue,
                        profitLoss,
                        profitLossPercent,
                    };
                } catch (error) {
                    return {
                        ...holding,
                        currentRate: holding.purchasePrice,
                        currentValue: holding.amount * holding.purchasePrice,
                        purchaseValue: holding.amount * holding.purchasePrice,
                        profitLoss: 0,
                        profitLossPercent: 0,
                    };
                }
            })
        );

        // Calculate totals
        const totalCurrentValue = enrichedPortfolio.reduce(
            (sum, h) => sum + h.currentValue,
            0
        );
        const totalPurchaseValue = enrichedPortfolio.reduce(
            (sum, h) => sum + h.purchaseValue,
            0
        );
        const totalProfitLoss = totalCurrentValue - totalPurchaseValue;
        const totalProfitLossPercent =
            totalPurchaseValue > 0 ? (totalProfitLoss / totalPurchaseValue) * 100 : 0;

        return res.json({
            portfolio: enrichedPortfolio,
            summary: {
                totalCurrentValue,
                totalPurchaseValue,
                totalProfitLoss,
                totalProfitLossPercent,
                holdings: enrichedPortfolio.length,
            },
        });
    } catch (error) {
        console.error('Get portfolio error:', error);
        return res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
};

/**
 * Add currency to portfolio
 */
export const addToPortfolio = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { currency, amount, purchasePrice } = req.body;

        // Verify currency exists
        const currencyExists = await prisma.currency.findUnique({
            where: { symbol: currency },
        });

        if (!currencyExists) {
            return res.status(404).json({ error: 'Currency not found' });
        }

        // Add to portfolio
        const holding = await prisma.portfolio.create({
            data: {
                userId: req.user.id,
                currency,
                amount,
                purchasePrice,
            },
        });

        return res.status(201).json({
            message: 'Added to portfolio successfully',
            holding,
        });
    } catch (error) {
        console.error('Add to portfolio error:', error);
        return res.status(500).json({ error: 'Failed to add to portfolio' });
    }
};

/**
 * Update portfolio holding
 */
export const updatePortfolioHolding = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;
        const { amount } = req.body;

        // Verify ownership
        const holding = await prisma.portfolio.findFirst({
            where: {
                id,
                userId: req.user.id,
            },
        });

        if (!holding) {
            return res.status(404).json({ error: 'Holding not found' });
        }

        // Update holding
        const updated = await prisma.portfolio.update({
            where: { id },
            data: { amount },
        });

        return res.json({
            message: 'Portfolio updated successfully',
            holding: updated,
        });
    } catch (error) {
        console.error('Update portfolio error:', error);
        return res.status(500).json({ error: 'Failed to update portfolio' });
    }
};

/**
 * Delete portfolio holding
 */
export const deletePortfolioHolding = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;

        // Verify ownership
        const holding = await prisma.portfolio.findFirst({
            where: {
                id,
                userId: req.user.id,
            },
        });

        if (!holding) {
            return res.status(404).json({ error: 'Holding not found' });
        }

        // Delete holding
        await prisma.portfolio.delete({
            where: { id },
        });

        return res.json({ message: 'Holding removed from portfolio' });
    } catch (error) {
        console.error('Delete portfolio error:', error);
        return res.status(500).json({ error: 'Failed to delete holding' });
    }
};

/**
 * Get portfolio performance analytics
 */
export const getPortfolioAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const portfolio = await prisma.portfolio.findMany({
            where: { userId: req.user.id },
        });

        if (portfolio.length === 0) {
            return res.json({
                allocation: [],
                performance: [],
                topPerformers: [],
                worstPerformers: [],
            });
        }

        // Calculate allocation
        const allocation = await Promise.all(
            portfolio.map(async (holding) => {
                const currentRate = await getRealTimeRate('USD', holding.currency);
                const value = holding.amount * currentRate;

                return {
                    currency: holding.currency,
                    value,
                };
            })
        );

        const totalValue = allocation.reduce((sum, a) => sum + a.value, 0);

        const allocationPercent = allocation.map((a) => ({
            currency: a.currency,
            value: a.value,
            percentage: (a.value / totalValue) * 100,
        }));

        // Calculate performance
        const performance = await Promise.all(
            portfolio.map(async (holding) => {
                const currentRate = await getRealTimeRate('USD', holding.currency);
                const currentValue = holding.amount * currentRate;
                const purchaseValue = holding.amount * holding.purchasePrice;
                const profitLoss = currentValue - purchaseValue;
                const profitLossPercent = (profitLoss / purchaseValue) * 100;

                return {
                    currency: holding.currency,
                    profitLoss,
                    profitLossPercent,
                };
            })
        );

        // Sort by performance
        const sorted = [...performance].sort(
            (a, b) => b.profitLossPercent - a.profitLossPercent
        );

        return res.json({
            allocation: allocationPercent,
            performance,
            topPerformers: sorted.slice(0, 3),
            worstPerformers: sorted.slice(-3).reverse(),
        });
    } catch (error) {
        console.error('Portfolio analytics error:', error);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
