#!/bin/bash

echo "🐍 Setting up Python ML Service for Trade-Pulse"
echo "==============================================="
echo ""

cd /home/sinnan/Desktop/Trade-Pulse/ml-service

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

echo ""
echo "🔧 Activating virtual environment and installing packages..."
echo ""

# Activate and install
source venv/bin/activate

echo "📥 Installing Python dependencies (this may take 5-10 minutes)..."
echo ""

pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ Python ML service setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 To use the ML service:"
echo ""
echo "1. Activate the virtual environment:"
echo "   cd /home/sinnan/Desktop/Trade-Pulse/ml-service"
echo "   source venv/bin/activate"
echo ""
echo "2. Test the ML script:"
echo "   python3 ml_prediction.py \"YOUR_DATABASE_URL\" \"USD/EUR\""
echo ""
echo "3. The backend will automatically use this when you call:"
echo "   curl http://localhost:5000/api/predictions/USD/EUR"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 All done! Your ML service is ready to use."
