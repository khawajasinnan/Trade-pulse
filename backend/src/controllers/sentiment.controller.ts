import { Request, Response } from 'express';
import { fetchFinancialNews, getNewsFromDB, getSentimentSummary } from '../services/news.service';

/**
 * Get analyzed news with sentiment scores
 */
export const getSentimentNews = async (req: Request, res: Response) => {
    try {
        const { filter, limit } = req.query;

        // Try to fetch fresh news from API first
        let news = [];

        try {
            news = await fetchFinancialNews(
                'forex OR currency OR "exchange rate" OR EUR OR USD OR GBP OR JPY',
                parseInt(limit as string) || 20
            );
        } catch (apiError) {
            console.log('News API failed, fetching from database...');

            // Fallback to database
            const sentimentFilter = filter && filter !== 'all'
                ? (filter.toString().toUpperCase() as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL')
                : undefined;

            news = await getNewsFromDB({
                sentiment: sentimentFilter,
                limit: parseInt(limit as string) || 20,
            });
        }

        // Format response for frontend
        const formattedNews = news.map((article: any) => ({
            id: article.id || article.url,
            title: article.title,
            source: article.source,
            publishedAt: article.publishedAt,
            sentiment: article.sentiment.toLowerCase(),
            score: article.sentimentScore,
            impact: article.currencyPair ? [article.currencyPair] : [],
            summary: article.description || 'No description available',
        }));

        res.json({
            news: formattedNews,
            count: formattedNews.length,
        });
    } catch (error: any) {
        console.error('Error fetching sentiment news:', error);
        res.status(500).json({
            error: 'Failed to fetch news',
            message: error.message,
        });
    }
};

/**
 * Get sentiment summary for a currency pair
 */
export const getCurrencySentiment = async (req: Request, res: Response) => {
    try {
        const { pair } = req.params;

        const summary = await getSentimentSummary(pair);

        res.json({
            currencyPair: pair,
            ...summary,
        });
    } catch (error: any) {
        console.error('Error fetching currency sentiment:', error);
        res.status(500).json({
            error: 'Failed to fetch sentiment',
            message: error.message,
        });
    }
};
