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

        // Fetch current rates for each holding
        const holdingsWithRates = await Promise.all(
            portfolio.map(async (holding) => {
                try {
                    // Parse currency pair (e.g., "EUR/USD" -> from="EUR", to="USD")
                    // Decode HTML entities first (e.g., "EUR&#x2F;USD" -> "EUR/USD")
                    let currencyPair = holding.currency
                        .replace(/&#x2F;/g, '/')
                        .replace(/&amp;/g, '&')
                        .replace(/&#x27;/g, "'");

                    let currentRate = 1.0;

                    if (currencyPair.includes('/')) {
                        const [fromCurrency, toCurrency] = currencyPair.split('/');
                        currentRate = await getRealTimeRate(fromCurrency, toCurrency);
                    } else {
                        // If it's a single currency, assume USD as base
                        currentRate = await getRealTimeRate('USD', currencyPair);
                    }

                    const currentValue = holding.amount * currentRate;
                    const purchaseValue = holding.amount * holding.purchasePrice;
                    const profitLoss = currentValue - purchaseValue;
                    const profitLossPercentage =
                        purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0;

                    return {
                        id: holding.id,
                        currency: holding.currency,
                        amount: holding.amount,
                        purchasePrice: holding.purchasePrice,
                        currentPrice: currentRate,
                        currentValue,
                        purchaseValue,
                        profitLoss,
                        profitLossPercentage,
                        purchasedAt: holding.createdAt,
                    };
                } catch (error) {
                    console.error(
                        `Failed to fetch rate for ${holding.currency}:`,
                        error
                    );
                    // Return holding with fallback data
                    return {
                        id: holding.id,
                        currency: holding.currency,
                        amount: holding.amount,
                        purchasePrice: holding.purchasePrice,
                        currentPrice: holding.purchasePrice,
                        currentValue: holding.amount * holding.purchasePrice,
                        purchaseValue: holding.amount * holding.purchasePrice,
                        profitLoss: 0,
                        profitLossPercentage: 0,
                        purchasedAt: holding.createdAt,
                    };
                }
            })
        );

        // Calculate totals
        const totalCurrentValue = holdingsWithRates.reduce(
            (sum, h) => sum + h.currentValue,
            0
        );
        const totalPurchaseValue = holdingsWithRates.reduce(
            (sum, h) => sum + h.purchaseValue,
            0
        );
        const totalProfitLoss = totalCurrentValue - totalPurchaseValue;
        const totalProfitLossPercent =
            totalPurchaseValue > 0 ? (totalProfitLoss / totalPurchaseValue) * 100 : 0;

        return res.json({
            holdings: holdingsWithRates,
            summary: {
                totalCurrentValue,
                totalHoldings: holdingsWithRates.length,
                totalPurchaseValue,
                totalProfitLoss,
                totalProfitLossPercent,
                holdings: holdingsWithRates.length,
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

        let { currency, amount, purchasePrice } = req.body;

        // Decode HTML entities in currency (e.g., "EUR&#x2F;USD" -> "EUR/USD")
        currency = currency
            .replace(/&#x2F;/g, '/')
            .replace(/&amp;/g, '&')
            .replace(/&#x27;/g, "'");

        console.log('Add to portfolio request:', {
            currency,
            amount,
            purchasePrice,
            userId: req.user.id,
        });

        // Validate input
        if (!currency || currency.trim() === '') {
            return res.status(400).json({ error: 'Currency is required' });
        }

        if (amount === undefined || amount === null) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        if (purchasePrice === undefined || purchasePrice === null) {
            return res.status(400).json({ error: 'Purchase price is required' });
        }

        const parsedAmount = parseFloat(amount);
        const parsedPrice = parseFloat(purchasePrice);

        if (isNaN(parsedAmount)) {
            return res.status(400).json({ error: 'Amount must be a valid number' });
        }

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ error: 'Purchase price must be a valid positive number' });
        }

        // Check if selling (negative amount)
        if (parsedAmount < 0) {
            const existingHolding = await prisma.portfolio.findFirst({
                where: {
                    userId: req.user.id,
                    currency,
                },
            });

            if (!existingHolding) {
                return res.status(400).json({
                    error: `Cannot sell ${currency} - you do not own this currency`,
                });
            }

            if (existingHolding.amount < Math.abs(parsedAmount)) {
                return res.status(400).json({
                    error: `Cannot sell ${Math.abs(parsedAmount)} units - you only have ${existingHolding.amount} units of ${currency}`,
                });
            }
        }

        // Check if user already has this currency in portfolio
        const existingHolding = await prisma.portfolio.findFirst({
            where: {
                userId: req.user.id,
                currency,
            },
        });

        if (existingHolding) {
            // Update existing holding
            const totalUnits = existingHolding.amount + parsedAmount;

            // If selling all or more than available, delete the holding
            if (totalUnits <= 0) {
                await prisma.portfolio.delete({
                    where: { id: existingHolding.id },
                });

                return res.json({
                    message: 'Holding removed from portfolio',
                    holding: null,
                });
            }

            // Otherwise, update with weighted average price (only for buys)
            let newAvgPrice = existingHolding.purchasePrice;
            if (parsedAmount > 0) {
                // BUY: Calculate weighted average
                const totalCost = (existingHolding.amount * existingHolding.purchasePrice) + (parsedAmount * parsedPrice);
                newAvgPrice = totalCost / totalUnits;
            }
            // For SELL: Keep existing average price

            const updated = await prisma.portfolio.update({
                where: { id: existingHolding.id },
                data: {
                    amount: totalUnits,
                    purchasePrice: newAvgPrice,
                },
            });

            return res.json({
                message: 'Portfolio updated successfully',
                holding: updated,
            });
        }

        // Add new holding to portfolio (only if positive amount)
        if (parsedAmount <= 0) {
            return res.status(400).json({
                error: 'Cannot sell a currency you do not own'
            });
        }

        const holding = await prisma.portfolio.create({
            data: {
                userId: req.user.id,
                currency,
                amount: parsedAmount,
                purchasePrice: parsedPrice,
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
