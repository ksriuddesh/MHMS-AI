const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    trim: true
  },
  loginTime: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  device: {
    type: String,
    trim: true
  },
  browser: {
    type: String,
    trim: true
  },
  os: {
    type: String,
    trim: true
  },
  location: {
    country: String,
    city: String,
    region: String
  },
  loginStatus: {
    type: String,
    enum: ['success', 'failed', 'blocked'],
    default: 'success'
  },
  failureReason: {
    type: String,
    trim: true
  },
  sessionToken: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
loginHistorySchema.index({ userId: 1, loginTime: -1 });
loginHistorySchema.index({ email: 1, loginTime: -1 });
loginHistorySchema.index({ loginTime: -1 });

// Virtual for formatted login time
loginHistorySchema.virtual('formattedLoginTime').get(function() {
  return this.loginTime.toLocaleString();
});

// Method to get user's login history
loginHistorySchema.statics.getUserHistory = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ loginTime: -1 })
    .limit(limit)
    .select('-__v');
};

// Method to get recent failed login attempts
loginHistorySchema.statics.getFailedAttempts = async function(email, hours = 1) {
  const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    email,
    loginStatus: 'failed',
    loginTime: { $gte: timeAgo }
  }).countDocuments();
};

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
