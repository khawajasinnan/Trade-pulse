import axios from 'axios';
import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';
import { analyzeSentiment } from './sentiment.service';

const prisma = new PrismaClient();

const cache = new NodeCache({
    stdTTL: parseInt(process.env.NEWS_CACHE_TTL || '3600'), // 1 hour default
    checkperiod: 300,
});

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';



/**
 * Fetch financial news from NewsAPI
 */
export const fetchFinancialNews = async (
    query: string = 'forex OR currency OR "exchange rate"',
    pageSize: number = 20
): Promise<any[]> => {
    const cacheKey = `news_${query}_${pageSize}`;

    // Check cache
    const cachedNews = cache.get<any[]>(cacheKey);
    if (cachedNews) {
        return cachedNews;
    }

    try {
        const response = await axios.get(NEWS_API_URL, {
            params: {
                q: query,
                language: 'en',
                sortBy: 'publishedAt',
                pageSize,
                apiKey: NEWS_API_KEY,
            },
            timeout: 10000,
        });

        if (!response.data.articles) {
            throw new Error('Invalid news API response');
        }

        const articles = response.data.articles;

        // Process and store articles
        const processedArticles: any[] = [];

        for (const article of articles) {
            // Analyze sentiment (async)
            const sentimentResult = await analyzeSentiment(
                `${article.title} ${article.description || ''}`
            );

            // Extract currency pairs mentioned
            const currencyPair = extractCurrencyPair(
                `${article.title} ${article.description || ''}`
            );

            const newsData = {
                title: article.title,
                description: article.description || '',
                sentiment: sentimentResult.sentiment,
                sentimentScore: sentimentResult.score,
                currencyPair,
                source: article.source?.name || 'Unknown',
                url: article.url,
                publishedAt: new Date(article.publishedAt),
            };

            processedArticles.push(newsData);

            // Store in database
            try {
                await prisma.news.create({
                    data: newsData,
                });
            } catch (error) {
                // Ignore duplicate errors
                console.error('Error storing news:', error);
            }
        }

        // Cache the result
        cache.set(cacheKey, processedArticles);

        return processedArticles;
    } catch (error) {
        console.error('Error fetching news:', error);

        // Fallback to database
        const dbNews = await prisma.news.findMany({
            orderBy: { publishedAt: 'desc' },
            take: pageSize,
        });

        if (dbNews.length > 0) {
            return dbNews;
        }

        throw new Error('Failed to fetch news');
    }
};

/**
 * Get news from database with filters
 */
export const getNewsFromDB = async (filters: {
    currencyPair?: string;
    sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    limit?: number;
}): Promise<any[]> => {
    const { currencyPair, sentiment, limit = 20 } = filters;

    const where: any = {};

    if (currencyPair) {
        where.currencyPair = currencyPair;
    }

    if (sentiment) {
        where.sentiment = sentiment;
    }

    const news = await prisma.news.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
    });

    return news;
};

/**
 * Extract currency pair from text
 */
function extractCurrencyPair(text: string): string | null {
    const currencies = [
        'USD',
        'EUR',
        'GBP',
        'JPY',
        'CHF',
        'CAD',
        'AUD',
        'NZD',
        'PKR',
        'INR',
        'CNY',
    ];

    const upperText = text.toUpperCase();

    // Look for explicit pairs like "USD/EUR" or "USD-EUR"
    const pairRegex = /([A-Z]{3})[\/\-]([A-Z]{3})/g;
    const match = pairRegex.exec(upperText);

    if (match && currencies.includes(match[1]) && currencies.includes(match[2])) {
        return `${match[1]}/${match[2]}`;
    }

    // Look for mentions of two currencies
    const mentionedCurrencies: string[] = [];

    for (const currency of currencies) {
        if (upperText.includes(currency)) {
            mentionedCurrencies.push(currency);
        }
    }

    if (mentionedCurrencies.length >= 2) {
        return `${mentionedCurrencies[0]}/${mentionedCurrencies[1]}`;
    }

    // Default to USD if only one currency mentioned
    if (mentionedCurrencies.length === 1 && mentionedCurrencies[0] !== 'USD') {
        return `USD/${mentionedCurrencies[0]}`;
    }

    return null;
}

/**
 * Get sentiment summary for a currency pair
 */
export const getSentimentSummary = async (
    currencyPair: string
): Promise<{
    positive: number;
    negative: number;
    neutral: number;
    averageScore: number;
}> => {
    const news = await prisma.news.findMany({
        where: { currencyPair },
        orderBy: { publishedAt: 'desc' },
        take: 50,
    });

    const summary = {
        positive: 0,
        negative: 0,
        neutral: 0,
        averageScore: 0,
    };

    if (news.length === 0) {
        return summary;
    }

    let totalScore = 0;

    for (const article of news) {
        totalScore += article.sentimentScore;

        if (article.sentiment === 'POSITIVE') {
            summary.positive++;
        } else if (article.sentiment === 'NEGATIVE') {
            summary.negative++;
        } else {
            summary.neutral++;
        }
    }

    summary.averageScore = totalScore / news.length;

    return summary;
};

/**
 * Schedule periodic news fetching
 */
export const scheduleNewsFetch = () => {
    // Fetch news every hour
    setInterval(
        async () => {
            try {
                console.log('Fetching latest financial news...');
                await fetchFinancialNews();
                console.log('News fetch completed');
            } catch (error) {
                console.error('Scheduled news fetch failed:', error);
            }
        },
        60 * 60 * 1000
    ); // 1 hour

    // Initial fetch
    fetchFinancialNews().catch(console.error);
};
