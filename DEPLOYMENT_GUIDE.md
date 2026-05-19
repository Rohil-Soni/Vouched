# 🚀 Vouched Production Deployment Guide

## Overview
Vouched is now production-ready with full SPA routing support, security headers, and optimized builds. This guide covers deployment to Netlify (frontend) and Heroku (backend).

---

## 📋 Pre-Deployment Checklist

### Frontend
- ✅ Netlify routing configured (_redirects + netlify.toml)
- ✅ Environment variables set up (.env.production)
- ✅ Vite build optimizations enabled
- ✅ Security headers configured
- ✅ Metadata and SEO improved

### Backend
- ✅ CORS properly configured
- ✅ Security headers middleware added
- ✅ Rate limiting configured
- ✅ JWT secrets secured
- ✅ Database migrations ready

---

## 🔐 Environment Variables Setup

### Frontend (.env.production)
```env
VITE_API_URL=https://yourdomain.com/api
```

### Backend (.env.production)
```env
PORT=3000
DATABASE_URL=postgresql://user:password@prod-db:5432/vouched_prod
JWT_SECRET=GENERATE_RANDOM_STRING_32_CHARS_MIN
JWT_REFRESH_SECRET=GENERATE_RANDOM_STRING_32_CHARS_MIN
CLIENT_URL=https://yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-notification-email@gmail.com
SMTP_PASS=your-app-specific-password
NODE_ENV=production
```

**⚠️ Important:** Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 Frontend Deployment (Netlify)

### Option A: Connect via GitHub (Recommended)
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select your GitHub repo (Rohil-Soni/Vouched)
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables:
   - `VITE_API_URL` = your backend API URL
7. Deploy!

### Option B: Manual Deploy
```bash
cd frontend
npm install
npm run build
# Install Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Verify Frontend Deployment
✅ Visit https://yourdomain.com/feed (should work, not 404)
✅ Visit https://yourdomain.com/tips/123 (should work, not 404)
✅ Check browser console for API errors
✅ Test OTP flow (should call backend API)

---

## 🛠️ Backend Deployment (Heroku)

### Prerequisites
- Heroku account (heroku.com)
- Heroku CLI installed
- PostgreSQL database (Heroku Postgres or external)

### Step 1: Create Heroku App
```bash
heroku login
heroku create vouched-api
```

### Step 2: Add PostgreSQL Database
```bash
# Option A: Heroku Postgres (built-in)
heroku addons:create heroku-postgresql:hobby-dev -a vouched-api

# Option B: External PostgreSQL
# Get DATABASE_URL from your provider
```

### Step 3: Set Environment Variables
```bash
heroku config:set \
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  JWT_REFRESH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  CLIENT_URL="https://yourdomain.com" \
  SMTP_USER="your-email@gmail.com" \
  SMTP_PASS="your-app-password" \
  NODE_ENV="production" \
  -a vouched-api
```

### Step 4: Deploy Backend
```bash
git subtree push --prefix backend heroku main
# OR if using develop/other branch:
git push heroku yourbranch:main
```

### Step 5: Run Database Migrations
```bash
heroku run "npm run migrate" -a vouched-api
heroku run "npm run seed" -a vouched-api  # Optional: add test data
```

### Verify Backend Deployment
```bash
# Check logs
heroku logs --tail -a vouched-api

# Test API endpoint
curl https://vouched-api.herokuapp.com/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 🔗 Frontend-Backend Connection

### Update Frontend API URL
After backend is deployed, update frontend .env.production:
```env
VITE_API_URL=https://vouched-api.herokuapp.com
```

Then redeploy frontend (Netlify will auto-rebuild if using GitHub integration).

---

## 🔒 Security Checklist

### Backend Security
- [ ] JWT secrets are strong (32+ chars, random)
- [ ] Database credentials in environment variables
- [ ] CORS only allows frontend origin
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS protection headers sent
- [ ] CSRF tokens for state-changing requests

### Frontend Security
- [ ] No API keys in code (use .env)
- [ ] Content Security Policy headers
- [ ] X-Frame-Options set to SAMEORIGIN
- [ ] Sensitive data not logged in console

### Database Security
- [ ] Database backups configured
- [ ] Connection encrypted (SSL/TLS)
- [ ] Strong database password
- [ ] Minimal user permissions

---

## 📊 Monitoring & Maintenance

### Frontend (Netlify)
- Monitor build logs: Dashboard → Deploys
- Check performance: Lighthouse scores
- Set up error alerts

### Backend (Heroku)
```bash
# View logs
heroku logs --tail -a vouched-api

# View metrics
heroku metrics -a vouched-api

# Backup database
heroku pg:backups:capture -a vouched-api

# View backups
heroku pg:backups -a vouched-api
```

---

## 🛠️ Troubleshooting

### Frontend: "Page not found" errors
- ✅ Netlify _redirects file is present in public/
- ✅ netlify.toml has proper redirect rules
- ✅ Build command: `npm run build`
- ✅ Publish directory: `dist`

### Frontend: API calls failing
- Check browser Network tab for failed requests
- Verify VITE_API_URL is correct
- Ensure backend CORS allows frontend origin
- Check backend logs for errors

### Backend: Database connection errors
```bash
# Check DATABASE_URL format
heroku config -a vouched-api

# Connect to database
heroku pg:psql -a vouched-api

# View tables
\dt
```

### Backend: OTP emails not sending
- Verify SMTP credentials
- Check Gmail App Password (not regular password)
- Verify email address has SMTP enabled
- Check backend logs for SMTP errors

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Netlify: "Page not found" on route change | Check _redirects file and netlify.toml |
| API CORS error | Update backend CLIENT_URL env var |
| OTP not sending | Verify SMTP_USER and SMTP_PASS |
| Database migration fails | Run `heroku run "npm run migrate"` |
| High database costs | Upgrade Heroku Postgres plan or use external DB |

---

## 📞 Support

For deployment issues:
1. Check logs: `heroku logs --tail`
2. Review environment variables: `heroku config`
3. Test API manually with curl
4. Check Netlify build logs

---

## 🎉 Deployment Complete!

Once deployed, your Vouched platform is live and ready for users:
- **Frontend**: https://yourdomain.com
- **Backend API**: https://vouched-api.herokuapp.com
- **Admin Dashboard**: https://yourdomain.com/admin (if enabled)

