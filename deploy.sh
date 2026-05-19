#!/bin/bash

# Vouched Production Deployment Script
# This script helps deploy both frontend and backend to production

set -e

echo "🚀 Vouched Production Deployment Helper"
echo "========================================"
echo ""

# Check if environment files exist
if [ ! -f "frontend/.env.production" ]; then
    echo "❌ Error: frontend/.env.production not found"
    echo "   Please create it with VITE_API_URL=your-backend-url"
    exit 1
fi

if [ ! -f "backend/.env.production" ]; then
    echo "❌ Error: backend/.env.production not found"
    echo "   Please create it with production environment variables"
    exit 1
fi

echo "✅ Environment files found"
echo ""

# Display environment variables (masking sensitive info)
echo "Frontend Configuration:"
grep "VITE_API_URL" frontend/.env.production || echo "  ⚠️  VITE_API_URL not set"
echo ""

echo "Backend Configuration:"
echo "  DATABASE_URL: $(echo $( grep "DATABASE_URL" backend/.env.production) | sed 's/password.*/password***/' )"
grep "NODE_ENV" backend/.env.production || echo "  ⚠️  NODE_ENV not set"
echo ""

read -p "Proceed with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

echo ""
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
echo "✅ Frontend build complete"
cd ..

echo ""
echo "🔍 Verifying backend configuration..."
cd backend
npm install
echo "✅ Backend dependencies installed"
cd ..

echo ""
echo "📝 Deployment checklist:"
echo ""
echo "Frontend (Netlify):"
echo "  1. Go to https://app.netlify.com"
echo "  2. Connect your GitHub repo (Rohil-Soni/Vouched)"
echo "  3. Set build command: npm run build"
echo "  4. Set publish directory: dist"
echo "  5. Add environment variables from frontend/.env.production"
echo "  6. Deploy!"
echo ""

echo "Backend (Heroku):"
echo "  1. heroku login"
echo "  2. heroku create vouched-api (if first time)"
echo "  3. heroku addons:create heroku-postgresql:hobby-dev -a vouched-api"
echo "  4. Set environment variables with: heroku config:set KEY=VALUE -a vouched-api"
echo "  5. Deploy with: git push heroku main"
echo ""

echo "✅ Deployment helper complete!"
echo ""
echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
