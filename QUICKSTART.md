# Trade-Pulse Quick Start Guide

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] npm or yarn package manager
- [ ] Neon PostgreSQL account ([Sign up](https://neon.tech))
- [ ] Alpha Vantage API key ([Get free key](https://www.alphavantage.co/support/#api-key))
- [ ] NewsAPI key ([Get free key](https://newsapi.org/register))

## Quick Setup (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Clone or navigate to the project
cd Trade-Pulse

# Run the setup script
./setup.sh

# Follow the prompts to configure your .env files
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Start backend
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start frontend
npm run dev
```

## Environment Configuration

### Backend (.env)

**Required Variables:**

```env
# Database (Get from Neon dashboard)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Security
JWT_SECRET="generate-a-random-32-character-string"
ADMIN_EMAIL="your-admin@email.com"

# API Keys
ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"
NEWS_API_KEY="your-newsapi-key"

# Optional: Email (for alerts)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

**How to get API keys:**

1. **Alpha Vantage** (Forex data):
   - Visit: https://www.alphavantage.co/support/#api-key
   - Free tier: 5 calls/minute, 500 calls/day

2. **NewsAPI** (Financial news):
   - Visit: https://newsapi.org/register
   - Free tier: 100 requests/day

3. **Neon PostgreSQL**:
   - Visit: https://neon.tech
   - Create new project
   - Copy connection string from dashboard

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs on: http://localhost:3000

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## First Login

After setup, visit http://localhost:3000/login

**Default Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tradepulse.com | Admin@123 |
| Trader | trader@test.com | Trader@123 |
| Basic User | user@test.com | User@123 |

> ⚠️ **Security**: Change these passwords immediately in production!

## Testing the Features

### 1. Dashboard
- Navigate to `/dashboard`
- View live forex rates
- Check top gainers/losers
- See market heatmap

### 2. Currency Converter
- Go to `/converter`
- Select currencies and amount
- Get real-time conversion

### 3. Historical Charts
- Visit `/historical`
- Select currency pair
- Choose time period (24h, 1w, 6m, 1y)
- View candlestick charts

### 4. ML Predictions
- Navigate to `/predictions`
- Select currency pair
- View AI-generated forecast
- See buy/sell/hold recommendation

### 5. News & Sentiment
- Go to `/news`
- View financial news
- Check sentiment analysis (green/red)
- Filter by currency pair

### 6. Portfolio (Requires login)
- Visit `/portfolio`
- Add currencies
- Track profit/loss
- View analytics

### 7. Alerts (Requires login)
- Go to `/alerts`
- Create price alerts
- Set conditions (>, <, >=, <=)
- Receive notifications

### 8. Admin Panel (Admin only)
- Navigate to `/admin`
- Manage users
- View system stats
- Monitor API health

## Troubleshooting

### Database Connection Failed
```bash
# Check if DATABASE_URL is correct
# Verify Neon database is active
# Ensure SSL mode is enabled in connection string
```

### API Rate Limit Errors
```bash
# Alpha Vantage: 5 calls/minute limit
# Solution: Wait 1 minute or upgrade plan
# NewsAPI: 100 requests/day limit
# Solution: Implement better caching
```

### Port Already in Use
```bash
# Backend (5000)
lsof -ti:5000 | xargs kill -9

# Frontend (3000)
lsof -ti:3000 | xargs kill -9
```

### Prisma Migration Failed
```bash
cd backend
npx prisma migrate reset
npm run prisma:migrate
npm run prisma:seed
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Database Management

```bash
# Open Prisma Studio (visual database editor)
cd backend
npm run prisma:studio
```

### API Testing

Use the included endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Get dashboard data
curl http://localhost:5000/api/dashboard

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"User@123"}'
```

### Hot Reload

Both backend and frontend support hot reload:
- Backend: Uses `tsx watch`
- Frontend: Next.js automatic refresh

## Next Steps

1. ✅ Complete setup
2. ✅ Test all features
3. 📝 Customize color palette (if needed)
4. 🔐 Change default passwords
5. 📊 Add more currencies (edit seed.ts)
6. 🚀 Deploy to production

## Production Deployment

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Import project to Vercel
2. Set `NEXT_PUBLIC_API_URL` to backend URL
3. Deploy

### Database (Neon)
- Already configured
- Automatic backups
- Scalable

## Support

- 📖 Full documentation: See README.md
- 🐛 Issues: Create GitHub issue
- 💬 Questions: Check troubleshooting section

---

**Ready to start? Run `./setup.sh` and you'll be trading in minutes! 🚀**
