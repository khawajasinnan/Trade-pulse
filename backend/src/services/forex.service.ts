import axios from 'axios';
import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cache = new NodeCache({
    stdTTL: parseInt(process.env.FOREX_CACHE_TTL || '300'), // 5 minutes default
    checkperiod: 60,
});

// API configuration - supports multiple providers
const FOREX_API_KEY = process.env.FOREX_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;
const API_PROVIDER = process.env.FOREX_API_PROVIDER || 'exchangerate'; // 'exchangerate' or 'alphavantage'

/**
 * Fetch real-time exchange rate from ExchangeRate-API
 */
async function fetchFromExchangeRateAPI(from: string, to: string): Promise<number> {
    if (!FOREX_API_KEY) {
        throw new Error('FOREX_API_KEY not configured');
    }

    const url = `https://v6.exchangerate-api.com/v6/${FOREX_API_KEY}/pair/${from}/${to}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data.result !== 'success') {
        throw new Error('ExchangeRate-API request failed');
    }

    return response.data.conversion_rate;
}

/**
 * Fetch real-time exchange rate from Alpha Vantage
 */
async function fetchFromAlphaVantage(from: string, to: string): Promise<number> {
    if (!FOREX_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }

    const BASE_URL = 'https://www.alphavantage.co/query';
    const response = await axios.get(BASE_URL, {
        params: {
            function: 'CURRENCY_EXCHANGE_RATE',
            from_currency: from,
            to_currency: to,
            apikey: FOREX_API_KEY,
        },
        timeout: 10000,
    });

    // Check for rate limit error
    if (response.data.Note) {
        console.log('Alpha Vantage rate limit hit:', response.data.Note);
        throw new Error('Rate limit exceeded');
    }

    // Check for invalid API key
    if (response.data.Error || response.data['Error Message']) {
        console.log('Alpha Vantage error:', response.data);
        throw new Error('API error');
    }

    const data = response.data['Realtime Currency Exchange Rate'];
    if (!data) {
        console.log('Unexpected Alpha Vantage response:', JSON.stringify(response.data).substring(0, 200));
        throw new Error('Invalid Alpha Vantage response');
    }

    return parseFloat(data['5. Exchange Rate']);
}

/**
 * Fetch real-time exchange rate from exchangerate.host (free, no API key)
 */
async function fetchFromExchangeRateHost(from: string, to: string): Promise<number> {
    // Support optional access key. If provided, treat it as an apilayer/apikey for exchangerates_data
    const accessKey = process.env.EXCHANGERATE_HOST_KEY;

    if (accessKey) {
        // Many users provide an apilayer key - call apilayer exchangerates_data endpoint with header
        const url = `https://api.apilayer.com/exchangerates_data/convert?from=${from}&to=${to}`;
        const response = await axios.get(url, {
            timeout: 10000,
            headers: { apikey: accessKey },
        });

        if (!response.data || typeof response.data.result !== 'number') {
            console.log('apilayer exchangerates_data invalid response:', JSON.stringify(response.data).substring(0, 400));
            throw new Error('ExchangeRateHost (apilayer) failed');
        }

        return response.data.result;
    }

    // No key provided - use exchangerate.host (public, no key required)
    const url = `https://api.exchangerate.host/convert?from=${from}&to=${to}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (!response.data || response.data.success === false || typeof response.data.result !== 'number') {
        console.log('exchangerate.host invalid response:', JSON.stringify(response.data).substring(0, 400));
        throw new Error('ExchangeRateHost failed');
    }

    return response.data.result;
}

/**
 * Fetch rate from Frankfurter.app (free)
 */
async function fetchFromFrankfurter(from: string, to: string): Promise<number> {
    // Example: https://api.frankfurter.app/latest?from=USD&to=EUR
    const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;
    const response = await axios.get(url, { timeout: 8000 });

    if (!response.data || !response.data.rates || typeof response.data.rates[to] !== 'number') {
        console.log('Frankfurter invalid response:', JSON.stringify(response.data).substring(0, 400));
        throw new Error('Frankfurter failed');
    }

    return response.data.rates[to];
}

/**
 * Fetch rate from open.er-api.com (free)
 */
async function fetchFromOpenEr(from: string, to: string): Promise<number> {
    // Example: https://open.er-api.com/v6/latest/USD
    const url = `https://open.er-api.com/v6/latest/${from}`;
    const response = await axios.get(url, { timeout: 8000 });

    if (!response.data || response.data.result !== 'success' || typeof response.data.rates[to] !== 'number') {
        console.log('open.er-api invalid response:', JSON.stringify(response.data).substring(0, 400));
        throw new Error('OpenEr failed');
    }

    return response.data.rates[to];
}

/**
 * Get real-time exchange rate - main function
 */
