# Trade-Pulse Financial Analytics Platform

A full-stack financial analytics web platform with real-time forex data, ML-based predictions, sentiment analysis, and role-based access control.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Features

### Core Functionality
- **Real-Time Forex Dashboard** - Live currency rates with 24h changes and growth indicators
- **Currency Converter** - Real-time currency conversion with historical rates
- **Historical Data Visualization** - Line charts, bar charts, and candlestick charts with multiple time periods
- **ML-Based Forecasting** - LSTM model for price predictions with buy/sell/hold recommendations
- **Sentiment Analysis** - Financial news analysis with positive/negative/neutral classification
- **Virtual Portfolio** - Track holdings with real-time valuation and profit/loss calculations
- **Price Alerts** - Create custom alerts with email notifications
- **Admin Panel** - User management, system monitoring, and API health checks

### Security Features
- JWT authentication with httpOnly cookies
- Bcrypt password hashing (12 rounds)
- Rate limiting (5 login, 3 signup attempts per minute)
- CSRF protection
- XSS prevention with input sanitization
- Helmet security headers
- Role-based authorization (BasicUser, Trader, Admin)
- Failed login tracking and account locking
- Admin-only email restriction

### User Roles
- **BasicUser** - Access to dashboard, converter, historical data, portfolio, and alerts
- **Trader** - All BasicUser features plus advanced analytics and reports
- **Admin** - Full system access including user management and monitoring

## 🛠️ Technology Stack
   Edit `.env` and add your configuration:
   ```env
   SMTP_HOST="your_smtp_host"
   SMTP_PORT=587
   SMTP_USER="your_smtp_user"
   SMTP_PASS="your_smtp_password"
   EMAIL_FROM="no-reply@yourdomain.com"
   ```

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **ML**: TensorFlow.js (LSTM model)
- **APIs**: Alpha Vantage (forex), NewsAPI (financial news)
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: Zod
- **Caching**: node-cache
- **Sentiment**: sentiment library

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS (Emerald-Seashell-Noon palette)
- **Charts**: Chart.js, Recharts, TradingView Lightweight Charts
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📦 Project Structure
### Email & OTP Configuration
The application uses SMTP to send verification emails and alert notifications. Set the following env variables in the `backend/.env` file:

- SMTP_HOST: SMTP server host
- SMTP_PORT: SMTP server port (465 for secure SSL, 587 for TLS)
- SMTP_USER: SMTP username
- SMTP_PASS: SMTP password
- EMAIL_FROM: The from address used for outgoing emails (e.g., no-reply@yourdomain.com)

If no SMTP config is provided, emails will be logged to the server console for debugging.

