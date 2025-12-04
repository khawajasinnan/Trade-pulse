#!/bin/bash

echo "🔍 Trade-Pulse Error Checker & Fixer"
echo "====================================="
echo ""

cd /home/sinnan/Desktop/Trade-Pulse

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking for common errors..."
echo ""

# Check 1: Backend tsconfig.json
echo "1️⃣  Checking backend/tsconfig.json..."
if [ -f "backend/tsconfig.json" ]; then
    echo -e "${GREEN}✓${NC} backend/tsconfig.json exists"
else
    echo -e "${RED}✗${NC} backend/tsconfig.json missing"
fi

# Check 2: Frontend tsconfig.json
echo "2️⃣  Checking frontend/tsconfig.json..."
if [ -f "frontend/tsconfig.json" ]; then
    echo -e "${GREEN}✓${NC} frontend/tsconfig.json exists"
else
    echo -e "${RED}✗${NC} frontend/tsconfig.json missing"
fi

# Check 3: Prisma Client
echo "3️⃣  Checking Prisma Client..."
if [ -d "backend/node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✓${NC} Prisma Client generated"
else
    echo -e "${YELLOW}⚠${NC}  Prisma Client not found - running prisma generate..."
    cd backend
    npm run prisma:generate
    cd ..
fi

# Check 4: Node modules
echo "4️⃣  Checking node_modules..."
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${RED}✗${NC} Backend dependencies missing - run: cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${RED}✗${NC} Frontend dependencies missing - run: cd frontend && npm install"
fi

# Check 5: Environment file
echo "5️⃣  Checking .env file..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} backend/.env exists"
    
    # Check if DATABASE_URL is set
    if grep -q "DATABASE_URL=\"postgresql://" backend/.env; then
        echo -e "${GREEN}✓${NC} DATABASE_URL appears to be configured"
    else
        echo -e "${YELLOW}⚠${NC}  DATABASE_URL may not be properly configured"
    fi
else
    echo -e "${RED}✗${NC} backend/.env missing"
fi

# Check 6: Python virtual environment
echo "6️⃣  Checking Python ML service..."
if [ -d "ml-service/venv" ]; then
    echo -e "${GREEN}✓${NC} Python virtual environment exists"
else
    echo -e "${YELLOW}⚠${NC}  Python virtual environment not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 Common Fixes:"
echo ""
echo "If you see TypeScript errors:"
echo "  1. Make sure you ran 'npm install' in both backend and frontend"
echo "  2. Restart your IDE/editor"
echo "  3. Run: cd backend && npm run prisma:generate"
echo ""
echo "If you see Prisma errors:"
echo "  1. Check backend/.env has correct DATABASE_URL"
echo "  2. Run: cd backend && npm run prisma:generate"
echo "  3. Run: cd backend && npm run prisma:migrate"
echo ""
echo "If you see import errors:"
echo "  1. Close and reopen your IDE"
echo "  2. TypeScript may need to restart"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Error check complete!"