export const getRealTimeRate = async (
    fromCurrency: string,
    toCurrency: string
): Promise<number> => {
    // Normalize inputs: accept formats like 'EUR/USD', 'EUR-USD', or accidental 'USD/EUR/USD'
    const normalize = (s: string) => {
        if (!s) return s;
        let v = s.toString().trim().toUpperCase();
        // Replace common separators with '/'
        v = v.replace(/[-_\\]/g, '/');
        if (v.includes('/')) {
            const parts = v.split('/').filter(Boolean);
            // If there's more than 2 parts (weird inputs like USD/EUR/USD), take first and last appropriately
            if (parts.length === 1) return parts[0];
            if (parts.length === 2) return parts.join('/');
            // default: take first for base or last for target depending on context; leave caller to split
            return parts.join('/');
        }
        return v;
    };

    let from = normalize(fromCurrency);
    let to = normalize(toCurrency);

    // If caller passed the full pair in `from` like 'EUR/USD', split it and override `to`
    if (from && from.includes('/')) {
        const parts = from.split('/');
        if (parts.length >= 2) {
            from = parts[0];
            to = parts[1];
        }
    }

    // If `to` contains a pair, extract the last token as the target currency
    if (to && to.includes('/')) {
        const parts = to.split('/');
        if (parts.length >= 2) {
            to = parts[parts.length - 1];
        }
    }

    const cacheKey = `rate_${from}_${to}`;

    // Check cache first
    const cachedRate = cache.get<number>(cacheKey);
    if (cachedRate) {
        return cachedRate;
    }

    try {
        let rate: number;

        // Try API call based on provider. If one fails, fall back to exchangerate.host.
        if (API_PROVIDER === 'exchangerate') {
            try {
                rate = await fetchFromExchangeRateAPI(from, to);
            } catch (err) {
                console.warn('ExchangeRate-API failed for', `${from}/${to}`, (err as any)?.message || String(err));
                // Try exchangerate.host, then frankfurter, then open.er-api
                try {
                    rate = await fetchFromExchangeRateHost(from, to);
                } catch (e1) {
                    console.warn('exchangerate.host failed for', `${from}/${to}`, (e1 as any)?.message || String(e1));
                    try {
                        rate = await fetchFromFrankfurter(from, to);
                    } catch (e2) {
                        console.warn('frankfurter failed for', `${from}/${to}`, (e2 as any)?.message || String(e2));
                        rate = await fetchFromOpenEr(from, to);
                    }
                }
            }
        } else {
            try {
                rate = await fetchFromAlphaVantage(from, to);
            } catch (err) {
                console.warn('Alpha Vantage failed for', `${from}/${to}`, (err as any)?.message || String(err));
                try {
                    rate = await fetchFromExchangeRateHost(from, to);
                } catch (e1) {
                    console.warn('exchangerate.host failed for', `${from}/${to}`, (e1 as any)?.message || String(e1));
                    try {
                        rate = await fetchFromFrankfurter(from, to);
                    } catch (e2) {
                        console.warn('frankfurter failed for', `${from}/${to}`, (e2 as any)?.message || String(e2));
                        rate = await fetchFromOpenEr(from, to);
                    }
                }
            }
        }

        // Store in database for historical analysis
        try {
            await prisma.exchangeRate.create({
                data: {
                    baseCurrency: fromCurrency,
                    targetCurrency: toCurrency,
                    rate,
                },
            });

            // Also store in HistoricalData table for ML training
            const currencyPair = `${fromCurrency}-${toCurrency}`;
            await prisma.historicalData.upsert({
                where: {
                    currencyPair_date: {
                        currencyPair,
                        date: new Date(),
                    },
                },
                update: { close: rate },
                create: {
                    currencyPair,
                    date: new Date(),
                    open: rate,
                    high: rate,
                    low: rate,
                    close: rate,
                    volume: 0,
                },
            });
        } catch (dbError) {
            console.error('Failed to store rate in database:', dbError);
            // Continue anyway - we have the rate
        }

        // Cache for 5 minutes
        cache.set(cacheKey, rate);

        return rate;
    } catch (error) {
        console.error(`Failed to fetch rate for ${fromCurrency}/${toCurrency}:`, error);

        // Fallback to last known rate from database
        try {
            const lastRate = await prisma.exchangeRate.findFirst({
                where: {
                    baseCurrency: fromCurrency,
                    targetCurrency: toCurrency,
                },
                orderBy: { timestamp: 'desc' },
            });

            if (lastRate) {
                cache.set(cacheKey, lastRate.rate);
                return lastRate.rate;
            }
        } catch (dbError) {
            console.error('Database fallback also failed:', dbError);
        }

        // Last resort: Mock rates for common pairs
        const mockRates: Record<string, number> = {
            'USD-EUR': 0.92,
            'USD-GBP': 0.79,
            'USD-JPY': 149.50,
            'USD-CHF': 0.88,
            'USD-CAD': 1.36,
            'USD-AUD': 1.53,
            'USD-NZD': 1.68,
            'USD-CNY': 7.24,
        };

        const pairKey = `${fromCurrency}-${toCurrency}`;
        return mockRates[pairKey] || 1.0;
    }
};

/**
 * Fetch multiple currency rates at once
 */
export const getMultipleRates = async (
    baseCurrency: string,
    targetCurrencies: string[]
): Promise<{ [key: string]: number }> => {
    const rates: { [key: string]: number } = {};

    // Fetch in parallel for speed
    await Promise.all(
        targetCurrencies.map(async (target) => {
            try {
                rates[target] = await getRealTimeRate(baseCurrency, target);
            } catch (error) {
                console.error(`Failed to fetch rate for ${baseCurrency}/${target}`);
                rates[target] = 1.0; // Fallback
            }
        })
    );

    return rates;
};

/**
 * Get historical data from database
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
 * Calculate 24h change percentage from real data
 */
export const calculate24hChange = async (
    currencyPair: string
): Promise<{ change: number; previousRate: number; currentRate: number }> => {
    try {
        // Get data from last 24 hours
        const data = await getHistoricalDataFromDB(currencyPair, '24h');

        if (data.length < 2) {
            // Not enough data, return 0 change
            return { change: 0, previousRate: 0, currentRate: 0 };
        }

        const oldestPrice = data[0].close;
        const latestPrice = data[data.length - 1].close;

        const change = ((latestPrice - oldestPrice) / oldestPrice) * 100;

        return {
            change: parseFloat(change.toFixed(2)),
            previousRate: oldestPrice,
            currentRate: latestPrice,
        };
    } catch (error) {
        console.error(`Failed to calculate 24h change for ${currencyPair}:`, error);
        return { change: 0, previousRate: 0, currentRate: 0 };
    }
};
