import axios from 'axios';
import NodeCache from 'node-cache';
import * as forexService from '../../services/forex.service';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('axios');
jest.mock('node-cache');
jest.mock('@prisma/client');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Forex Service', () => {
    let mockCache: any;
    let mockPrisma: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockCache = {
            get: jest.fn(),
            set: jest.fn(),
        };

        (NodeCache as jest.MockedClass<typeof NodeCache>).mockImplementation(() => mockCache);

        mockPrisma = {
            historicalData: {
                findMany: jest.fn(),
            },
            exchangeRate: {
                create: jest.fn(),
            },
        };

        (PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);
    });

    describe('getRealTimeRate', () => {
        it('should return cached rate if available', async () => {
            const cachedRate = 1.12;
            mockCache.get.mockReturnValue(cachedRate);

            const rate = await forexService.getRealTimeRate('EUR', 'USD');

            expect(rate).toBe(cachedRate);
            expect(mockCache.get).toHaveBeenCalledWith('EUR-USD');
            expect(mockedAxios.get).not.toHaveBeenCalled();
        });

        it('should fetch from API if not cached', async () => {
            mockCache.get.mockReturnValue(undefined);

            const mockResponse = {
                data: {
                    rates: { USD: 1.12 },
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const rate = await forexService.getRealTimeRate('EUR', 'USD');

            expect(rate).toBe(1.12);
            expect(mockedAxios.get).toHaveBeenCalled();
            expect(mockCache.set).toHaveBeenCalledWith('EUR-USD', 1.12, expect.any(Number));
        });

        it('should handle API errors and retry with fallback', async () => {
            mockCache.get.mockReturnValue(undefined);

            // First API call fails
            mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

            // Second API (fallback) succeeds
            const fallbackResponse = {
                data: {
                    rates: { USD: 1.13 },
                },
            };
            mockedAxios.get.mockResolvedValueOnce(fallbackResponse);

            const rate = await forexService.getRealTimeRate('EUR', 'USD');

            expect(rate).toBeDefined();
            expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        });

        it('should normalize currency pair formats', async () => {
            mockCache.get.mockReturnValue(undefined);

            const mockResponse = {
                data: {
                    rates: { USD: 1.12 },
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            // Test with different formats
            await forexService.getRealTimeRate('EUR/USD', '');
            await forexService.getRealTimeRate('EUR-USD', '');

            expect(mockedAxios.get).toHaveBeenCalled();
        });

        it('should return inverse rate when needed', async () => {
            mockCache.get.mockReturnValue(undefined);

            const mockResponse = {
                data: {
                    rates: { EUR: 0.89 },
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const rate = await forexService.getRealTimeRate('USD', 'EUR');

            expect(rate).toBeCloseTo(0.89, 2);
        });
    });

    describe('getMultipleRates', () => {
        it('should fetch multiple rates successfully', async () => {
            mockCache.get.mockReturnValue(undefined);

            const mockResponse = {
                data: {
                    rates: {
                        EUR: 0.89,
                        GBP: 0.76,
                        JPY: 110.5,
                    },
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const rates = await forexService.getMultipleRates('USD', ['EUR', 'GBP', 'JPY']);

            expect(rates).toHaveProperty('EUR');
            expect(rates).toHaveProperty('GBP');
            expect(rates).toHaveProperty('JPY');
        });

        it('should handle partial failures gracefully', async () => {
            mockCache.get.mockReturnValue(undefined);

            const mockResponse = {
                data: {
                    rates: {
                        EUR: 0.89,
                        GBP: 0.76,
                    },
                },
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const rates = await forexService.getMultipleRates('USD', ['EUR', 'GBP', 'INVALID']);

            expect(rates).toHaveProperty('EUR');
            expect(rates).toHaveProperty('GBP');
        });
    });

    describe('getHistoricalDataFromDB', () => {
        it('should fetch historical data for 24h period', async () => {
            const mockData = [
                {
                    currencyPair: 'EUR-USD',
                    open: 1.10,
                    close: 1.12,
                    high: 1.13,
                    low: 1.09,
                    date: new Date('2024-01-01'),
                },
            ];

            mockPrisma.historicalData.findMany.mockResolvedValue(mockData);

            const data = await forexService.getHistoricalDataFromDB('EUR-USD', '24h');

            expect(mockPrisma.historicalData.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        currencyPair: 'EUR-USD',
                    }),
                })
            );
            expect(data).toEqual(mockData);
        });

        it('should fetch historical data for longer periods', async () => {
            const mockData = Array(30).fill(null).map((_, i) => ({
                currencyPair: 'EUR-USD',
                open: 1.10,
                close: 1.12,
                high: 1.13,
                low: 1.09,
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            }));

            mockPrisma.historicalData.findMany.mockResolvedValue(mockData);

            const data = await forexService.getHistoricalDataFromDB('EUR-USD', '1w');

            expect(data.length).toBeGreaterThan(0);
        });
    });

    describe('calculate24hChange', () => {
        it('should calculate 24h change percentage correctly', async () => {
            mockCache.get.mockReturnValue(undefined);

            const currentResponse = {
                data: {
                    rates: { USD: 1.12 },
                },
            };

            mockedAxios.get.mockResolvedValue(currentResponse);

            const mockHistoricalData = [
                {
                    currencyPair: 'EUR-USD',
                    close: 1.10,
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            ];

            mockPrisma.historicalData.findMany.mockResolvedValue(mockHistoricalData);

            const result = await forexService.calculate24hChange('EUR-USD');

            expect(result.change).toBeCloseTo(1.82, 1); // (1.12 - 1.10) / 1.10 * 100
            expect(result.currentRate).toBe(1.12);
            expect(result.previousRate).toBe(1.10);
        });

        it('should handle missing historical data', async () => {
            mockCache.get.mockReturnValue(1.12);
            mockPrisma.historicalData.findMany.mockResolvedValue([]);

            const result = await forexService.calculate24hChange('EUR-USD');

            expect(result.change).toBe(0);
        });
    });
});
