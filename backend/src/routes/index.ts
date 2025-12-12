import { Router, Response } from 'express';
import * as authController from '../controllers/auth.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import * as portfolioController from '../controllers/portfolio.controller';
import * as alertsController from '../controllers/alerts.controller';
import * as adminController from '../controllers/admin.controller';
import { requireAuth, requireAdmin, requireTrader, AuthRequest } from '../middleware/auth.middleware';
import { loginRateLimiter, signupRateLimiter, apiRateLimiter } from '../middleware/rate-limiter.middleware';
import { validate } from '../middleware/validation.middleware';
import * as schemas from '../middleware/validation.middleware';
import { PrismaClient } from '@prisma/client';
import { getRealTimeRate, getHistoricalDataFromDB } from '../services/forex.service';
import { fetchFinancialNews, getNewsFromDB } from '../services/news.service';

const router = Router();
const prisma = new PrismaClient();

// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// ========== AUTH ROUTES ==========
router.post('/auth/signup', signupRateLimiter, validate(schemas.signupSchema), authController.signup);
router.post('/auth/login', loginRateLimiter, validate(schemas.loginSchema), authController.login);
router.post('/auth/logout', requireAuth, authController.logout);
router.get('/auth/me', requireAuth, authController.getCurrentUser);
router.post('/auth/change-password', requireAuth, authController.changePassword);

// ========== DASHBOARD ROUTES ==========
router.get('/dashboard', apiRateLimiter, dashboardController.getDashboardData);
router.get('/dashboard/stats', apiRateLimiter, dashboardController.getMarketStatsEndpoint);
router.get('/dashboard/heatmap', apiRateLimiter, dashboardController.getHeatmapData);

