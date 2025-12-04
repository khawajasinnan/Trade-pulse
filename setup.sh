#!/bin/bash

echo "🚀 Trade-Pulse Setup Script"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm --version) detected${NC}"
echo ""

# Backend Setup
echo "📦 Setting up Backend..."
echo "------------------------"
cd backend || exit

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your configuration before proceeding.${NC}"
    echo ""
    echo "Required configuration:"
    echo "  - DATABASE_URL (Neon PostgreSQL connection string)"
    echo "  - JWT_SECRET (random secure string)"
    echo "  - ADMIN_EMAIL (your admin email)"
    echo "  - ALPHA_VANTAGE_API_KEY (get from https://www.alphavantage.co/support/#api-key)"
    echo "  - NEWS_API_KEY (get from https://newsapi.org/register)"
    echo ""
    read -p "Press Enter after you've configured .env..."
fi

# Generate Prisma client
echo "Generating Prisma client..."
npm run prisma:generate

# Run migrations
echo "Running database migrations..."
npm run prisma:migrate

# Seed database
echo "Seeding database..."
npm run prisma:seed

echo -e "${GREEN}✓ Backend setup complete!${NC}"
echo ""

# Frontend Setup
cd ../frontend || exit
echo "📦 Setting up Frontend..."
echo "------------------------"

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local file not found. Creating from .env.local.example...${NC}"
    cp .env.local.example .env.local
fi

echo -e "${GREEN}✓ Frontend setup complete!${NC}"
echo ""

# Final instructions
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend (in backend directory):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. Start the frontend (in frontend directory):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000/api"
echo ""
echo "Default credentials:"
echo "   Admin: admin@tradepulse.com / Admin@123"
echo "   Trader: trader@test.com / Trader@123"
echo "   User: user@test.com / User@123"
echo ""
echo -e "${GREEN}Happy trading! 📈${NC}"
