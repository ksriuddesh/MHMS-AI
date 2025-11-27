const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic credentials
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // Profile information
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  dateOfBirth: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Patient/User ID
  patientId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  // Address information
  addressLine1: {
    type: String,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zip: {
    type: String,
    trim: true
  },
  
  // Additional profile details
  avatar: {
    type: String,
    default: null
  },
  occupation: {
    type: String,
    trim: true
  },
  
  // Emergency contact
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // User preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    privacy: {
      type: String,
      enum: ['private', 'limited', 'open'],
      default: 'limited'
    }
  },
  
  // Account status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Session management
  sessionToken: {
    type: String,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // OTP fields
  otp: String,
  otpExpires: Date,
  otpAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Public JSON method (exclude sensitive data)
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

// Indexes for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ patientId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || 'Unknown User';
});

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  const parts = [this.addressLine1, this.addressLine2, this.city, this.state, this.zip].filter(Boolean);
  return parts.join(', ');
});

// Ensure virtuals are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
