import { Request, Response } from 'express';
import * as dashboardController from '../../controllers/dashboard.controller';
import * as forexService from '../../services/forex.service';
import * as marketAnalyticsService from '../../services/market-analytics.service';
import { mockRequest, mockResponse } from '../helpers';

// Mock dependencies
jest.mock('../../services/forex.service');
jest.mock('../../services/market-analytics.service');
jest.mock('@prisma/client');

describe('Dashboard Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDashboardData', () => {
        it('should return dashboard data with market information', async () => {
            const req = mockRequest() as Request;
            const res = mockResponse() as Response;

            const mockMarketData = {
                gainers: [
                    { pair: 'EUR-USD', rate: 1.12, change24h: 2.5 },
                    { pair: 'GBP-USD', rate: 1.25, change24h: 1.8 },
                ],
                losers: [
                    { pair: 'USD-JPY', rate: 110.5, change24h: -1.2 },
                ],
                stats: {
                    totalPairs: 10,
                    positiveMovers: 5,
                    negativeMovers: 5,
                    sentiment: 'NEUTRAL',
                },
                timestamp: new Date(),
            };

            (marketAnalyticsService.getMarketDashboardData as jest.Mock).mockResolvedValue(mockMarketData);

            await dashboardController.getDashboardData(req, res);

            expect(marketAnalyticsService.getMarketDashboardData).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    currencyPairs: expect.any(Array),
                    gainers: mockMarketData.gainers,
                    losers: mockMarketData.losers,
                    stats: mockMarketData.stats,
                })
            );
        });

        it('should handle errors gracefully', async () => {
            const req = mockRequest() as Request;
            const res = mockResponse() as Response;

            (marketAnalyticsService.getMarketDashboardData as jest.Mock).mockRejectedValue(
                new Error('API error')
            );

            await dashboardController.getDashboardData(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch dashboard data' });
        });
    });

    describe('getHeatmapData', () => {
        it('should return heatmap data with currency rates', async () => {
            const req = mockRequest() as Request;
            const res = mockResponse() as Response;

            (forexService.getRealTimeRate as jest.Mock).mockResolvedValue(1.12);

            await dashboardController.getHeatmapData(req, res);

            expect(forexService.getRealTimeRate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.any(Array),
                    lastUpdated: expect.any(Date),
                })
            );
        });

        it('should handle API errors gracefully', async () => {
            const req = mockRequest() as Request;
            const res = mockResponse() as Response;

            (forexService.getRealTimeRate as jest.Mock).mockRejectedValue(
                new Error('Rate fetch failed')
            );

            await dashboardController.getHeatmapData(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch heatmap data' });
        });
    });

    describe('getMarketStatsEndpoint', () => {
        it('should return market statistics', async () => {
            const req = mockRequest() as Request;
            const res = mockResponse() as Response;

            const mockStats = {
                totalTradingPairs: 50,
                activeMarkets: 45,
                avgVolatility: 2.3,
                topGainer: { pair: 'EUR-USD', change: 5.2 },
                topLoser: { pair: 'USD-JPY', change: -3.1 },
            };

            (marketAnalyticsService.getMarketStats as jest.Mock).mockResolvedValue(mockStats);

            await dashboardController.getMarketStatsEndpoint(req, res);

            expect(marketAnalyticsService.getMarketStats).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockStats);
        });

        it('should handle errors', async () => {
            const req = mockRequest() as Request;
            const res = mockResponse() as Response;

            (marketAnalyticsService.getMarketStats as jest.Mock).mockRejectedValue(
                new Error('Stats error')
            );

            await dashboardController.getMarketStatsEndpoint(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch market statistics' });
        });
    });
});