Run Prisma migrations to include email verification fields before starting the app:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```


```
Trade-Pulse/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── portfolio.controller.ts
│   │   │   ├── alerts.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rate-limiter.middleware.ts
│   │   │   ├── security.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── services/
│   │   │   ├── forex.service.ts
│   │   │   ├── news.service.ts
│   │   │   ├── sentiment.service.ts
│   │   │   └── prediction.service.ts
│   │   ├── routes/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── dashboard/
│   │   │   ├── converter/
│   │   │   ├── historical/
│   │   │   ├── portfolio/
│   │   │   ├── alerts/
│   │   │   ├── news/
│   │   │   ├── predictions/
│   │   │   ├── admin/
│   │   │   └── profile/
│   │   ├── components/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── services/
│   │       └── api.service.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── .env.local.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon account recommended)
- Alpha Vantage API key (free tier: https://www.alphavantage.co/support/#api-key)
- NewsAPI key (free tier: https://newsapi.org/register)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   ADMIN_EMAIL="admin@tradepulse.com"
   ALPHA_VANTAGE_API_KEY="your-alpha-vantage-api-key"
   NEWS_API_KEY="your-newsapi-key"
   ```

4. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Seed the database**
   ```bash
   npm run prisma:seed
   ```

   This creates:
   - Admin user: `admin@tradepulse.com` / `Admin@123`
   - Basic user: `user@test.com` / `User@123`
   - Trader user: `trader@test.com` / `Trader@123`
   - 15 currencies (USD, EUR, GBP, JPY, etc.)

7. **Start development server**
   ```bash
   npm run dev
   ```

   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

## 🔑 Default Credentials

After seeding the database, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tradepulse.com | Admin@123 |
| Trader | trader@test.com | Trader@123 |
| Basic User | user@test.com | User@123 |

> ⚠️ **Important**: Change these passwords in production!

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/heatmap` - Get heatmap data
- `GET /api/dashboard/stats` - Get market statistics

### Currency Converter
- `GET /api/converter?from=USD&to=EUR&amount=100` - Convert currency

### Historical Data
- `GET /api/historical/:currencyPair?period=1w` - Get historical data

### Portfolio
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio` - Add to portfolio
- `PUT /api/portfolio/:id` - Update holding
- `DELETE /api/portfolio/:id` - Remove holding
- `GET /api/portfolio/analytics` - Get analytics

### Alerts
- `GET /api/alerts` - Get user alerts
- `POST /api/alerts` - Create alert
- `DELETE /api/alerts/:id` - Delete alert

### News & Sentiment
- `GET /api/news` - Get financial news
- `POST /api/news/fetch` - Fetch latest news (Admin only)

### Predictions
- `GET /api/predictions/:currencyPair` - Get prediction for pair
- `GET /api/predictions` - Get all recent predictions

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:userId/role` - Update user role
- `PUT /api/admin/users/:userId/ban` - Ban/unban user
- `GET /api/admin/failed-logins` - Get failed login attempts
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/health` - Get API health status

## 🎨 Color Palette

The application uses the **Emerald-Seashell-Noon** Figma palette:

- **Primary (Emerald)**: `#10b981` - Buttons, links, positive indicators
- **Secondary (Seashell)**: `#fff5ee` - Backgrounds, cards
- **Accent (Noon Blue)**: `#0ea5e9` - Highlights, info elements
- **Success (Green)**: `#22c55e` - Positive sentiment, upward trends
- **Danger (Red)**: `#ef4444` - Negative sentiment, downward trends

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Admin Access**: Only one admin email allowed (configured in `.env`)
3. **Password Policy**: Minimum 8 characters with uppercase, lowercase, number, and special character
4. **Rate Limiting**: Automatic protection against brute force attacks
5. **JWT Tokens**: Stored in httpOnly cookies with sameSite=strict
6. **Input Validation**: All inputs sanitized and validated
7. **HTTPS**: Always use HTTPS in production

## 📈 ML Model Training

The LSTM model trains on 90 days of historical data with:
- 7-day sequences for prediction
- 50 LSTM units with dropout (0.2)
- 50 training epochs
- Adam optimizer
- Mean squared error loss

Training is triggered:
- On first prediction request for a currency pair
- When existing prediction is older than 24 hours
- Can be scheduled via cron job (optional)

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Backend (Railway/Render)

1. Create new project on Railway or Render
2. Connect your GitHub repository
3. Set environment variables in dashboard
4. Deploy automatically on push

### Frontend (Vercel)

1. Import project to Vercel
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Deploy

### Database (Neon)

1. Create database at https://neon.tech
2. Copy connection string to `DATABASE_URL`
3. Run migrations: `npm run prisma:migrate`
4. Seed database: `npm run prisma:seed`

## 📝 Environment Variables Reference

### Backend (.env)
```env
DATABASE_URL=              # Neon PostgreSQL connection string
JWT_SECRET=                # Secret key for JWT tokens
JWT_EXPIRES_IN=7d          # Token expiration
ADMIN_EMAIL=               # Single admin email address
ALPHA_VANTAGE_API_KEY=     # Forex data API key
NEWS_API_KEY=              # Financial news API key
SMTP_HOST=                 # Email server for alerts
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOGIN_RATE_LIMIT=5
SIGNUP_RATE_LIMIT=3
API_RATE_LIMIT=100
FOREX_CACHE_TTL=300
NEWS_CACHE_TTL=3600
MODEL_TRAINING_ENABLED=true
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Trade-Pulse
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if Neon database is active
- Ensure SSL mode is enabled

### API Rate Limit Errors
- Alpha Vantage free tier: 5 calls/minute, 500 calls/day
- NewsAPI free tier: 100 requests/day
- Consider upgrading or implementing better caching

### ML Model Training Slow
- First training takes 5-10 minutes
- Subsequent predictions use cached models
- Consider Python microservice for production

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env`
- Check CORS configuration in `security.middleware.ts`

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [TensorFlow.js Guide](https://www.tensorflow.org/js/guide)
- [Alpha Vantage API Docs](https://www.alphavantage.co/documentation/)
- [NewsAPI Documentation](https://newsapi.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@tradepulse.com

---

**Built with ❤️ using Next.js, Express, and TensorFlow.js**
