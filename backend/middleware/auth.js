const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select('_id email firstName lastName status createdAt')
      .lean();
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid token or inactive user.' });
    }

    // Convert MongoDB _id to id for compatibility
    req.user = {
      ...user,
      id: user._id.toString()
    };
    req.userId = user._id.toString();
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error.' });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId)
        .select('_id email firstName lastName')
        .lean();
      
      if (user) {
        req.user = {
          ...user,
          id: user._id.toString()
        };
        req.userId = user._id.toString();
      }
    }
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

module.exports = { auth, optionalAuth };
