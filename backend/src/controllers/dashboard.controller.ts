import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRealTimeRate, getTopMovers, calculate24hChange } from '../services/forex.service';

const prisma = new PrismaClient();

/**
 * Get dashboard data with live rates and market overview
 */
export const getDashboardData = async (req: Request, res: Response) => {
    try {
        const baseCurrency = (req.query.base as string) || 'USD';

        // Get all currencies except base
        const currencies = await prisma.currency.findMany({
            where: {
                symbol: {
                    not: baseCurrency,
                },
            },
        });

        // Fetch live rates
        const liveRates: any[] = [];

        for (const currency of currencies.slice(0, 12)) {
            // Limit to 12 for performance
            try {
                const rate = await getRealTimeRate(baseCurrency, currency.symbol);
                const currencyPair = `${baseCurrency}/${currency.symbol}`;
                const change24h = await calculate24hChange(currencyPair);

                liveRates.push({
                    currencyPair,
                    baseCurrency,
                    targetCurrency: currency.symbol,
                    name: currency.name,
                    rate,
                    change24h,
                    trend: change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'neutral',
                });
            } catch (error) {
                console.error(`Failed to fetch rate for ${currency.symbol}`);
            }
        }

        // Get top gainers and losers
        const { gainers, losers } = await getTopMovers(baseCurrency, 5);

        // Calculate market summary
        const totalPairs = liveRates.length;
        const positiveMovers = liveRates.filter((r) => r.change24h > 0).length;
        const negativeMovers = liveRates.filter((r) => r.change24h < 0).length;

        const marketSummary = {
            totalPairs,
            positiveMovers,
            negativeMovers,
            neutralMovers: totalPairs - positiveMovers - negativeMovers,
            marketSentiment:
                positiveMovers > negativeMovers
                    ? 'bullish'
                    : positiveMovers < negativeMovers
                        ? 'bearish'
                        : 'neutral',
        };

        res.json({
            baseCurrency,
            liveRates,
            topGainers: gainers,
            topLosers: losers,
            marketSummary,
            lastUpdated: new Date(),
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};

/**
 * Get heatmap data for visualization
 */
export const getHeatmapData = async (req: Request, res: Response) => {
    try {
        const baseCurrency = (req.query.base as string) || 'USD';

        const currencies = await prisma.currency.findMany({
            where: {
                symbol: {
                    not: baseCurrency,
                },
            },
            take: 20,
        });

        const heatmapData: any[] = [];

        for (const currency of currencies) {
            const currencyPair = `${baseCurrency}/${currency.symbol}`;
            try {
                const change24h = await calculate24hChange(currencyPair);
                const rate = await getRealTimeRate(baseCurrency, currency.symbol);

                heatmapData.push({
                    currency: currency.symbol,
                    name: currency.name,
                    change: change24h,
                    rate,
                    // Color intensity based on change magnitude
                    intensity: Math.min(100, Math.abs(change24h) * 10),
                    color: change24h > 0 ? 'green' : change24h < 0 ? 'red' : 'gray',
                });
            } catch (error) {
                console.error(`Failed to fetch heatmap data for ${currency.symbol}`);
            }
        }

        res.json({
            baseCurrency,
            data: heatmapData,
            lastUpdated: new Date(),
        });
    } catch (error) {
        console.error('Heatmap error:', error);
        res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
};

/**
 * Get market statistics
 */
export const getMarketStats = async (_req: Request, res: Response) => {
    try {
        // Get total exchange rates recorded
        const totalRates = await prisma.exchangeRate.count();

        // Get total historical data points
        const totalHistoricalData = await prisma.historicalData.count();

        // Get latest news count
        const newsCount = await prisma.news.count({
            where: {
                publishedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
            },
        });

        // Get active predictions
        const predictionsCount = await prisma.prediction.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        });

        res.json({
            totalRates,
            totalHistoricalData,
            newsLast24h: newsCount,
            predictionsLast24h: predictionsCount,
        });
    } catch (error) {
        console.error('Market stats error:', error);
        res.status(500).json({ error: 'Failed to fetch market statistics' });
    }
};
