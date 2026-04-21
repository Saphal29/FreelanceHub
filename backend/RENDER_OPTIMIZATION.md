# Render Optimization Guide

This document outlines the optimizations made to handle Render's free tier limitations, particularly slow cold starts and blocked email ports.

## Changes Made

### 1. Increased Timeouts for Slow Startup

Render's free tier services spin down after inactivity and can take 30-60 seconds to start up. We've increased timeouts to handle this:

#### Server Timeouts (backend/src/server.js)
```javascript
// Request and response timeout: 120 seconds (2 minutes)
app.use((req, res, next) => {
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});
```

#### Database Connection Timeout (backend/src/config/environment.js)
```javascript
database: {
  connectionTimeoutMillis: 10000, // Increased from 2s to 10s
  idleTimeoutMillis: 30000,
  maxConnections: 20
}
```

### 2. Email Service via Google Apps Script

Render's free tier blocks SMTP ports (25, 465, 587). We've implemented Google Apps Script as an alternative:

#### Modified Files:
- `backend/src/services/emailService.js` - Added Google Apps Script support
- `backend/src/config/environment.js` - Added `googleScriptUrl` configuration
- `backend/.env.example` - Updated with Google Apps Script configuration

#### Configuration:
```env
EMAIL_SERVICE=google-script
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
EMAIL_FROM_NAME="FreelanceHub Pro"
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

See `GOOGLE_APPS_SCRIPT_SETUP.md` for detailed setup instructions.

## Render-Specific Configuration

### Environment Variables for Render

Set these in your Render dashboard under **Environment** tab:

```env
# Server
NODE_ENV=production
PORT=5000

# Database (use Render PostgreSQL connection string)
DB_HOST=your-render-postgres-host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_SSL=true
DB_CONNECTION_TIMEOUT=10000

# JWT (generate secure secrets)
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# Email (Google Apps Script)
EMAIL_SERVICE=google-script
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
EMAIL_FROM_NAME=FreelanceHub Pro
EMAIL_FROM_ADDRESS=your-email@gmail.com

# URLs (use your Render URLs)
FRONTEND_URL=https://your-frontend.onrender.com
BACKEND_URL=https://your-backend.onrender.com

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://your-frontend.onrender.com
TRUST_PROXY=true

# Features
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_RATE_LIMITING=true
```

### Build Command
```bash
npm install
```

### Start Command
```bash
npm start
```

## Performance Optimization Tips

### 1. Keep Service Warm

Render free tier services sleep after 15 minutes of inactivity. To keep them warm:

**Option A: External Ping Service**
- Use [UptimeRobot](https://uptimerobot.com/) (free)
- Ping your `/health` endpoint every 5-10 minutes
- Configure: `https://your-backend.onrender.com/health`

**Option B: Cron Job**
- Use [cron-job.org](https://cron-job.org/) (free)
- Schedule: Every 10 minutes
- URL: `https://your-backend.onrender.com/health`

### 2. Database Connection Pooling

Already configured in `backend/src/config/environment.js`:
```javascript
maxConnections: 20,
idleTimeoutMillis: 30000,
connectionTimeoutMillis: 10000
```

### 3. Frontend Timeout Handling

Update your frontend API client to handle slow responses:

```javascript
// frontend/lib/api.js
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 120000, // 120 seconds to match backend
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 4. Loading States

Add loading indicators for operations that might take time:

```javascript
// Example: Registration with loading state
const [isLoading, setIsLoading] = useState(false);
const [loadingMessage, setLoadingMessage] = useState('');

const handleRegister = async () => {
  setIsLoading(true);
  setLoadingMessage('Creating your account...');
  
  try {
    const response = await api.post('/auth/register', data);
    setLoadingMessage('Sending verification email...');
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setIsLoading(false);
    setLoadingMessage('');
  }
};
```

## Cold Start Handling

### Expected Behavior
- First request after sleep: 30-60 seconds
- Subsequent requests: < 1 second

### User Experience Improvements

1. **Show Loading Messages**
```javascript
"Please wait, waking up the server... (this may take up to 60 seconds)"
```

2. **Retry Logic**
```javascript
const apiWithRetry = async (fn, retries = 2) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.code === 'ECONNABORTED') {
      console.log(`Retrying... (${retries} attempts left)`);
      return apiWithRetry(fn, retries - 1);
    }
    throw error;
  }
};
```

3. **Health Check Before Critical Operations**
```javascript
const checkServerHealth = async () => {
  try {
    await api.get('/health', { timeout: 60000 });
    return true;
  } catch (error) {
    return false;
  }
};
```

## Monitoring

### Health Check Endpoint

The backend includes a health check endpoint:

```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "message": "FreelanceHub Authentication Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### Logging

Check Render logs for:
- ✅ Server startup time
- ✅ Database connection status
- ✅ Email service initialization
- ❌ Timeout errors
- ❌ Connection failures

## Upgrading from Free Tier

When ready to upgrade, consider:

1. **Render Starter Plan** ($7/month)
   - No sleep/spin down
   - Faster cold starts
   - More resources

2. **Dedicated Email Service**
   - SendGrid: 12,000 free emails/month
   - Mailgun: 5,000 free emails/month
   - AWS SES: 62,000 free emails/month

3. **Database Upgrade**
   - Render PostgreSQL Starter: $7/month
   - Better performance and reliability

## Troubleshooting

### Issue: "Request timeout"

**Symptoms**: Requests fail after 120 seconds

**Solutions**:
1. Check if service is sleeping (first request after inactivity)
2. Verify database connection is working
3. Check Render logs for errors
4. Increase timeout if needed (not recommended beyond 120s)

### Issue: "Database connection timeout"

**Symptoms**: "Connection timeout" errors in logs

**Solutions**:
1. Verify database credentials in Render environment variables
2. Check if database service is running
3. Increase `DB_CONNECTION_TIMEOUT` if needed
4. Verify SSL settings (`DB_SSL=true` for Render PostgreSQL)

### Issue: "Email not sending"

**Symptoms**: No verification emails received

**Solutions**:
1. Check Google Apps Script setup (see `GOOGLE_APPS_SCRIPT_SETUP.md`)
2. Verify `GOOGLE_SCRIPT_URL` is correct
3. Check Google Apps Script execution logs
4. Verify Gmail account has sending permissions

## Best Practices

1. **Always use environment variables** - Never hardcode sensitive data
2. **Enable SSL for database** - Set `DB_SSL=true` in production
3. **Use strong JWT secrets** - Minimum 32 characters, random
4. **Enable rate limiting** - Protect against abuse
5. **Monitor logs regularly** - Catch issues early
6. **Set up health checks** - Use UptimeRobot or similar
7. **Test cold starts** - Verify timeout handling works

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
