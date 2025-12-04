import axios from 'axios';
import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache with TTL from environment
const cache = new NodeCache({
    stdTTL: parseInt(process.env.FOREX_CACHE_TTL || '300'), // 5 minutes default
    checkperiod: 60,
});

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Fetch real-time exchange rate
 */
export const getRealTimeRate = async (
    fromCurrency: string,
    toCurrency: string
): Promise<number> => {
    const cacheKey = `rate_${fromCurrency}_${toCurrency}`;

    // Check cache first
    const cachedRate = cache.get<number>(cacheKey);
    if (cachedRate) {
        return cachedRate;
    }

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'CURRENCY_EXCHANGE_RATE',
                from_currency: fromCurrency,
                to_currency: toCurrency,
                apikey: ALPHA_VANTAGE_API_KEY,
            },
            timeout: 10000,
        });

        const data = response.data['Realtime Currency Exchange Rate'];

        if (!data) {
            throw new Error('Invalid API response');
        }

        const rate = parseFloat(data['5. Exchange Rate']);

        // Store in database
        await prisma.exchangeRate.create({
            data: {
                baseCurrency: fromCurrency,
                targetCurrency: toCurrency,
                rate,
            },
        });

        // Cache the result
        cache.set(cacheKey, rate);

        return rate;
    } catch (error) {
        console.error('Error fetching real-time rate:', error);

        // Fallback to last known rate from database
        const lastRate = await prisma.exchangeRate.findFirst({
            where: {
                baseCurrency: fromCurrency,
                targetCurrency: toCurrency,
            },
            orderBy: { timestamp: 'desc' },
        });

        if (lastRate) {
            return lastRate.rate;
        }

        throw new Error('Failed to fetch exchange rate');
    }
};

/**
 * Fetch multiple currency rates
 */
export const getMultipleRates = async (
    baseCurrency: string,
    targetCurrencies: string[]
): Promise<{ [key: string]: number }> => {
    const rates: { [key: string]: number } = {};

    for (const target of targetCurrencies) {
        try {
            rates[target] = await getRealTimeRate(baseCurrency, target);
        } catch (error) {
            console.error(`Failed to fetch rate for ${baseCurrency}/${target}`);
        }
    }

    return rates;
};

/**
 * Fetch historical data for a currency pair
 */
export const getHistoricalData = async (
    fromCurrency: string,
    toCurrency: string,
    outputSize: 'compact' | 'full' = 'compact'
): Promise<any[]> => {
    const cacheKey = `historical_${fromCurrency}_${toCurrency}_${outputSize}`;

    // Check cache
    const cachedData = cache.get<any[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'FX_DAILY',
                from_symbol: fromCurrency,
                to_symbol: toCurrency,
                outputsize: outputSize,
                apikey: ALPHA_VANTAGE_API_KEY,
            },
            timeout: 15000,
        });

        const timeSeries = response.data['Time Series FX (Daily)'];

        if (!timeSeries) {
            throw new Error('Invalid historical data response');
        }

        const currencyPair = `${fromCurrency}/${toCurrency}`;
        const historicalData: any[] = [];

        // Parse and store historical data
        for (const [date, values] of Object.entries(timeSeries)) {
            const dataPoint = {
                currencyPair,
                date: new Date(date),
                open: parseFloat((values as any)['1. open']),
                high: parseFloat((values as any)['2. high']),
                low: parseFloat((values as any)['3. low']),
                close: parseFloat((values as any)['4. close']),
                volume: 0, // FX data doesn't have volume
            };

            historicalData.push(dataPoint);

            // Store in database (upsert to avoid duplicates)
            await prisma.historicalData.upsert({
                where: {
                    currencyPair_date: {
                        currencyPair,
                        date: new Date(date),
                    },
                },
                update: dataPoint,
                create: dataPoint,
            });
        }

        // Cache the result
        cache.set(cacheKey, historicalData);

        return historicalData;
    } catch (error) {
        console.error('Error fetching historical data:', error);

        // Fallback to database
        const dbData = await prisma.historicalData.findMany({
            where: {
                currencyPair: `${fromCurrency}/${toCurrency}`,
            },
            orderBy: { date: 'desc' },
            take: outputSize === 'compact' ? 100 : 1000,
        });

        if (dbData.length > 0) {
            return dbData;
        }

        throw new Error('Failed to fetch historical data');
    }
};

/**
 * Get historical data from database with filters
 */
export const getHistoricalDataFromDB = async (
    currencyPair: string,
    period: '24h' | '1w' | '6m' | '1y'
): Promise<any[]> => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '1w':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '6m':
            startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
        case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const data = await prisma.historicalData.findMany({
        where: {
            currencyPair,
            date: {
                gte: startDate,
            },
        },
        orderBy: { date: 'asc' },
    });

    return data;
};

/**
 * Calculate 24h change percentage
 */
export const calculate24hChange = async (
    currencyPair: string
): Promise<number> => {
    const data = await getHistoricalDataFromDB(currencyPair, '24h');

    if (data.length < 2) {
        return 0;
    }

    const oldestPrice = data[0].close;
    const latestPrice = data[data.length - 1].close;

    const change = ((latestPrice - oldestPrice) / oldestPrice) * 100;

    return parseFloat(change.toFixed(2));
};

/**
 * Get top gainers and losers
 */
export const getTopMovers = async (
    baseCurrency: string = 'USD',
    limit: number = 5
): Promise<{ gainers: any[]; losers: any[] }> => {
    const currencies = await prisma.currency.findMany({
        where: {
            symbol: {
                not: baseCurrency,
            },
        },
    });

    const movements: any[] = [];

    for (const currency of currencies) {
        const currencyPair = `${baseCurrency}/${currency.symbol}`;
        try {
            const change = await calculate24hChange(currencyPair);
            const currentRate = await getRealTimeRate(baseCurrency, currency.symbol);

            movements.push({
                currencyPair,
                currency: currency.symbol,
                name: currency.name,
                currentRate,
                change,
            });
        } catch (error) {
            console.error(`Failed to calculate change for ${currencyPair}`);
        }
    }

    // Sort by change percentage
    movements.sort((a, b) => b.change - a.change);

    return {
        gainers: movements.slice(0, limit),
        losers: movements.slice(-limit).reverse(),
    };
};
