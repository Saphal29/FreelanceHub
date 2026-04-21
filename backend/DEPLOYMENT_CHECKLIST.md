# Deployment Checklist for Render

Quick checklist to deploy your FreelanceHub backend to Render with email support.

## ✅ Pre-Deployment Checklist

### 1. Google Apps Script Setup (5 minutes)

- [ ] Go to [script.google.com](https://script.google.com)
- [ ] Create new project named "FreelanceHub Email Service"
- [ ] Copy code from `backend/google-apps-script/Code.gs`
- [ ] Deploy as Web App (Execute as: Me, Access: Anyone)
- [ ] Authorize the script
- [ ] Copy the deployment URL

### 2. Render Account Setup

- [ ] Create account at [render.com](https://render.com)
- [ ] Connect your GitHub repository
- [ ] Create PostgreSQL database (free tier available)
- [ ] Note down database connection details

### 3. Environment Variables

Copy these to Render's Environment tab:

```env
# Required - Update these values
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
EMAIL_FROM_ADDRESS=your-email@gmail.com
JWT_SECRET=generate-a-random-32-char-secret-here
JWT_REFRESH_SECRET=generate-another-random-32-char-secret
DB_HOST=your-render-postgres-host
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
FRONTEND_URL=https://your-frontend.onrender.com
BACKEND_URL=https://your-backend.onrender.com
CORS_ORIGIN=https://your-frontend.onrender.com

# Standard settings (copy as-is)
NODE_ENV=production
PORT=5000
EMAIL_SERVICE=google-script
EMAIL_FROM_NAME=FreelanceHub Pro
DB_PORT=5432
DB_SSL=true
DB_CONNECTION_TIMEOUT=10000
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
TRUST_PROXY=true
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_RATE_LIMITING=true
```

### 4. Render Service Configuration

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Environment:** Node

**Region:** Choose closest to your users

## 🚀 Deployment Steps

### Step 1: Create PostgreSQL Database

1. In Render dashboard, click **New +** → **PostgreSQL**
2. Name: `freelancehub-db`
3. Database: `freelancehub_pro`
4. User: (auto-generated)
5. Region: Same as your backend service
6. Plan: Free
7. Click **Create Database**
8. Copy the **Internal Database URL**

### Step 2: Create Backend Service

1. Click **New +** → **Web Service**
2. Connect your repository
3. Configure:
   - **Name**: `freelancehub-backend`
   - **Environment**: Node
   - **Region**: Same as database
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. Click **Create Web Service**

### Step 3: Add Environment Variables

1. Go to your backend service
2. Click **Environment** tab
3. Add all variables from the checklist above
4. Click **Save Changes**
5. Service will automatically redeploy

### Step 4: Run Database Migrations

**Option A: Using Render Shell**
1. Go to your backend service
2. Click **Shell** tab
3. Run:
```bash
npm run migrate
```

**Option B: Using Local Connection**
1. Copy the External Database URL from Render
2. Run locally:
```bash
psql "your-external-database-url" -f migrations/001_create_auth_tables.sql
# Run other migration files in order
```

### Step 5: Test the Deployment

1. Visit: `https://your-backend.onrender.com/health`
2. Should see:
```json
{
  "status": "OK",
  "message": "FreelanceHub Authentication Server is running",
  "timestamp": "...",
  "version": "1.0.0"
}
```

3. Test registration with a real email address
4. Check if verification email arrives

## 🔧 Post-Deployment Configuration

### Set Up Health Monitoring (Recommended)

**Using UptimeRobot (Free):**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create account
3. Add New Monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://your-backend.onrender.com/health`
   - **Interval**: 5 minutes
4. This keeps your service from sleeping

### Update Frontend Configuration

Update your frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
```

## 🐛 Troubleshooting

### Issue: Service won't start

**Check:**
- [ ] All required environment variables are set
- [ ] Database connection details are correct
- [ ] `DB_SSL=true` is set
- [ ] Check Render logs for specific errors

### Issue: Database connection fails

**Solutions:**
- Use **Internal Database URL** (not External) in Render
- Verify `DB_SSL=true`
- Check database is in same region as backend
- Increase `DB_CONNECTION_TIMEOUT=10000`

### Issue: Emails not sending

**Check:**
- [ ] Google Apps Script is deployed correctly
- [ ] `GOOGLE_SCRIPT_URL` is correct in environment variables
- [ ] Script is authorized (check Google Apps Script executions)
- [ ] `EMAIL_SERVICE=google-script` is set

### Issue: CORS errors

**Solutions:**
- Set `CORS_ORIGIN` to your frontend URL (no trailing slash)
- Set `TRUST_PROXY=true`
- Verify frontend URL is correct

### Issue: First request takes 60+ seconds

**This is normal for free tier!**
- Free tier services sleep after 15 minutes
- First request wakes the service (30-60 seconds)
- Set up UptimeRobot to keep it awake
- Or upgrade to paid plan ($7/month)

## 📊 Monitoring

### Check Logs

In Render dashboard:
1. Go to your service
2. Click **Logs** tab
3. Look for:
   - ✅ Server startup messages
   - ✅ Database connection success
   - ✅ Email service initialization
   - ❌ Any error messages

### Key Log Messages

**Successful startup:**
```
✅ Email service initialized with Google Apps Script
✅ Email server connection verified
✅ Database connection successful
🚀 Server running on port 5000
```

**Email sent successfully:**
```
✅ Email sent via Google Apps Script to user@example.com
```

## 🎯 Performance Tips

1. **Keep service warm**: Use UptimeRobot to ping every 5-10 minutes
2. **Show loading states**: First request after sleep takes 30-60s
3. **Add retry logic**: Handle timeout errors gracefully
4. **Monitor email quota**: Gmail free tier = 100 emails/day

## 📚 Additional Resources

- [GOOGLE_APPS_SCRIPT_SETUP.md](./GOOGLE_APPS_SCRIPT_SETUP.md) - Detailed email setup
- [RENDER_OPTIMIZATION.md](./RENDER_OPTIMIZATION.md) - Performance optimization
- [Render Documentation](https://render.com/docs)
- [Google Apps Script Docs](https://developers.google.com/apps-script)

## 🆘 Need Help?

1. Check the logs in Render dashboard
2. Review the troubleshooting section above
3. Check Google Apps Script execution logs
4. Verify all environment variables are set correctly

## ✨ Success Criteria

Your deployment is successful when:
- [ ] Health endpoint returns 200 OK
- [ ] User registration works
- [ ] Verification emails are received
- [ ] Login works after email verification
- [ ] Password reset emails work
- [ ] No errors in Render logs

---

**Estimated Setup Time**: 15-20 minutes

**Cost**: $0 (using free tiers)

**Next Steps**: Deploy frontend to Render or Vercel
