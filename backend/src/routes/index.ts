import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import * as portfolioController from '../controllers/portfolio.controller';
import * as alertsController from '../controllers/alerts.controller';
import * as adminController from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { loginRateLimiter, signupRateLimiter, apiRateLimiter } from '../middleware/rate-limiter.middleware';
import { validate } from '../middleware/validation.middleware';
import * as schemas from '../middleware/validation.middleware';
import { PrismaClient } from '@prisma/client';
import { getRealTimeRate, getHistoricalDataFromDB } from '../services/forex.service';
import { fetchFinancialNews, getNewsFromDB } from '../services/news.service';
import { trainAndPredict, getLatestPrediction } from '../services/prediction.service';

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
router.get('/dashboard/heatmap', apiRateLimiter, dashboardController.getHeatmapData);
router.get('/dashboard/stats', apiRateLimiter, dashboardController.getMarketStats);

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

// ========== PORTFOLIO ROUTES ==========
router.get('/portfolio', requireAuth, portfolioController.getPortfolio);
router.post('/portfolio', requireAuth, validate(schemas.addPortfolioSchema), portfolioController.addToPortfolio);
router.put('/portfolio/:id', requireAuth, validate(schemas.updatePortfolioSchema), portfolioController.updatePortfolioHolding);
router.delete('/portfolio/:id', requireAuth, portfolioController.deletePortfolioHolding);
router.get('/portfolio/analytics', requireAuth, portfolioController.getPortfolioAnalytics);

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

// ========== PREDICTIONS ==========
router.get('/predictions/:currencyPair', apiRateLimiter, async (req, res) => {
    try {
        const { currencyPair } = req.params;

        // Check for existing recent prediction
        const existing = await getLatestPrediction(currencyPair);

        if (existing && existing.isRecent) {
            return res.json({ prediction: existing });
        }

        // Generate new prediction (this may take time)
        const prediction = await trainAndPredict(currencyPair);

        return res.json({ prediction });
    } catch (error) {
        console.error('Prediction error:', error);
        return res.status(500).json({ error: 'Failed to generate prediction' });
    }
});

router.get('/predictions', apiRateLimiter, async (req, res) => {
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
