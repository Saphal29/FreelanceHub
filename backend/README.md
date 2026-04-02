# FreelanceHub Pro - Backend

Authentication backend for FreelanceHub Pro platform built with Node.js, Express.js, and PostgreSQL.

## 🚀 Quick Start

### Email Setup (Google Apps Script) ✅
Your backend is configured to use Google Apps Script for email sending (bypasses Render port restrictions).

**Test your email setup:**
```bash
node test-email.js your-email@example.com
```

See [QUICK_START.md](./QUICK_START.md) for complete setup status.

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Setup status and next steps
- **[GOOGLE_APPS_SCRIPT_SETUP.md](./GOOGLE_APPS_SCRIPT_SETUP.md)** - Email configuration guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Deploy to Render
- **[RENDER_OPTIMIZATION.md](./RENDER_OPTIMIZATION.md)** - Performance optimization

## Setup Instructions

### 1. Database Setup with pgAdmin

1. Open pgAdmin 4
2. Right-click on Databases → Create → Database
3. Name: `freelancehub_db`
4. Owner: `postgres`
5. Click Save

### 2. Execute Database Migration

1. In pgAdmin, navigate to: Databases → freelancehub_db
2. Click on "Query Tool" (or press Alt+Shift+Q)
3. Copy and paste the SQL from `migrations/001_create_auth_tables.sql`
4. Click "Execute" (F5) or the play button
5. Verify tables created: Refresh schema → Tables → you should see `users`, `freelancer_profiles`, `client_profiles`

### 3. Environment Configuration

1. Copy `.env.example` to `.env`
2. Update database credentials:
   ```env
   DB_PASSWORD=your_actual_postgres_password
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:5000

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify-email` - Email verification
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset completion
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Health Check
- `GET /health` - Server health status

## Project Structure

```
backend/
├── migrations/
│   └── 001_create_auth_tables.sql
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
├── .env.example
├── package.json
└── README.md
```