import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import routes from './routes/index';
import { helmetConfig, corsConfig, sanitizeInput, securityHeaders } from './middleware/security.middleware';
import { scheduleNewsFetch } from './services/news.service';

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

async function startServer() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected');

        // Start scheduled tasks
        if (process.env.NODE_ENV === 'production') {
            scheduleNewsFetch();
            console.log('✅ Scheduled tasks started');
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API URL: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
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
