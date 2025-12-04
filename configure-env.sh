#!/bin/bash

echo "🔧 Trade-Pulse Environment Configuration Helper"
echo "================================================"
echo ""

ENV_FILE="/home/sinnan/Desktop/Trade-Pulse/backend/.env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found. Creating from .env.example..."
    cp /home/sinnan/Desktop/Trade-Pulse/backend/.env.example "$ENV_FILE"
fi

echo "📝 Current .env file location: $ENV_FILE"
echo ""
echo "You need to configure the following REQUIRED variables:"
echo ""
echo "1. DATABASE_URL - Your PostgreSQL connection string"
echo "   Options:"
echo "   a) Neon (Recommended): https://neon.tech (free)"
echo "   b) Local PostgreSQL"
echo "   c) Docker PostgreSQL"
echo ""
echo "2. JWT_SECRET - A random secret key (min 32 characters)"
echo ""
echo "3. ALPHA_VANTAGE_API_KEY - Get free key from:"
echo "   https://www.alphavantage.co/support/#api-key"
echo ""
echo "4. NEWS_API_KEY - Get free key from:"
echo "   https://newsapi.org/register"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 For detailed instructions, see: DATABASE_SETUP.md"
echo ""
echo "🚀 Quick Setup Options:"
echo ""
echo "Option 1: Use Neon PostgreSQL (Easiest)"
echo "  1. Go to https://neon.tech and create free account"
echo "  2. Create new project"
echo "  3. Copy connection string"
echo "  4. Edit .env: nano $ENV_FILE"
echo "  5. Paste connection string in DATABASE_URL"
echo ""
echo "Option 2: Use Local PostgreSQL"
echo "  1. Install: sudo apt install postgresql"
echo "  2. Create database: sudo -u postgres createdb tradepulse"
echo "  3. Edit .env with: postgresql://postgres:password@localhost:5432/tradepulse"
echo ""
echo "Option 3: Use Docker"
echo "  1. Run: docker run --name tradepulse-db -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:15"
echo "  2. Edit .env with: postgresql://postgres:secret@localhost:5432/postgres"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Press Enter to open .env file for editing..."

# Open .env in default editor
if command -v nano &> /dev/null; then
    nano "$ENV_FILE"
elif command -v vim &> /dev/null; then
    vim "$ENV_FILE"
elif command -v code &> /dev/null; then
    code "$ENV_FILE"
else
    echo "Please edit $ENV_FILE manually"
fi

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Next steps:"
echo "  cd /home/sinnan/Desktop/Trade-Pulse/backend"
echo "  npm run prisma:generate"
echo "  npm run prisma:migrate"
echo "  npm run prisma:seed"
echo "  npm run dev"