// ========== CURRENCY CONVERTER ==========
router.get('/converter', apiRateLimiter, async (req, res) => {
    try {
        const { from, to, amount } = req.query;

        if (!from || !to || !amount) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const rate = await getRealTimeRate(from as string, to as string);
        const result = parseFloat(amount as string) * rate;

        return res.json({
            from,
            to,
            amount: parseFloat(amount as string),
            rate,
            result,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Converter error:', error);
        return res.status(500).json({ error: 'Conversion failed' });
    }
});

// ========== HISTORICAL DATA ==========
router.get('/historical/:currencyPair', apiRateLimiter, async (req, res) => {
    try {
        const { currencyPair } = req.params;
        const period = (req.query.period as '24h' | '1w' | '6m' | '1y') || '1w';

        const data = await getHistoricalDataFromDB(currencyPair, period);

        res.json({
            currencyPair,
            period,
            data,
        });
    } catch (error) {
        console.error('Historical data error:', error);
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
});

// ========== PORTFOLIO ROUTES (Trader/Admin Only) ==========
router.get('/portfolio', requireAuth, requireTrader, portfolioController.getPortfolio);
router.post('/portfolio', requireAuth, requireTrader, portfolioController.addToPortfolio);
router.put('/portfolio/:id', requireAuth, requireTrader, validate(schemas.updatePortfolioSchema), portfolioController.updatePortfolioHolding);
router.delete('/portfolio/:id', requireAuth, requireTrader, portfolioController.deletePortfolioHolding);
router.get('/portfolio/analytics', requireAuth, requireTrader, portfolioController.getPortfolioAnalytics);

// ========== EXPORT ROUTES (Trader Only) ==========
import * as exportController from '../controllers/export.controller';
router.get('/export/excel', requireAuth, requireTrader, exportController.exportToExcel);
router.get('/export/pdf', requireAuth, requireTrader, exportController.exportToPDF);

// ========== ALERTS ROUTES ==========
router.get('/alerts', requireAuth, alertsController.getAlerts);
router.post('/alerts', requireAuth, validate(schemas.createAlertSchema), alertsController.createAlert);
router.delete('/alerts/:id', requireAuth, alertsController.deleteAlert);

// ========== NEWS & SENTIMENT ==========
router.get('/news', apiRateLimiter, async (req, res) => {
    try {
        const currencyPair = req.query.currencyPair as string | undefined;
        const sentiment = req.query.sentiment as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | undefined;
        const limit = parseInt(req.query.limit as string) || 20;

        const news = await getNewsFromDB({ currencyPair, sentiment, limit });

        res.json({ news });
    } catch (error) {
        console.error('News error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

router.post('/news/fetch', requireAdmin, async (_req, res) => {
    try {
        const news = await fetchFinancialNews();
        res.json({ message: 'News fetched successfully', count: news.length });
    } catch (error) {
        console.error('Fetch news error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// Sentiment analysis routes
import * as sentimentController from '../controllers/sentiment.controller';
router.get('/sentiment', apiRateLimiter, sentimentController.getSentimentNews);
router.get('/sentiment/:pair', apiRateLimiter, sentimentController.getCurrencySentiment);

// Server-Sent Events endpoint for live rates
router.get('/events', apiRateLimiter, async (req, res: Response) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    // Send a comment to establish the stream
    res.write(': connected\n\n');

    let timer: NodeJS.Timeout | null = null;

    const sendRates = async () => {
        try {
            // Pairs to broadcast
            const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
            const rates: Record<string, number> = {};

            await Promise.all(pairs.map(async (p) => {
                const [from, to] = p.includes('/') ? p.split('/') : p.split('-');
                try {
                    const rate = await getRealTimeRate(from, to);
                    rates[p] = rate;
                } catch (e) {
                    console.error('SSE rate fetch failed for', p, e);
                }
            }));

            const payload = { timestamp: new Date().toISOString(), rates };
            res.write(`event: rates\ndata: ${JSON.stringify(payload)}\n\n`);
        } catch (error) {
            console.error('SSE sendRates error:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ message: String(error) })}\n\n`);
        }
    };

    // Send immediately then poll every 5s
    sendRates();
    timer = setInterval(sendRates, 5000);

    req.on('close', () => {
        if (timer) clearInterval(timer);
        res.end();
    });
});

// ========== PREDICTIONS ROUTES ==========
import { trainAndPredict } from '../services/prediction.service';

router.get('/predictions/:currencyPair', requireAuth, requireTrader, async (req: AuthRequest, res: Response) => {
    try {
        const { currencyPair } = req.params;

        // Get current rate
        const currentRate = await getRealTimeRate(
            currencyPair.split('-')[0],
            currencyPair.split('-')[1]
        );

        // Check for recent cached prediction (within last 12 hours)
        const cachedPrediction = await prisma.prediction.findFirst({
            where: { currencyPair },
            orderBy: { createdAt: 'desc' },
        });

        const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
        const isCacheValid = cachedPrediction &&
            (Date.now() - cachedPrediction.createdAt.getTime() < CACHE_DURATION);

        if (isCacheValid) {
            // Use cached prediction
            const change = ((cachedPrediction.predictedValue - currentRate) / currentRate) * 100;
            let recommendation: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
            if (change > 0.5) recommendation = 'BUY';
            else if (change < -0.5) recommendation = 'SELL';

            return res.json({
                prediction: {
                    currencyPair,
                    predictedValue: cachedPrediction.predictedValue,
                    currentRate,
                    direction: cachedPrediction.direction,
                    confidence: cachedPrediction.confidence,
                    recommendation,
                    cached: true,
                    predictedAt: cachedPrediction.createdAt,
                }
            });
        }

        // No valid cache - train and predict with ML model
        console.log(`Training ML model for ${currencyPair}...`);
        const mlResult = await trainAndPredict(currencyPair);

        // Store new prediction in database
        await prisma.prediction.create({
            data: {
                currencyPair,
                predictedValue: mlResult.predictedValue,
                direction: mlResult.direction,
                confidence: mlResult.confidence,
                modelVersion: '1.0',
            },
        });

        return res.json({
            prediction: {
                currencyPair,
                predictedValue: mlResult.predictedValue,
                currentRate,
                direction: mlResult.direction,
                confidence: mlResult.confidence,
                recommendation: mlResult.recommendation,
                cached: false,
                predictedAt: new Date(),
            }
        });

    } catch (error) {
        console.error('Prediction error:', error);
        return res.status(500).json({ error: 'Failed to fetch predictions' });
    }
});

router.get('/predictions', requireAuth, requireTrader, apiRateLimiter, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const predictions = await prisma.prediction.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        res.json({ predictions });
    } catch (error) {
        console.error('Get predictions error:', error);
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
});

// ========== CURRENCIES ==========
router.get('/currencies', apiRateLimiter, async (_req, res) => {
    try {
        const currencies = await prisma.currency.findMany({
            orderBy: { symbol: 'asc' },
        });

        res.json({ currencies });
    } catch (error) {
        console.error('Get currencies error:', error);
        res.status(500).json({ error: 'Failed to fetch currencies' });
    }
});

// ========== ADMIN ROUTES ==========
router.get('/admin/users', requireAuth, requireAdmin, adminController.getAllUsers);
router.put('/admin/users/:userId/role', requireAuth, requireAdmin, validate(schemas.updateUserRoleSchema), adminController.updateUserRole);
router.put('/admin/users/:userId/ban', requireAuth, requireAdmin, validate(schemas.banUserSchema), adminController.toggleUserBan);
router.get('/admin/failed-logins', requireAuth, requireAdmin, adminController.getFailedLogins);
router.get('/admin/stats', requireAuth, requireAdmin, adminController.getSystemStats);
router.get('/admin/health', requireAuth, requireAdmin, adminController.getAPIHealth);

export default router;
