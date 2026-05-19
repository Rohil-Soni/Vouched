# ✅ PRODUCTION DEPLOYMENT CHECKLIST

Complete this checklist before deploying to production.

## 🔒 Security Setup (CRITICAL)

### Secrets & Environment Variables
- [ ] Generate strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Generate strong JWT_REFRESH_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Create `backend/.env.production` with all secrets
- [ ] Create `frontend/.env.production` with API URL
- [ ] **.env.production files are in .gitignore** (NEVER commit secrets!)
- [ ] Gmail App Password created (not regular password)
- [ ] Database password is strong (20+ chars)

### Code Security
- [ ] No API keys or secrets in source code
- [ ] No console.log statements in production build (terser removes them)
- [ ] SQL injection prevention verified (parameterized queries)
- [ ] Input validation on all endpoints
- [ ] CORS configured for production domain only

---

## 📦 Frontend (Netlify) Deployment

### Pre-Build
- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds
- [ ] `dist/` folder has HTML, CSS, JS files
- [ ] No console errors in built app
- [ ] _redirects file exists in `public/`
- [ ] netlify.toml exists in root

### Build Configuration
- [ ] Netlify build command: `npm run build`
- [ ] Netlify publish directory: `dist`
- [ ] Node version: 22 (or compatible)

### Environment Variables (Netlify Dashboard)
- [ ] `VITE_API_URL` = production backend URL

### Deploy Steps
1. [ ] Push code to GitHub
2. [ ] Go to netlify.com → Connect GitHub repo
3. [ ] Set build command: `npm run build`
4. [ ] Set publish directory: `dist`
5. [ ] Add environment variables
6. [ ] Deploy
7. [ ] Wait for build to complete
8. [ ] Test: `https://yourdomain.com/feed` (should work, not 404)

---

## 🛠️ Backend (Heroku) Deployment

### Pre-Deploy
- [ ] `npm install` completes without errors
- [ ] `npm run migrate` works locally
- [ ] Database schema is correct
- [ ] No console errors in local testing

### Create Heroku App
```bash
heroku login
heroku create vouched-api
```
- [ ] App created successfully
- [ ] Heroku domain: vouched-api.herokuapp.com

### Database Setup
```bash
heroku addons:create heroku-postgresql:hobby-dev -a vouched-api
```
- [ ] PostgreSQL database added
- [ ] DATABASE_URL auto-populated by Heroku

### Set Environment Variables
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
- [ ] All variables set
- [ ] DATABASE_URL exists (set by Heroku)
- [ ] Verify with: `heroku config -a vouched-api`

### Run Migrations
```bash
heroku run "npm run migrate" -a vouched-api
```
- [ ] Migrations complete successfully
- [ ] Tables created in database

### Deploy Backend
```bash
git subtree push --prefix backend heroku main
```
- [ ] Deployment succeeds
- [ ] No build errors
- [ ] Check logs: `heroku logs --tail -a vouched-api`

### Seed Database (Optional)
```bash
heroku run "npm run seed" -a vouched-api
```
- [ ] Test data loaded successfully (for testing)

---

## 🧪 Testing Checklist

### Frontend Tests
- [ ] Visit `https://yourdomain.com` - loads without errors
- [ ] Click "Submit Tip" - navigates correctly
- [ ] Try signup/login - works end-to-end
- [ ] OTP email arrives within 1 minute
- [ ] Login succeeds and redirects to /feed
- [ ] Feed loads with tips
- [ ] Click on tip - detail page loads
- [ ] Mobile responsive - works on phone (375px width)
- [ ] No console errors (check DevTools)

### Backend Tests
```bash
# Test API is running
curl https://vouched-api.herokuapp.com/

# Test endpoints
curl https://vouched-api.herokuapp.com/tips
curl -X POST https://vouched-api.herokuapp.com/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu"}'
```
- [ ] Health check endpoint responds
- [ ] API endpoints return correct data
- [ ] CORS headers present in responses
- [ ] No errors in Heroku logs

### API Connection Tests
- [ ] Frontend successfully calls `/auth/verify-email`
- [ ] OTP is logged in backend (check `heroku logs`)
- [ ] Frontend can call `/tips` successfully
- [ ] User can login and get JWT token
- [ ] Protected endpoints require valid token

### Email Tests
- [ ] OTP emails arrive from correct sender
- [ ] OTP emails have correct format
- [ ] OTP code is correct (check backend logs vs email)
- [ ] OTP expires after 10 minutes

---

## 🔐 Security Verification

### CORS Security
- [ ] Backend only allows frontend domain: https://yourdomain.com
- [ ] Credentials header present in responses
- [ ] Other origins get 403 Forbidden

### Password Security
- [ ] Database password not in code
- [ ] JWT secrets not in code
- [ ] SMTP password not in code

### Data Security
- [ ] Passwords hashed with bcryptjs
- [ ] Sensitive data (passwords, OTP) not in API responses
- [ ] No SQL injection vulnerabilities
- [ ] XSS protection headers present

### HTTPS
- [ ] Frontend uses HTTPS: https://yourdomain.com ✅
- [ ] Backend uses HTTPS: https://vouched-api.herokuapp.com ✅
- [ ] No mixed content warnings

---

## 📊 Performance Verification

### Frontend Performance
- [ ] Build size < 500KB (check `dist/` size)
- [ ] Lighthouse score > 80
- [ ] Page load time < 3 seconds
- [ ] No unused dependencies

### Backend Performance
- [ ] API response time < 200ms
- [ ] Database queries optimized
- [ ] CPU usage < 50% under normal load
- [ ] Memory usage < 300MB

---

## 📝 Documentation Complete

- [ ] DEPLOYMENT_GUIDE.md exists and is accurate
- [ ] TROUBLESHOOTING.md covers common issues
- [ ] PRODUCTION_CHECKLIST.md (this file) completed
- [ ] README.md updated with production URLs
- [ ] API documentation accessible

---

## 🚀 Final Steps

### Before Going Live
- [ ] All checkboxes above are checked
- [ ] Team reviewed deployment plan
- [ ] Rollback plan documented
- [ ] Support contact information shared

### Deployment Day
```bash
# 1. Final verification
npm run build
heroku logs --tail -a vouched-api

# 2. Deploy frontend (GitHub integration auto-deploys)
git push origin main

# 3. Deploy backend
git push heroku main

# 4. Run migrations
heroku run "npm run migrate" -a vouched-api

# 5. Verify everything works
curl https://yourdomain.com/
curl https://vouched-api.herokuapp.com/
```

### Post-Deployment
- [ ] Monitor logs for errors: `heroku logs --tail`
- [ ] Test user signup/login flows
- [ ] Verify OTP emails send
- [ ] Check performance metrics
- [ ] Collect user feedback

---

## 📞 Emergency Contacts

**Frontend (Netlify):**
- Dashboard: https://app.netlify.com
- Logs: Go to Deploys → recent deploy → View logs
- Rollback: Go to Deploys → Deploy logs → Redeploy

**Backend (Heroku):**
```bash
heroku logs --tail -a vouched-api
heroku restart -a vouched-api
```

**Database Issues:**
```bash
heroku pg:psql -a vouched-api
\dt  # List tables
```

---

## ✅ Sign-Off

- [ ] All items verified
- [ ] Ready for production deployment
- [ ] Deployment date: ________________
- [ ] Deployed by: ________________

**Success!** 🎉

Your Vouched platform is now live and ready for users!

