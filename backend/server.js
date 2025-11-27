const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config.env' });

// Initialize MongoDB connection
const { connectDB } = require('./config/database');

// Initialize email service
const emailService = require('./utils/simpleEmailService');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true
}));

// Rate limiting (production only). Exclude /api/ai to avoid blocking AI generation.
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/ai')) return next();
    return limiter(req, res, next);
  });
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test MongoDB connection on startup
async function testDatabaseConnection() {
  try {
    await connectDB();
    console.log('✅ MongoDB connection initialized');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('💡 Make sure your IP is whitelisted in MongoDB Atlas');
    process.exit(1);
  }
}

// Initialize email service on startup
async function initializeEmailService() {
  try {
    console.log('📧 Initializing email service...');
    // Test email service configuration
    if (process.env.GMAIL_APP_PASSWORD) {
      console.log('✅ Email service configured successfully');
    } else {
      console.log('⚠️ GMAIL_APP_PASSWORD not set - emails may not work');
      console.log('💡 Add GMAIL_APP_PASSWORD to your .env file');
    }
  } catch (error) {
    console.error('❌ Email service initialization failed:', error.message);
  }
}

// API Routes
app.use('/api/ai', require('./routes/ai'));

// MongoDB-based routes (active)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/moods', require('./routes/moods'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/user', require('./routes/user'));
app.use('/api/patient-profile', require('./routes/patientProfile'));

// Note: If you need admin routes, uncomment below
// app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    emailService: process.env.GMAIL_APP_PASSWORD ? 'Configured' : 'Not configured'
  });
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const result = await emailService.sendWelcomeEmail(email, name || 'Test User');
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // MongoDB/Mongoose error handling
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate field value entered',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🗄️  Database: MongoDB`);
  console.log(`📧 Email service: ${process.env.GMAIL_APP_PASSWORD ? 'Configured' : 'Not configured'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/mindwell'}`);
  
  // Test database connection
  await testDatabaseConnection();
  
  // Initialize email service after server starts
  await initializeEmailService();
  
  console.log('✅ Server initialization complete!\n');
});

// Graceful shutdown
const mongoose = require('mongoose');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
