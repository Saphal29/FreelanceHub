# FreelanceHub - Freelance Marketplace Platform

A modern, full-stack freelance marketplace platform built with Next.js and Node.js, featuring real-time chat, video meetings, time tracking, and comprehensive project management.

## 🚀 Features

### For Clients
- **Browse Freelancers**: Search and filter talented professionals by skills, budget, and availability
- **Post Projects**: Create detailed project listings with requirements and budgets
- **Hire & Manage**: Track project progress, communicate with freelancers, and manage payments
- **Real-time Chat**: Instant messaging with freelancers
- **Video Meetings**: Built-in video conferencing for consultations

### For Freelancers
- **Find Work**: Browse and apply to projects matching your skills
- **Portfolio Management**: Showcase your work and expertise
- **Time Tracking**: Track billable hours with integrated timer
- **Project Dashboard**: Manage multiple projects with progress tracking
- **Earnings Overview**: Monitor income and payment history

### Core Features
- **User Authentication**: Secure JWT-based authentication with email verification
- **Role-based Access**: Separate dashboards for clients, freelancers, and admins
- **Real-time Messaging**: Chat system with online status indicators
- **Video Conferencing**: Integrated video meeting platform
- **Time Tracking**: Built-in timer with project-based tracking
- **Responsive Design**: Mobile-first design with smooth animations

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript/JSX
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Resend API
- **Security**: bcrypt, helmet, rate limiting

## 📁 Project Structure

```
FreelanceHub/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages
│   │   ├── (auth)/         # Authentication pages
│   │   ├── chat/           # Chat interface
│   │   ├── dashboard/      # Client dashboard
│   │   ├── freelancer/     # Freelancer dashboard
│   │   ├── profile/        # User profile
│   │   ├── projects/       # Project management
│   │   ├── time-tracking/  # Time tracking
│   │   └── video-meeting/  # Video conferencing
│   ├── components/         # Reusable components
│   │   ├── cards/         # Card components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # UI primitives
│   ├── contexts/          # React contexts
│   ├── lib/               # Utilities and API client
│   └── public/            # Static assets
│
├── backend/                # Node.js backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middlewares/   # Express middlewares
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── migrations/        # Database migrations
│
└── .kiro/                 # Kiro AI specs and configs
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Resend API key (for emails)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/freelancehub.git
cd freelancehub
```

2. **Install dependencies**

Frontend:
```bash
cd frontend
npm install
```

Backend:
```bash
cd backend
npm install
```

3. **Set up environment variables**

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/freelancehub

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. **Set up the database**

Run migrations:
```bash
cd backend
npm run migrate
```

5. **Start the development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout user

## 🎨 Design System

### Colors
- **Primary**: Black (#000000)
- **Accent**: Gold/Amber (#F59E0B)
- **Background**: White (#FFFFFF)
- **Secondary**: Light Gray (#FAFAFA)

### Typography
- **Display Font**: System font stack
- **Body Font**: System font stack

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 🧪 Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend
npm test
```

## 📦 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

### Backend (Your choice of platform)
- Heroku
- Railway
- DigitalOcean
- AWS

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Built with Kiro AI Assistant
- UI components from Radix UI
- Icons from Lucide React
- Styling with Tailwind CSS

## 📞 Support

For support, email support@freelancehub.com or join our Slack channel.

---

**Made with ❤️ by FreelanceHub Team**
