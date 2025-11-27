# MHMS Project Report

## Project Overview

**MindWell Health Management System (MHMS)** - A comprehensive mental health tracking and assessment platform.

---

## Architecture

### Frontend
- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **State Management:** Context API
- **UI Components:** Lucide React Icons
- **Build Tool:** Vite

### Backend
- **Framework:** Express.js (Node.js)
- **Language:** JavaScript
- **Port:** 5000
- **Authentication:** JWT (JSON Web Tokens)
- **Password Security:** bcryptjs

### Database
- **Status:** ✅ **CONFIGURED - MongoDB Atlas**
- **Cluster:** MindWell
- **Connection:** mongodb+srv://mindwell:mindwell1234@mindwell.5s9az0x.mongodb.net/?appName=mindwell
- **Type:** Cloud (MongoDB Atlas)

---

## Project Structure

```
project/
├── frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API integration
│   │   ├── contexts/         # State management
│   │   └── lib/              # Utilities & helpers
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── backend (Express.js)
│   ├── routes/               # API endpoints
│   │   ├── auth.js           # Authentication
│   │   ├── assessments.js    # Mental health assessments
│   │   ├── dashboard.js      # Dashboard data
│   │   ├── moods.js          # Mood tracking
│   │   ├── ai.js             # AI endpoints
│   │   └── ...
│   ├── middleware/           # Express middleware
│   ├── utils/                # Helper functions
│   ├── archived_mongodb_models/  # Old models (archived)
│   ├── db-placeholder.js     # Database placeholder
│   ├── server.js             # Entry point
│   ├── config.env            # Environment variables
│   └── package.json
│
└── Documentation files

```

---

## Key Features

### ✅ Authentication System
- User registration and login
- JWT-based session management
- Password hashing with bcryptjs
- OTP support for password recovery

### ✅ Mental Health Assessments
- PHQ-9 Assessment (Depression Screening)
- GAD-7 Assessment (Anxiety Screening)
- PSS-10 Assessment (Stress Perception)
- Custom assessment scoring

### ✅ Mood Tracking
- Daily mood entry logging
- Emotion categorization
- Trend analysis
- Historical data tracking

### ✅ Provider Directory
- Healthcare provider listings
- Search and filter functionality
- Contact information
- Specialty categories

### ✅ Dashboard
- User statistics
- Assessment summaries
- Mood trends visualization
- Quick actions

### ✅ AI Integration
- AI-powered insights
- Recommendations based on assessments
- Gemini API integration

### ✅ Email Service
- User notifications
- Welcome emails
- Password recovery emails
- Assessment reminders

---

## API Endpoints (Ready for Configuration)

### Authentication
```
POST /api/auth/register      - User registration
POST /api/auth/login         - User login
POST /api/auth/logout        - User logout
POST /api/auth/forgot-password - Password recovery
```

### Assessments
```
GET  /api/assessments        - List all assessments
POST /api/assessments        - Create assessment
GET  /api/assessments/:id    - Get assessment details
PUT  /api/assessments/:id    - Update assessment
```

### Mood Tracking
```
GET  /api/moods              - Get mood history
POST /api/moods              - Log new mood
GET  /api/moods/stats        - Get mood statistics
```

### Dashboard
```
GET  /api/dashboard          - Get dashboard data
GET  /api/dashboard/summary  - Get summary statistics
```

### Providers
```
GET  /api/providers          - List providers
GET  /api/providers/:id      - Get provider details
GET  /api/providers/search   - Search providers
```

### AI
```
POST /api/ai/analyze         - AI analysis
POST /api/ai/recommendations - Get recommendations
```

---

## Database Configuration

**File:** `backend/config.env`

```env
# Database Configuration - MongoDB Atlas (CONFIGURED)
MONGODB_URI=mongodb+srv://mindwell:mindwell1234@mindwell.5s9az0x.mongodb.net/?appName=mindwell

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Service
GMAIL_APP_PASSWORD=your-gmail-app-password-here
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# OTP
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3

# Security
BCRYPT_SALT_ROUNDS=12

# AI
GEMINI_API_KEY=your-gemini-api-key-here
```

---

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run dev  # Start development server
```

### Frontend Setup
```bash
npm install
npm run dev  # Start development server on http://localhost:5173
```

---

## Database Configuration (✅ CONFIGURED)

**MongoDB Atlas is now connected!**

### Connection Details
- **Cluster:** MindWell
- **URI:** `mongodb+srv://mindwell:mindwell1234@mindwell.5s9az0x.mongodb.net/?appName=mindwell`
- **Type:** Cloud Database (MongoDB Atlas)
- **Status:** ✅ Ready to Use

### Testing Connection
To verify MongoDB connection is working:

```bash
cd backend
npm run test:db
```

Expected output:
```
✅ SUCCESS! Connected to MongoDB Atlas
📦 Database: mindwell
✅ Write test successful - Document created
✅ Read test successful - Document retrieved
✅ Delete test successful - Document removed
✨ All tests passed successfully!
```

### Important Notes
⚠️ **IP Whitelist:** Make sure your current IP address is whitelisted in MongoDB Atlas
- Go to: https://cloud.mongodb.com/ → Network Access
- Add your IP or allow all (0.0.0.0/0) for testing

---

## Security Features

✅ **Password Security**
- Bcryptjs password hashing (12 rounds)
- Never stored in plain text

✅ **Authentication**
- JWT token-based sessions
- Token validation on protected routes

✅ **Rate Limiting**
- Configurable request limits
- Prevents brute-force attacks

✅ **CORS**
- Cross-origin resource sharing configured
- Production and development modes

✅ **Helmet.js**
- Security headers configuration
- HTTP security middleware

---

## Development Tools

### Running the Application
```bash
# Backend (port 5000)
cd backend && npm run dev

# Frontend (port 5173)
npm run dev
```

### Building for Production
```bash
# Frontend
npm run build

# Backend
npm run start
```

### Testing
```bash
npm test  # Run tests
```

---

## Important Notes

⚠️ **Database Configuration Pending**
- Routes are currently using placeholder database
- You will provide the actual database connection
- All data models are archived in `backend/archived_mongodb_models/`

⚠️ **Environment Variables**
- Update `.env` files before deploying to production
- Never commit sensitive credentials
- Use secure secret keys

⚠️ **Production Deployment**
- Set `NODE_ENV=production`
- Use environment variable manager
- Configure proper CORS origins
- Enable rate limiting

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + PostCSS |
| **Backend** | Express.js + Node.js |
| **Authentication** | JWT + bcryptjs |
| **Database** | MongoDB Atlas (Cloud) ✅ |
| **ODM** | Mongoose |
| **Email** | Mailtrap/Gmail |
| **AI** | Google Gemini API |
| **Icons** | Lucide React |

---

## Quick Reference

- **Frontend Port:** http://localhost:5173
- **Backend Port:** http://localhost:5000
- **API Base:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

---

## Support & Documentation

- **Frontend Components:** `src/components/`
- **Backend Routes:** `backend/routes/`
- **Utilities:** `backend/utils/`
- **Configuration:** `backend/config.env`

---

**Project Status:** ✅ **READY FOR DEVELOPMENT**

**Database:** ✅ **MongoDB Atlas Connected**

**Last Updated:** November 2025
