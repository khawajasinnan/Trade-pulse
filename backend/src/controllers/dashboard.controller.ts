import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRealTimeRate } from '../services/forex.service';
import { getMarketDashboardData, getMarketStats } from '../services/market-analytics.service';

const prisma = new PrismaClient();

/**
 * Get dashboard data with REAL-TIME market information
 */
export const getDashboardData = async (_req: Request, res: Response) => {
    try {
        // Fetch live market data from APIs
        const marketData = await getMarketDashboardData();

        // Get news sentiment summary
        const newsCount = await prisma.news.count();
        const positiveSentiment = await prisma.news.count({
            where: { sentiment: 'POSITIVE' },
        });
        const negativeSentiment = await prisma.news.count({
            where: { sentiment: 'NEGATIVE' },
        });

        return res.json({
            currencyPairs: marketData.gainers.concat(marketData.losers),
            gainers: marketData.gainers,
            losers: marketData.losers,
            stats: {
                totalPairs: marketData.stats.totalPairs,
                positiveMovers: marketData.stats.positiveMovers,
                negativeMovers: marketData.stats.negativeMovers,
                sentiment: marketData.stats.sentiment,
            },
            news: {
                total: newsCount,
                positive: positiveSentiment,
                negative: negativeSentiment,
            },
            timestamp: marketData.timestamp,
        });
    } catch (error) {
        console.error('Dashboard data error:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
};

/**
 * Get market heatmap data with real-time rates
 */
export const getHeatmapData = async (_req: Request, res: Response) => {
    try {
        const baseCurrencies = ['USD', 'EUR', 'GBP'];
        const targetCurrencies = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];

        const heatmapData: any[] = [];

        for (const base of baseCurrencies) {
            for (const target of targetCurrencies) {
                if (base === target) continue;

                try {
                    const rate = await getRealTimeRate(base, target);
                    heatmapData.push({
                        from: base,
                        to: target,
                        rate,
                    });
                } catch (error) {
                    console.error(`Failed to fetch ${base}/${target}`);
                }
            }
        }

        return res.json({
            data: heatmapData,
            lastUpdated: new Date(),
        });
    } catch (error) {
        console.error('Heatmap error:', error);
        return res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
};

/**
 * Get market statistics endpoint
 */
export const getMarketStatsEndpoint = async (_req: Request, res: Response) => {
    try {
        const stats = await getMarketStats();

        return res.json(stats);
    } catch (error) {
        console.error('Market stats error:', error);
        return res.status(500).json({ error: 'Failed to fetch market statistics' });
    }
};
