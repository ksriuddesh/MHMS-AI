const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  specialty: {
    type: String,
    required: true,
    trim: true
  },
  languages: [{
    type: String,
    trim: true
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  available: {
    type: Boolean,
    default: true
  },
  acceptsInsurance: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    trim: true
  },
  distance: {
    type: String,
    trim: true
  },
  nextAvailable: {
    type: Date
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  credentials: {
    license: String,
    education: String,
    certifications: [String]
  },
  services: [{
    type: String,
    trim: true
  }],
  insuranceAccepted: [{
    type: String,
    trim: true
  }],
  slidingScale: {
    type: Boolean,
    default: false
  },
  telehealth: {
    type: Boolean,
    default: false
  },
  inPerson: {
    type: Boolean,
    default: true
  },
  specialties: [{
    type: String,
    trim: true
  }],
  ageGroups: [{
    type: String,
    enum: ['children', 'adolescents', 'adults', 'seniors']
  }],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
providerSchema.index({ specialty: 1, available: 1 });
providerSchema.index({ 'address.city': 1, 'address.state': 1 });
providerSchema.index({ rating: -1 });
providerSchema.index({ active: 1 });

// Virtual for full address
providerSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr) return '';
  
  const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
  return parts.join(', ');
});

// Virtual for average rating display
providerSchema.virtual('ratingDisplay').get(function() {
  return this.rating.toFixed(1);
});

// Ensure virtuals are serialized
providerSchema.set('toJSON', { virtuals: true });
providerSchema.set('toObject', { virtuals: true });

// Static method to search providers
providerSchema.statics.searchProviders = function(filters = {}, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const query = { active: true };
  
  if (filters.specialty) query.specialty = new RegExp(filters.specialty, 'i');
  if (filters.city) query['address.city'] = new RegExp(filters.city, 'i');
  if (filters.state) query['address.state'] = new RegExp(filters.state, 'i');
  if (filters.available !== undefined) query.available = filters.available;
  if (filters.acceptsInsurance !== undefined) query.acceptsInsurance = filters.acceptsInsurance;
  if (filters.telehealth !== undefined) query.telehealth = filters.telehealth;
  if (filters.minRating) query.rating = { $gte: filters.minRating };
  if (filters.languages && filters.languages.length > 0) {
    query.languages = { $in: filters.languages };
  }
  
  return this.find(query)
    .sort({ rating: -1, name: 1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get provider statistics
providerSchema.statics.getProviderStats = function() {
  return this.aggregate([
    { $match: { active: true } },
    {
      $group: {
        _id: null,
        totalProviders: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        availableProviders: {
          $sum: { $cond: ['$available', 1, 0] }
        },
        telehealthProviders: {
          $sum: { $cond: ['$telehealth', 1, 0] }
        },
        insuranceProviders: {
          $sum: { $cond: ['$acceptsInsurance', 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Provider', providerSchema);
