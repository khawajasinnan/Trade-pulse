import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import routes from './routes/index';
import { blockDbWrites, unblockDbWrites } from './utils/db-utils';
import { helmetConfig, corsConfig, sanitizeInput, securityHeaders } from './middleware/security.middleware';
import writeBlockMiddleware from './middleware/write-block.middleware';
import { scheduleNewsFetch } from './services/news.service';
import { scheduleAlertChecks } from './services/alerts.service';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE ==========

// Security headers
app.use(helmetConfig);
app.use(securityHeaders);

// CORS
app.use(corsConfig);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Global middleware: Block write operations if DB writes are blocked
app.use(writeBlockMiddleware);

// Input sanitization
app.use(sanitizeInput);

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ========== ROUTES ==========

app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'Trade-Pulse API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            dashboard: '/api/dashboard',
            converter: '/api/converter',
            historical: '/api/historical/:currencyPair',
            portfolio: '/api/portfolio',
            alerts: '/api/alerts',
            news: '/api/news',
            predictions: '/api/predictions',
            admin: '/api/admin/*',
        },
    });
});

// ========== ERROR HANDLING ==========

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
});

// ========== SERVER STARTUP ==========

async function retryPrismaConnect(retries = 5, delayMs = 2000) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            await prisma.$connect();
            console.log('✅ Database connected');
            return;
        } catch (err) {
            attempt += 1;
            console.warn(`Prisma connection attempt ${attempt}/${retries} failed:`, (err as any)?.message || err);
            if (attempt >= retries) throw err;
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
}

async function startServer() {
    try {
        // Test database connection with retries
        await retryPrismaConnect(5, 2000);

        // If connected, allow DB writes
        unblockDbWrites();

        // Start scheduled tasks
        if (process.env.NODE_ENV === 'production') {
            scheduleNewsFetch();
            const alertInterval = parseInt(process.env.ALERT_CHECK_INTERVAL_MS || '60000');
            scheduleAlertChecks(alertInterval);
            console.log('✅ Scheduled tasks started');
        }
    } catch (error) {
        console.warn('⚠️ Could not connect to DB at startup. Starting in degraded mode. DB writes will be blocked. Error:', (error as any)?.message || error);
        // Block DB writes to avoid failing operations while DB is down
        blockDbWrites(60 * 60); // 1 hour block

        // Start a background reconnection loop
        let scheduledTasksStarted = false;
        setInterval(async () => {
            try {
                await retryPrismaConnect(3, 2000);
                console.log('✅ Reconnected to DB, enabling DB writes again');
                unblockDbWrites();
                if (!scheduledTasksStarted && process.env.NODE_ENV === 'production') {
                    scheduleNewsFetch();
                    const alertInterval = parseInt(process.env.ALERT_CHECK_INTERVAL_MS || '60000');
                    scheduleAlertChecks(alertInterval);
                    scheduledTasksStarted = true;
                }
            } catch (err) {
                console.warn('Reconnection attempt failed:', (err as any)?.message || err);
            }
        }, 30 * 1000); // try every 30s
    } finally {
        // Start server regardless of DB state to ensure degraded mode
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API URL: http://localhost:${PORT}/api`);
        });
    }
}

// ========== GRACEFUL SHUTDOWN ==========

process.on('SIGINT', async () => {
    console.log('\n⏳ Shutting down gracefully...');
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⏳ Shutting down gracefully...');
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
});

// Start the server
startServer();

export default app;
