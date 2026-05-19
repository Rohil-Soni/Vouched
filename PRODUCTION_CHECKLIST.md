# 🔒 Production Security & Readiness Checklist

## Critical Items (Must Complete Before Deployment)

### Database Security
- [ ] Database has strong password (20+ chars, mixed case, numbers, symbols)
- [ ] Database user has minimal necessary permissions
- [ ] Database backups configured and tested
- [ ] Database is on private network (not publicly accessible)
- [ ] SSL/TLS connection enforced

### JWT Security
- [ ] JWT_SECRET is 32+ characters, cryptographically random
- [ ] JWT_REFRESH_SECRET is 32+ characters, cryptographically random
- [ ] Secrets are NOT committed to git
- [ ] Secrets are only in .env.production (not in code)
- [ ] Token expiry times are reasonable (15m access, 30d refresh)

### SMTP/Email Security
- [ ] Using Gmail App Password (not regular password)
- [ ] SMTP credentials are in .env.production only
- [ ] Email sender domain is verified
- [ ] SPF/DKIM records configured (if using custom domain)

### Frontend Security
- [ ] API URL uses HTTPS
- [ ] No API keys or secrets in frontend code
- [ ] Build removes console.log statements (terser drop_console)
- [ ] Security headers configured in netlify.toml
- [ ] X-Frame-Options, CSP, X-XSS-Protection headers set
- [ ] Cache headers configured for assets

### Backend Security
- [ ] CORS allows only production frontend domain
- [ ] Rate limiting enabled (or add express-rate-limit)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using parameterized queries)
- [ ] Error messages don't expose sensitive info
- [ ] Helmet middleware enabled
- [ ] HTTPS enforced (redirect http to https)
- [ ] Health check endpoint secured

### Deployment Platform Security
- [ ] Heroku: 2FA enabled on account
- [ ] Netlify: 2FA enabled on account
- [ ] GitHub: SSH keys used instead of HTTPS
- [ ] GitHub: No secrets in commits
- [ ] GitHub: Branch protection rules enabled

---

## Important Configuration Items

### Environment Variables Checklist
```
Backend .env.production:
✓ PORT (should be 3000 for Heroku)
✓ DATABASE_URL (from Heroku Postgres or external DB)
✓ JWT_SECRET (random 32+ chars)
✓ JWT_REFRESH_SECRET (random 32+ chars)
✓ CLIENT_URL (production frontend URL)
✓ SMTP_HOST (smtp.gmail.com)
✓ SMTP_PORT (587)
✓ SMTP_USER (your notification email)
✓ SMTP_PASS (Gmail app-specific password)
✓ NODE_ENV (production)

Frontend .env.production:
✓ VITE_API_URL (production backend API URL)
```

### Netlify Configuration
✓ _redirects file in public/ directory
✓ netlify.toml with proper build settings
✓ Build command: npm run build
✓ Publish directory: dist
✓ Security headers configured

### Heroku Configuration
✓ Procfile present with web and release processes
✓ heroku.yml or buildpacks configured
✓ PostgreSQL addon added
✓ Environment variables set via Heroku dashboard

---

## Pre-Launch Testing

### Frontend Testing
- [ ] Homepage loads without errors
- [ ] Routing works (/feed, /tips/123, /submit, etc.)
- [ ] API calls succeed
- [ ] OTP email flow works
- [ ] Login/Signup works end-to-end
- [ ] Responsive design on mobile
- [ ] No 404 errors for routes
- [ ] Performance: Lighthouse score > 80

### Backend Testing
- [ ] Health check endpoint responds: GET /
- [ ] Auth endpoints work: POST /auth/verify-email, POST /auth/verify-otp
- [ ] Tips endpoint works: GET /tips
- [ ] User endpoint works: GET /users/profile
- [ ] Database queries execute without errors
- [ ] Emails send successfully
- [ ] JWT tokens validate correctly
- [ ] CORS headers present in responses

### Integration Testing
- [ ] Frontend can reach backend API
- [ ] OTP emails arrive within seconds
- [ ] User data persists correctly
- [ ] Credibility calculations work
- [ ] No sensitive info in API responses

---

## Monitoring & Alerts Setup

### Heroku Monitoring
```bash
heroku logs --tail -a vouched-api  # Real-time logs
heroku metrics -a vouched-api      # CPU/RAM metrics
```

### Netlify Monitoring
- Dashboard → Deploys → Build logs
- Dashboard → Analytics → Performance metrics
- Setup Slack integration for deployment alerts

### Error Tracking (Optional but Recommended)
- Sentry.io for backend error tracking
- Rollbar for frontend error tracking

---

## Post-Deployment Checklist

### Immediately After Deploy
- [ ] Test live site in browser
- [ ] Check console for errors
- [ ] Try login flow
- [ ] Verify OTP emails arrive
- [ ] Check backend logs for errors
- [ ] Confirm database connections work
- [ ] Test on mobile devices

### First 24 Hours
- [ ] Monitor error logs regularly
- [ ] Check CPU/memory usage on Heroku
- [ ] Verify automated backups are working
- [ ] Test all major user flows
- [ ] Check email delivery rates

### First Week
- [ ] Monitor for any issues
- [ ] Collect user feedback
- [ ] Check performance metrics
- [ ] Test recovery/rollback procedures

---

## Emergency Procedures

### Rollback Frontend
```bash
netlify deploy --prod --dir=dist --message "Rollback: [reason]"
```

### Rollback Backend
```bash
git revert [commit-hash]
git push heroku main:main
```

### Database Recovery
```bash
# Create backup
heroku pg:backups:capture -a vouched-api

# Restore from backup
heroku pg:backups:restore [backup-id] -a vouched-api
```

---

## Compliance & Legal

- [ ] Privacy policy accessible at /privacy
- [ ] Terms of service accessible at /terms
- [ ] GDPR compliant (if serving EU users)
- [ ] Data deletion requests can be processed
- [ ] College email verification working

---

## Performance Optimization

### Frontend
- [ ] Code splitting enabled (separate vendor chunk)
- [ ] Console logs removed in production
- [ ] Images optimized
- [ ] CSS/JS minified
- [ ] Asset caching configured

### Backend
- [ ] Database queries optimized (indexes on frequently queried fields)
- [ ] N+1 query problems avoided
- [ ] Connection pooling configured
- [ ] Response compression enabled

---

## Documentation

- [ ] DEPLOYMENT_GUIDE.md completed
- [ ] API documentation accessible
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Runbook for common issues

