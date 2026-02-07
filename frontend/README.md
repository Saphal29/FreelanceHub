# FreelanceHub Pro - Frontend

Modern React frontend for FreelanceHub Pro authentication system built with Next.js 14, Tailwind CSS, and shadcn/ui.

## Setup Instructions

### 1. Environment Configuration

1. Copy `.env.local.example` to `.env.local`
2. Update API URL if needed:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The application will start on http://localhost:3000

## Features

- User Registration with role selection (Freelancer/Client)
- Email Verification
- User Login with JWT authentication
- Password Reset functionality
- User Profile Management
- Role-based Dashboard
- Modern, responsive UI with Tailwind CSS
- Form validation with Zod
- Global authentication state management

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-email/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── dashboard/
│   ├── profile/
│   ├── globals.css
│   └── layout.jsx
├── components/
│   └── ui/
├── contexts/
├── lib/
├── .env.local.example
├── package.json
├── tailwind.config.js
└── README.md
```

## Technology Stack

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Forms:** React Hook Form
- **Validation:** Zod
- **HTTP Client:** Axios
- **Icons:** Lucide React