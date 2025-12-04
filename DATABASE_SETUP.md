# Database Setup Guide for Trade-Pulse

## Quick Setup Options

You have 3 options for the database:

### Option 1: Neon PostgreSQL (Recommended - Free & Easy)

1. **Create Neon Account**:
   - Go to https://neon.tech
   - Sign up for free account
   - Create a new project

2. **Get Connection String**:
   - In Neon dashboard, click "Connection Details"
   - Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

3. **Update .env file**:
   ```bash
   nano .env  # or use your preferred editor
   ```
   
   Replace this line:
   ```
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
   ```
   
   With your Neon connection string.

### Option 2: Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE tradepulse;
CREATE USER tradepulse_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tradepulse TO tradepulse_user;
\q
```

Then update `.env`:
```
DATABASE_URL="postgresql://tradepulse_user:your_password@localhost:5432/tradepulse"
```

### Option 3: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name tradepulse-db \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=tradepulse \
  -p 5432:5432 \
  -d postgres:15

# Update .env
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/tradepulse"
```

## Complete .env Configuration

After setting up your database, edit `/home/sinnan/Desktop/Trade-Pulse/backend/.env`:

```env
# Database (REQUIRED - Use your actual connection string)
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# JWT (REQUIRED - Generate a random secret)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_EXPIRES_IN="7d"

# Admin Configuration (REQUIRED)
ADMIN_EMAIL="admin@tradepulse.com"

# API Keys (Get free keys from these services)
ALPHA_VANTAGE_API_KEY="demo"  # Get free key from https://www.alphavantage.co/support/#api-key
NEWS_API_KEY="demo"  # Get free key from https://newsapi.org/register

# Email Configuration (Optional - for alerts)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@tradepulse.com"

# Server Configuration
PORT="5000"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
LOGIN_RATE_LIMIT="5"
SIGNUP_RATE_LIMIT="3"
API_RATE_LIMIT="100"

# Cache TTL (in seconds)
FOREX_CACHE_TTL="300"
NEWS_CACHE_TTL="3600"

# ML Model Configuration
MODEL_TRAINING_ENABLED="true"
MODEL_RETRAIN_CRON="0 2 * * *"
```

## Quick Start with Demo Keys

For testing, you can use these temporary values:

```bash
# Edit .env file
nano /home/sinnan/Desktop/Trade-Pulse/backend/.env
```

Minimal working configuration:
```env
DATABASE_URL="your-neon-connection-string-here"
JWT_SECRET="trade-pulse-secret-key-change-in-production-min-32-chars"
ADMIN_EMAIL="admin@tradepulse.com"
ALPHA_VANTAGE_API_KEY="demo"
NEWS_API_KEY="demo"
PORT="5000"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

## After Configuring .env

Run these commands:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates database tables)
npm run prisma:migrate

# Seed database (creates test users and currencies)
npm run prisma:seed

# Start backend
npm run dev
```

## Getting API Keys (Free)

### Alpha Vantage (Forex Data)
1. Visit: https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Get free API key (5 calls/minute, 500/day)
4. Add to .env: `ALPHA_VANTAGE_API_KEY="your-key"`

### NewsAPI (Financial News)
1. Visit: https://newsapi.org/register
2. Sign up for free account
3. Get API key (100 requests/day)
4. Add to .env: `NEWS_API_KEY="your-key"`

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
**Solution**: You need to create and configure the .env file (see above)

### Error: "Can't reach database server"
**Solution**: 
- Check your DATABASE_URL is correct
- Verify database is running
- For Neon: Check if project is active
- For local: `sudo systemctl status postgresql`

### Error: "Authentication failed"
**Solution**: Check username and password in DATABASE_URL

### Error: "SSL connection required"
**Solution**: Add `?sslmode=require` to end of DATABASE_URL

## Verification

Test your database connection:

```bash
# Open Prisma Studio (visual database editor)
npm run prisma:studio

# Should open http://localhost:5555
# If you see your tables, database is connected!
```

## Next Steps

Once .env is configured:

1. ✅ Run `npm run prisma:generate`
2. ✅ Run `npm run prisma:migrate`
3. ✅ Run `npm run prisma:seed`
4. ✅ Run `npm run dev`
5. ✅ Test at http://localhost:5000/api/health

---

**Need help?** Check ERROR_FIXES.md or the main README.md
