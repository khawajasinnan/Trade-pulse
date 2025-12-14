# Trade-Pulse - Quick Reference Guide

## 🚀 Current Status

✅ **Backend**: Running on http://localhost:5000
✅ **Database**: Connected and seeded with test data
✅ **Python ML**: Installing dependencies (in progress)
⏳ **Frontend**: Ready to start

## 📝 Test Credentials

```
Admin:  admin@tradepulse.com / Admin@123
Trader: trader@test.com / Trader@123
User:   user@test.com / User@123
```

## 🔧 Quick Commands

### Backend
```bash
cd backend
npm run dev          # Start server
npm run prisma:studio  # View database
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start frontend (http://localhost:3000)
```

### Python ML Service
```bash
cd ml-service
./setup-venv.sh .venv
source .venv/bin/activate  # Activate virtual environment
python3 ml_prediction.py "DATABASE_URL" "USD/EUR"  # Test prediction
```

## 📊 API Endpoints

### Test Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Dashboard data
curl http://localhost:5000/api/dashboard

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"User@123"}'
```

### Main Features
- `/api/auth/*` - Authentication
- `/api/dashboard` - Live forex rates
- `/api/converter` - Currency conversion
- `/api/historical/:pair` - Historical data
- `/api/portfolio` - Portfolio management
- `/api/alerts` - Price alerts
- `/api/news` - Financial news with sentiment
- `/api/predictions/:pair` - ML predictions
- `/api/admin/*` - Admin panel (Admin only)

## 🎯 Next Steps

1. **Wait for Python ML installation to complete** (currently running)
2. **Start frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Open browser**: http://localhost:3000
4. **Login** with test credentials
5. **Test features**:
   - Dashboard with live rates
   - Currency converter
   - Portfolio management
   - ML predictions (after Python setup completes)

## 📁 Project Structure

```
Trade-Pulse/
├── backend/          ✅ Running
│   ├── .env         ✅ Configured
│   └── node_modules ✅ Installed
├── ml-service/      ⏳ Installing
│   └── venv/        ⏳ In progress
└── frontend/        ⏳ Ready to start
```

## 🐛 Troubleshooting

### Backend Issues
- **Port in use**: Change PORT in `.env`
- **Database error**: Check DATABASE_URL in `.env`

### Python ML Issues
- **Installation slow**: TensorFlow is 620MB, takes 5-10 minutes
- **Import errors**: Make sure venv is activated: `source ml-service/venv/bin/activate`

### Frontend Issues
- **Module not found**: Run `npm install` in frontend directory
- **API errors**: Make sure backend is running on port 5000

## 📖 Documentation

- `README.md` - Complete documentation
- `DATABASE_SETUP.md` - Database configuration guide
- `ERROR_FIXES.md` - Error troubleshooting
- `QUICKSTART.md` - Quick start guide

## 🎉 What's Working

- ✅ Complete backend API
- ✅ Database with test data
- ✅ Authentication system
- ✅ Security middleware
- ✅ Forex API integration
- ✅ News API integration
- ✅ Sentiment analysis
- ✅ Homepage and Dashboard pages
- ⏳ Python ML predictions (installing)

## ⚡ Performance Tips

1. **First ML prediction**: Takes 5-10 minutes (model training)
2. **Cached predictions**: Instant (< 1 second)
3. **Dashboard auto-refresh**: Every 30 seconds
4. **API caching**: Forex data cached for 5 minutes

---

**Current Time**: The Python ML dependencies are installing (TensorFlow 620MB download)
**Estimated Time**: 5-10 minutes depending on internet speed
**Next**: Once complete, you can test ML predictions!
