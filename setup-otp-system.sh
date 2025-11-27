#!/bin/bash

echo "🚀 Setting up MindWell OTP-Based Password Reset System"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use MongoDB Atlas."
    echo "   You can download MongoDB from: https://www.mongodb.com/try/download/community"
fi

echo "✅ Node.js version: $(node --version)"

# Backend setup
echo ""
echo "📦 Setting up Backend..."
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Check if config.env exists
if [ ! -f "config.env" ]; then
    echo "⚠️  config.env not found. Creating from template..."
    cat > config.env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mindwell

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3

# Security
BCRYPT_SALT_ROUNDS=12
EOF
    echo "✅ Created config.env template"
    echo "⚠️  Please update config.env with your actual values:"
    echo "   - EMAIL_USER: Your Gmail address"
    echo "   - EMAIL_PASSWORD: Your Gmail app password"
    echo "   - JWT_SECRET: A strong secret key"
    echo "   - MONGODB_URI: Your MongoDB connection string"
fi

cd ..

# Frontend setup
echo ""
echo "📦 Setting up Frontend..."
cd src

# Check if ForgotPassword component exists
if [ ! -f "pages/ForgotPassword.tsx" ]; then
    echo "❌ ForgotPassword.tsx not found. Please ensure the file exists."
    exit 1
fi

cd ../..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update backend/config.env with your configuration"
echo "2. Set up Gmail App Password:"
echo "   - Go to Google Account → Security"
echo "   - Enable 2-Factor Authentication"
echo "   - Generate App Password for 'Mail'"
echo "   - Use this password in EMAIL_PASSWORD"
echo ""
echo "3. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "4. Start the frontend server:"
echo "   npm run dev"
echo ""
echo "5. Test the password reset flow:"
echo "   - Go to http://localhost:5173/login"
echo "   - Click 'Forgot password?'"
echo "   - Enter your email"
echo "   - Check your email for OTP"
echo "   - Enter OTP and set new password"
echo ""
echo "🔗 API Endpoints:"
echo "   - POST /api/auth/request-reset - Request OTP"
echo "   - POST /api/auth/verify-otp - Verify OTP"
echo "   - POST /api/auth/reset-password - Reset password"
echo "   - GET /api/health - Health check"
echo ""
echo "📚 Documentation: backend/README.md"
echo ""
echo "🎉 Happy coding!"
