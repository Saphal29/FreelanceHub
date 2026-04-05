# FreelanceHub - System Architecture (Local Development)

## Overview
FreelanceHub is a freelance marketplace platform connecting clients with freelancers for project-based work.

## Local Development Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LOCALHOST (Your Computer)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (Port 3000)                     │  │
│  │              http://localhost:3000                            │  │
│  │                                                                │  │
│  │  - React Components (Tailwind CSS)                            │  │
│  │  - Client/Freelancer Dashboards                               │  │
│  │  - Real-time Chat & Video Calls                               │  │
│  │  - Project Management UI                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↕ HTTP                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Node.js + Express Backend (Port 5000)               │  │
│  │              http://localhost:5000                            │  │
│  │                                                                │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │  │
│  │  │   REST API     │  │  Socket.IO     │  │  WebRTC        │ │  │
│  │  │   Endpoints    │  │  (Chat)        │  │  Signaling     │ │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │              Middleware Layer                           │  │  │
│  │  │  • JWT Authentication                                   │  │  │
│  │  │  • Role-based Authorization (Client/Freelancer/Admin)  │  │  │
│  │  │  • Rate Limiting                                        │  │  │
│  │  │  • CORS (localhost:3000)                               │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │              Business Logic Services                    │  │  │
│  │  │  • Auth Service (OTP Verification)                      │  │  │
│  │  │  • Project Service                                      │  │  │
│  │  │  • Proposal Service                                     │  │  │
│  │  │  • Contract Service                                     │  │  │
│  │  │  • Payment Service                                      │  │  │
│  │  │  • Chat Service                                         │  │  │
│  │  │  • Dispute Service                                      │  │  │
│  │  │  • File Service                                         │  │  │
│  │  │  • Email Service                                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↕                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database (Port 5432)                  │  │
│  │              postgresql://localhost:5432                      │  │
│  │                                                                │  │
│  │  Tables:                                                       │  │
│  │  • users, freelancer_profiles, client_profiles                │  │
│  │  • projects, proposals, contracts                             │  │
│  │  • milestones, payments                                       │  │
│  │  • conversations, messages                                    │  │
│  │  • time_entries, scheduled_calls                              │  │
│  │  • disputes, dispute_messages                                 │  │
│  │  • reviews, notifications, files                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              File Storage (Local Disk)                        │  │
│  │              C:\Blank\FreelanceHub\backend\uploads\           │  │
│  │                                                                │  │
│  │  • avatars/          - Profile pictures                       │  │
│  │  • chat/             - Chat attachments                       │  │
│  │  • contract/         - Contract documents                     │  │
│  │  • dispute-evidence/ - Dispute files                          │  │
│  │  • milestone-attachment/ - Milestone files                    │  │
│  │  • other/            - Other uploads                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Email Service (Google Apps Script)                  │  │
│  │           https://script.google.com/...                       │  │
│  │                                                                │  │
│  │  • OTP Verification Emails                                    │  │
│  │  • Welcome Emails                                             │  │
│  │  • Password Reset Emails                                      │  │
│  │  • Notification Emails                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (Port 3000)
- **Framework**: Next.js 16.2.1 (React)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Real-time**: Socket.IO Client
- **Video**: WebRTC
- **HTTP Client**: Axios
- **Dev Server**: Next.js Dev Server

### Backend (Port 5000)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **Email**: Nodemailer + Google Apps Script
- **Logging**: Winston
- **Dev Server**: Nodemon

### Database (Port 5432)
- **Database**: PostgreSQL (Local Installation)
- **Connection**: postgresql://localhost:5432/freelancehub
- **Migrations**: Custom SQL migration scripts

### Security
- **Authentication**: JWT tokens
- **Authorization**: Role-based (CLIENT, FREELANCER, ADMIN)
- **Rate Limiting**: Express rate limiter
- **CORS**: Configured for Vercel frontend
- **Password**: bcrypt hashing
- **Email Verification**: OTP-based (6-digit code)

## Key Features

### User Management
- Registration with OTP email verification
- Login with JWT authentication
- Password reset with email token
- Role-based access (Client/Freelancer/Admin)
- Profile management with avatar upload

### Project Workflow
1. **Client** posts a project
2. **Freelancers** submit proposals
3. **Client** accepts proposal → Contract created
4. **Freelancer** works on milestones
5. **Client** reviews and approves milestones
6. **Payment** released upon completion
7. Both parties can leave **reviews**

### Communication
- Real-time chat with file attachments
- Video calls with WebRTC
- Scheduled calls
- Email notifications

### Dispute Resolution
- Dispute creation with evidence upload
- Admin mediation
- Conversation threads

### Time Tracking
- Manual time entry
- Project-based tracking
- Milestone association

## Local Development Setup

### Project Structure
```
C:\Blank\FreelanceHub\
├── frontend/                 # Next.js Frontend
│   ├── app/                 # Next.js App Router
│   ├── components/          # React Components
│   ├── contexts/            # React Context
│   ├── lib/                 # Utilities
│   ├── public/              # Static files
│   └── package.json
│
├── backend/                 # Node.js Backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Route Controllers
│   │   ├── middlewares/    # Express Middlewares
│   │   ├── routes/         # API Routes
│   │   ├── services/       # Business Logic
│   │   ├── socket/         # Socket.IO Handlers
│   │   └── utils/          # Utilities
│   ├── migrations/         # Database Migrations
│   ├── uploads/            # File Storage
│   └── package.json
│
└── ARCHITECTURE.md         # This file
```

### Running Locally

1. **Start PostgreSQL Database**
   ```bash
   # Make sure PostgreSQL is running on localhost:5432
   psql -U postgres
   CREATE DATABASE freelancehub;
   ```

2. **Start Backend Server**
   ```bash
   cd C:\Blank\FreelanceHub\backend
   npm install
   npm run migrate    # Run database migrations
   npm run dev        # Start on http://localhost:5000
   ```

3. **Start Frontend Server**
   ```bash
   cd C:\Blank\FreelanceHub\frontend
   npm install
   npm run dev        # Start on http://localhost:3000
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Database: postgresql://localhost:5432/freelancehub

## Data Flow Example: User Registration

```
1. User fills registration form
   ↓
2. Frontend → POST /api/auth/register → Backend
   ↓
3. Backend validates data & creates user in PostgreSQL
   ↓
4. Backend generates 6-digit OTP & stores in database
   ↓
5. Backend → Google Apps Script → Sends OTP email
   ↓
6. User receives email with OTP code
   ↓
7. User enters OTP → POST /api/auth/verify-otp → Backend
   ↓
8. Backend verifies OTP & marks user as verified
   ↓
9. Backend sends welcome email
   ↓
10. User can now login
```

## Environment Variables (Local Development)

### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_NAME="FreelanceHub"
NODE_ENV=development
```

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/freelancehub

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Email Configuration
EMAIL_SERVICE=google-script
EMAIL_FROM_NAME=FreelanceHub
EMAIL_FROM_ADDRESS=noreply@freelancehub.com
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

---

**Last Updated**: April 2026
