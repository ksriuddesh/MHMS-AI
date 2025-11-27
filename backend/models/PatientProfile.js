const mongoose = require('mongoose');

/**
 * PatientProfile Model - Extended patient information
 * This is optional if you want to separate user credentials from patient profile data
 * Otherwise, the User model contains all necessary fields
 */

const patientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  dateOfBirth: {
    type: String,
    required: [true, 'Date of birth is required'],
    trim: true
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    trim: true
  },
  
  // Patient Identifier
  patientId: {
    type: String,
    required: [true, 'Patient ID is required'],
    unique: true,
    trim: true
  },
  
  // Contact Information
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Address Information
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
  
  // Medical Information (optional)
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  allergies: [{
    type: String,
    trim: true
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  
  // Insurance Information (optional)
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String
  },
  
  // Additional Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot be more than 2000 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
patientProfileSchema.index({ userId: 1 });
patientProfileSchema.index({ patientId: 1 });
patientProfileSchema.index({ email: 1 });

// Virtual for full name
patientProfileSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full address
patientProfileSchema.virtual('fullAddress').get(function() {
  const parts = [this.addressLine1, this.addressLine2, this.city, this.state, this.zip].filter(Boolean);
  return parts.join(', ');
});

// Virtual for age (if dateOfBirth is in YYYY-MM-DD format)
patientProfileSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtuals are serialized
patientProfileSchema.set('toJSON', { virtuals: true });
patientProfileSchema.set('toObject', { virtuals: true });

// Static method to find profile by patient ID
patientProfileSchema.statics.findByPatientId = function(patientId) {
  return this.findOne({ patientId }).populate('userId', 'email status');
};

// Static method to find profile by user ID
patientProfileSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId }).populate('userId', 'email status');
};

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
