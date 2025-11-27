const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate Patient ID
function generatePatientId() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MH${timestamp}${random}`;
}

// Helper function to create audit log
async function createAuditLog(userId, action, entity, entityId, oldValues, newValues, req) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// Register new patient
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'All fields are required',
        fields: { email: !email, password: !password, firstName: !firstName, lastName: !lastName }
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique patient ID
    let patientId = generatePatientId();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.patientProfile.findUnique({
        where: { patientId }
      });
      if (!existing) break;
      patientId = generatePatientId();
      attempts++;
    }

    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          status: 'active'
        }
      });

      const profile = await tx.patientProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          patientId,
          dateOfBirth: '',
          gender: '',
          email: email.toLowerCase()
        }
      });

      return { user, profile };
    });

    // Create audit log
    await createAuditLog(
      result.user.id,
      'create',
      'user',
      result.user.id,
      null,
      { email: result.user.email, firstName, lastName },
      req
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update session token
    await prisma.user.update({
      where: { id: result.user.id },
      data: { sessionToken: token, lastLogin: new Date() }
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        patientId: result.profile.patientId
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login and session token
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        sessionToken: token
      }
    });

    // Create audit log
    await createAuditLog(
      user.id,
      'login',
      'user',
      user.id,
      null,
      { loginTime: new Date() },
      req
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        patientId: user.profile?.patientId,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Login with Patient ID
router.post('/login/patient-id', async (req, res) => {
  try {
    const { patientId, password } = req.body;

    if (!patientId || !password) {
      return res.status(400).json({ error: 'Patient ID and password are required' });
    }

    // Find user by patient ID
    const profile = await prisma.patientProfile.findUnique({
      where: { patientId },
      include: { user: true }
    });

    if (!profile || !profile.user) {
      return res.status(401).json({ error: 'Invalid Patient ID or password' });
    }

    const user = profile.user;

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid Patient ID or password' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        sessionToken: token
      }
    });

    // Create audit log
    await createAuditLog(
      user.id,
      'login',
      'user',
      user.id,
      null,
      { loginTime: new Date(), method: 'patient_id' },
      req
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        patientId: profile.patientId,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Patient ID login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user (verify session)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lastLogin: true,
        createdAt: true,
        status: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        patientId: user.profile?.patientId,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        profileComplete: !!(
          user.profile?.firstName &&
          user.profile?.lastName &&
          user.profile?.dateOfBirth &&
          user.profile?.gender
        )
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Clear session token
    await prisma.user.update({
      where: { id: req.userId },
      data: { sessionToken: null }
    });

    // Create audit log
    await createAuditLog(
      req.userId,
      'logout',
      'user',
      req.userId,
      null,
      { logoutTime: new Date() },
      req
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    // Create audit log
    await createAuditLog(
      req.userId,
      'update',
      'user',
      req.userId,
      { action: 'password_change' },
      { action: 'password_changed', timestamp: new Date() },
      req
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Refresh token
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Generate new token
    const token = jwt.sign(
      { userId: req.userId, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update session token
    await prisma.user.update({
      where: { id: req.userId },
      data: { sessionToken: token }
    });

    res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

module.exports = router;
