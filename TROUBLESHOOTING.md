# 🆘 Deployment Troubleshooting Guide

## Netlify "Page Not Found" Error (404 on Routes)

### Problem
When you visit routes like `/feed`, `/tips/123`, `/submit`, you get a 404 "Page not found" error instead of the React app.

### Root Cause
Netlify's default behavior is to serve static files. When a route doesn't match a file, it returns 404. For Single Page Applications (SPAs), we need to redirect all non-file requests to `index.html`.

### Solution ✅

#### Option 1: Using _redirects File (Recommended)
1. Ensure `public/_redirects` exists with content:
```
/*    /index.html   200
```

2. Verify netlify.toml exists with:
```
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

3. In Netlify dashboard:
   - Publish directory must be: `dist`
   - Build command must be: `npm run build`

4. Clear Netlify cache and redeploy:
   - Go to Deploys → Deploy settings
   - Click "Trigger deploy" → "Deploy site"

#### Option 2: Using netlify.toml Only
If `_redirects` doesn't work, ensure netlify.toml in root has:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Option 3: Rebuild & Redeploy
```bash
# Rebuild locally
cd frontend
npm run build

# Force Netlify to rebuild
# In dashboard: Deploys → Clear cache and redeploy
```

### Verification
✅ Visit these URLs (should not show 404):
- https://yourdomain.com/feed
- https://yourdomain.com/tips/123
- https://yourdomain.com/submit
- https://yourdomain.com/archive
- https://yourdomain.com/profile

❌ These should 404 (to verify everything works):
- https://yourdomain.com/this-page-does-not-exist

---

## Common Deployment Errors

### Error: "VITE_API_URL not found"
**Problem:** Environment variables not being read in production

**Solution:**
1. Check `.env.production` exists in frontend root
2. Ensure variable name starts with `VITE_`
3. Rebuild: `npm run build`
4. Check Netlify dashboard → Environment variables
5. Redeploy with "Clear cache and deploy"

**Verify:**
```bash
# Local test
cat .env.production
npm run build
```

---

### Error: "API Connection Failed" (Frontend)
**Problem:** Frontend can't reach backend API

**Solution:**
1. Verify backend is deployed and running:
```bash
curl https://yourdomain.com/  # Should return { message: "Vouched API is running" }
```

2. Check frontend `.env.production`:
```
VITE_API_URL=https://yourdomain.com
```

3. Check backend CORS allows frontend origin:
```javascript
// In backend/src/app.js
const allowedOrigins = ['https://yourdomain.com'];
```

4. Browser console should show API calls:
   - Open DevTools → Network tab
   - Try login, check requests to `https://yourdomain.com/auth/verify-email`

---

### Error: "Database Connection Refused"
**Problem:** Backend can't connect to database

**Solution:**
1. Check DATABASE_URL format is correct:
```
postgresql://username:password@host:5432/dbname
```

2. Verify DATABASE_URL is set on Heroku:
```bash
heroku config -a vouched-api | grep DATABASE_URL
```

3. Test connection:
```bash
heroku pg:psql -a vouched-api
\dt  # List tables
```

4. If fresh database, run migrations:
```bash
heroku run "npm run migrate" -a vouched-api
```

---

### Error: "OTP Not Sending"
**Problem:** Users don't receive OTP emails

**Solution:**
1. Check SMTP credentials in backend `.env.production`:
```
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # NOT regular password!
```

2. Verify Gmail App Password (not regular password):
   - Go to myaccount.google.com/security
   - Enable 2-Factor Authentication
   - Create "App password" for "Mail" on "Windows PC"
   - Use this app password, not your regular password

3. Check backend logs for SMTP errors:
```bash
heroku logs --tail -a vouched-api | grep -i "mail\|smtp\|email"
```

4. Test email sending:
```bash
# Add test endpoint to backend temporarily
POST /test-email
{ "email": "your-email@example.com" }
```

---

### Error: "Infinite Redirect Loop"
**Problem:** Browser keeps redirecting, gets stuck

**Solution:**
1. Clear browser cache:
   - DevTools → Application → Clear storage
   - Close and reopen browser

2. Check for conflicting redirects:
```
# In _redirects or netlify.toml, should NOT have:
/ /index.html  # Too broad, causes loops
```

3. Correct format:
```
/*  /index.html  200  # Catches all routes, serves index.html
```

---

### Error: "TypeError: Cannot read property 'data'"
**Problem:** API response is not JSON

**Solution:**
1. Check backend is returning JSON:
```bash
curl -i https://yourdomain.com/
# Should see: Content-Type: application/json
```

2. Check for errors in backend logs:
```bash
heroku logs --tail -a vouched-api
```

3. Verify API endpoint exists:
```bash
curl https://yourdomain.com/tips
# Should return: {"tips": [...]}
```

---

## Performance Issues

### Issue: Site loads slowly
**Solution:**
1. Check Netlify build size:
   - Dashboard → Deploys → recent deployment
   - Check "dist" size (should be < 500KB)

2. Optimize:
   - `npm run build` and check output
   - Remove unused dependencies
   - Use code splitting

3. Check backend response times:
```bash
heroku metrics -a vouched-api
```

---

### Issue: High database costs
**Solution:**
1. Upgrade Heroku Postgres plan:
```bash
heroku addons:upgrade heroku-postgresql:standard-0 -a vouched-api
```

2. Or use external PostgreSQL:
   - Neon.tech (recommended, free tier available)
   - Railway.app
   - AWS RDS

---

## Testing Checklist

Before going live, verify:

```bash
# Test frontend builds without errors
cd frontend
npm run build
# Check dist/ folder exists and has files

# Test backend in production
heroku logs --tail -a vouched-api

# Test all API endpoints
curl https://yourdomain.com/
curl https://yourdomain.com/tips

# Test frontend routes work
# Visit: /feed, /tips/123, /submit, /archive, /profile

# Test OTP flow
# Try signup with email
# Verify email arrives within 30 seconds

# Test login works
# Login with verified email

# Test credibility system works
# Submit tip, check if credibility updates

# Test on mobile
# Responsive design should work on all screen sizes
```

---

## Getting Help

If issues persist:

1. **Check Logs:**
```bash
# Frontend
# Netlify Dashboard → Deploys → Build log

# Backend
heroku logs --tail -a vouched-api
```

2. **Check Environment Variables:**
```bash
# Backend
heroku config -a vouched-api

# Frontend
# Netlify Dashboard → Site settings → Build & deploy → Environment
```

3. **Run Locally:**
```bash
# Ensure .env files have correct values
cd frontend && npm run dev
cd ../backend && npm run dev
# Test locally before redeploying
```

4. **Common Solutions:**
   - Clear cache and redeploy
   - Check for typos in environment variables
   - Verify all files are committed to git
   - Ensure .env.production is NOT committed (should be in .gitignore)

