const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const emailService = require('../utils/simpleEmailService');
const mailgunService = require('../utils/mailgunService');

// Generate OTP using email service
function generateOTP() {
  return emailService.generateOTP();
}

// Helper function to parse user agent
function parseUserAgent(userAgent) {
  const ua = userAgent || '';
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Detect device type
  let device = 'Desktop';
  if (ua.includes('Mobile')) device = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';
  
  return { browser, os, device };
}

// Helper function to record login attempt
async function recordLoginAttempt(userId, email, req, status = 'success', failureReason = null) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(userAgent);
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Get username if available
    let username = email.split('@')[0]; // Default to email prefix
    if (userId) {
      const user = await User.findById(userId).select('firstName lastName');
      if (user && user.firstName) {
        username = `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`;
      }
    }
    
    const loginRecord = new LoginHistory({
      userId: userId || null,
      email,
      username,
      loginTime: new Date(),
      ipAddress,
      userAgent,
      device,
      browser,
      os,
      loginStatus: status,
      failureReason
    });
    
    await loginRecord.save();
    return loginRecord;
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
}

// User registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    console.log('Registration attempt:', { name, email, passwordLength: password?.length });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      firstName,
      lastName,
      email,
      password // Will be hashed by the model's pre-save hook
    });

    await user.save();
    console.log('User saved successfully');

    // Send welcome email
    try {
      await mailgunService.sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Record initial registration as first login
    await recordLoginAttempt(user._id, email, req, 'success');

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Record failed login attempt
      await recordLoginAttempt(null, email, req, 'failed', 'User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Record failed login attempt
      await recordLoginAttempt(user._id, email, req, 'failed', 'Incorrect password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Record successful login attempt
    await recordLoginAttempt(user._id, email, req, 'success');

    // Send login notification email
    try {
      const userAgent = req.headers['user-agent'] || '';
      const { browser, os, device } = parseUserAgent(userAgent);
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      
      await mailgunService.sendLoginNotification(
        user.email,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        {
          time: new Date().toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'long' 
          }),
          device,
          browser,
          os,
          ip: ipAddress,
          location: null // Can add geolocation API later
        }
      );
      console.log('✅ Login notification email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send login notification:', emailError.message);
      // Don't fail login if email fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send OTP via email using Mailgun
async function sendOTPEmail(email, otp) {
  try {
    const result = await mailgunService.sendOTPEmail(email, otp);
    return result.success;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Request password reset (send OTP)
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Check if there's already a pending OTP
    const existingOTP = emailService.getOTPData(email);
    if (existingOTP && !existingOTP.verified) {
      const timeDiff = new Date() - existingOTP.createdAt;
      if (timeDiff < 60000) { // Less than 1 minute
        return res.status(429).json({ 
          message: 'Please wait at least 1 minute before requesting another OTP',
          remainingTime: Math.ceil((60000 - timeDiff) / 1000)
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP using email service
    emailService.storeOTP(email, otp);

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);
    
    if (emailSent) {
      res.json({ 
        message: 'OTP sent successfully to your email',
        email: email,
        expiresIn: '10 minutes'
      });
    } else {
      res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify OTP with enhanced validation
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP using email service
    const isValid = emailService.verifyOTP(email, otp);
    
    if (!isValid) {
      const otpData = emailService.getOTPData(email);
      if (!otpData) {
        return res.status(400).json({ message: 'OTP has expired or is invalid' });
      }
      
      if (otpData.attempts >= 3) {
        emailService.clearOTP(email);
        return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
      }
      
      return res.status(400).json({ 
        message: 'Invalid OTP',
        remainingAttempts: 3 - otpData.attempts
      });
    }

    // OTP is valid - generate reset token
    const resetToken = jwt.sign(
      { email, type: 'password_reset', verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ 
      message: 'OTP verified successfully',
      resetToken,
      email,
      expiresIn: '15 minutes'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password with token and enhanced validation
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (decoded.type !== 'password_reset' || !decoded.verified) {
      return res.status(400).json({ message: 'Invalid token type or not verified' });
    }

    // Find user
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP was verified
    if (!emailService.isOTPVerified(decoded.email)) {
      return res.status(400).json({ message: 'OTP verification required before password reset' });
    }

    // Update user password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    console.log('✅ Password reset successfully for:', decoded.email);

    // Send confirmation email
    try {
      await mailgunService.sendPasswordResetConfirmation(decoded.email, user.firstName || user.email);
      console.log('✅ Password reset confirmation email sent');
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError);
      // Don't fail password reset if email fails
    }

    // Clear OTP data
    emailService.clearOTP(decoded.email);

    res.json({ 
      message: 'Password reset successfully. You can now login with your new password.',
      email: decoded.email
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Resend OTP (if user didn't receive it)
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Check if there's already a pending OTP
    const existingOTP = emailService.getOTPData(email);
    if (existingOTP && !existingOTP.verified) {
      const timeDiff = new Date() - existingOTP.createdAt;
      if (timeDiff < 60000) { // Less than 1 minute
        return res.status(429).json({ 
          message: 'Please wait at least 1 minute before requesting another OTP',
          remainingTime: Math.ceil((60000 - timeDiff) / 1000)
        });
      }
    }

    // Generate new OTP
    const otp = generateOTP();

    // Store new OTP
    emailService.storeOTP(email, otp);

    // Send new OTP via email
    const emailSent = await sendOTPEmail(email, otp);
    
    if (emailSent) {
      res.json({ 
        message: 'New OTP sent successfully',
        email: email,
        expiresIn: '10 minutes'
      });
    } else {
      res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get OTP status (for debugging and frontend state management)
router.get('/otp-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const otpData = emailService.getOTPData(email);
    
    if (!otpData) {
      return res.json({ 
        hasOTP: false,
        message: 'No OTP found for this email'
      });
    }

    const now = new Date();
    const isExpired = now > otpData.expiry;
    const remainingTime = Math.max(0, Math.ceil((otpData.expiry - now) / 1000));

    res.json({
      hasOTP: true,
      isExpired,
      isVerified: otpData.verified,
      attempts: otpData.attempts,
      remainingTime: isExpired ? 0 : remainingTime,
      createdAt: otpData.createdAt,
      expiresAt: otpData.expiry
    });

  } catch (error) {
    console.error('OTP status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get login history for a user
router.get('/login-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const history = await LoginHistory.find({ userId })
      .sort({ loginTime: -1 })
      .limit(limit)
      .select('-__v');

    res.json({
      success: true,
      count: history.length,
      history
    });

  } catch (error) {
    console.error('Login history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get login history by email
router.get('/login-history/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const history = await LoginHistory.find({ email })
      .sort({ loginTime: -1 })
      .limit(limit)
      .select('-__v');

    res.json({
      success: true,
      count: history.length,
      history
    });

  } catch (error) {
    console.error('Login history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all recent login attempts (admin)
router.get('/login-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status; // 'success', 'failed', or 'all'

    const query = status && status !== 'all' ? { loginStatus: status } : {};

    const history = await LoginHistory.find(query)
      .sort({ loginTime: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .select('-__v');

    res.json({
      success: true,
      count: history.length,
      history
    });

  } catch (error) {
    console.error('Login history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get login statistics
router.get('/login-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const totalLogins = await LoginHistory.countDocuments({ userId, loginStatus: 'success' });
    const failedLogins = await LoginHistory.countDocuments({ userId, loginStatus: 'failed' });
    
    const lastLogin = await LoginHistory.findOne({ userId, loginStatus: 'success' })
      .sort({ loginTime: -1 })
      .select('loginTime ipAddress device browser');

    const recentLogins = await LoginHistory.find({ userId })
      .sort({ loginTime: -1 })
      .limit(5)
      .select('loginTime loginStatus ipAddress device browser');

    res.json({
      success: true,
      stats: {
        totalLogins,
        failedLogins,
        lastLogin,
        recentLogins
      }
    });

  } catch (error) {
    console.error('Login stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Google OAuth login - Store Google sign-in data in MongoDB
router.post('/google-login', async (req, res) => {
  try {
    const { uid, email, name, avatar, provider } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Google login attempt:', { email, name, provider });

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user from Google data
      const nameParts = name ? name.trim().split(' ') : [email.split('@')[0]];
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      user = new User({
        firstName,
        lastName,
        email,
        password: 'GOOGLE_OAUTH_' + Math.random().toString(36), // Placeholder password for OAuth users
        avatar: avatar || undefined,
        patientId: `GOOGLE_${uid}`,
        isActive: true,
        status: 'active'
      });

      await user.save();
      console.log('New Google user created:', user._id);
    } else {
      // Update existing user's last login
      user.lastLoginAt = new Date();
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
      console.log('Existing user logged in:', user._id);
    }

    // Record login history
    await recordLoginAttempt(user._id, email, req, 'success');

    // Send login notification email
    try {
      const userAgent = req.headers['user-agent'] || '';
      const { browser, os, device } = parseUserAgent(userAgent);
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      
      await mailgunService.sendLoginNotification(
        user.email,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        {
          time: new Date().toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'long' 
          }),
          device,
          browser,
          os,
          ip: ipAddress,
          location: null
        }
      );
      console.log('✅ Google login notification sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send Google login notification:', emailError.message);
      // Don't fail login if email fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
