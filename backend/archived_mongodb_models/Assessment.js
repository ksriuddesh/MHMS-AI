const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    required: true,
    enum: ['PHQ-9', 'GAD-7', 'PSS-10', 'Custom']
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  severity: {
    type: String,
    required: true,
    enum: ['minimal', 'mild', 'moderate', 'severe']
  },
  responses: {
    type: Map,
    of: Number,
    required: true
  },
  prediction: {
    status: String,
    confidence: Number,
    modelVersion: String,
    predictedAt: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  recommendations: [{
    type: String,
    trim: true
  }],
  followUpDate: Date,
  completed: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
assessmentSchema.index({ userId: 1, date: -1 });
assessmentSchema.index({ userId: 1, type: 1 });

// Virtual for percentage score
assessmentSchema.virtual('percentageScore').get(function() {
  return Math.round((this.score / this.maxScore) * 100);
});

// Virtual for severity level description
assessmentSchema.virtual('severityDescription').get(function() {
  const descriptions = {
    'minimal': 'Minimal symptoms - Continue monitoring',
    'mild': 'Mild symptoms - Consider self-help strategies',
    'moderate': 'Moderate symptoms - Consider professional help',
    'severe': 'Severe symptoms - Seek professional help immediately'
  };
  return descriptions[this.severity] || 'Unknown severity level';
});

// Ensure virtuals are serialized
assessmentSchema.set('toJSON', { virtuals: true });
assessmentSchema.set('toObject', { virtuals: true });

// Static method to get user's assessments with pagination
assessmentSchema.statics.getUserAssessments = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method to get assessment statistics
assessmentSchema.statics.getAssessmentStats = function(userId, type = null, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const match = { userId: mongoose.Types.ObjectId(userId), date: { $gte: startDate } };
  if (type) match.type = type;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        avgScore: { $avg: '$score' },
        avgPercentage: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } },
        totalAssessments: { $sum: 1 },
        severityBreakdown: {
          $push: '$severity'
        },
        latestAssessment: { $max: '$date' }
      }
    }
  ]);
};

// Method to generate recommendations based on severity
assessmentSchema.methods.generateRecommendations = function() {
  const recommendations = {
    'PHQ-9': {
      minimal: [
        'Continue monitoring your mood regularly',
        'Maintain healthy routines and social connections',
        'Practice stress management techniques'
      ],
      mild: [
        'Increase pleasant activities and social contact',
        'Consider journaling or short walks daily',
        'Practice mindfulness or meditation',
        'Consider speaking with a trusted friend or family member'
      ],
      moderate: [
        'Schedule enjoyable activities and talk to a trusted person',
        'Consider speaking with a mental health professional',
        'Practice cognitive behavioral therapy techniques',
        'Maintain regular sleep and exercise routines'
      ],
      severe: [
        'Seek professional mental health support promptly',
        'If in crisis, contact emergency services or crisis hotline',
        'Consider medication evaluation with a psychiatrist',
        'Create a safety plan with your healthcare provider'
      ]
    },
    'GAD-7': {
      minimal: [
        'Continue stress-management habits that work for you',
        'Practice regular relaxation techniques'
      ],
      mild: [
        'Practice brief breathing exercises twice daily',
        'Limit caffeine and alcohol intake',
        'Establish regular sleep patterns',
        'Use worry time scheduling techniques'
      ],
      moderate: [
        'Add structured worry time and limit stimulants',
        'Consider CBT-based self-help or professional guidance',
        'Practice progressive muscle relaxation',
        'Consider speaking with a mental health professional'
      ],
      severe: [
        'Consult a clinician about tailored anxiety management',
        'Consider medication options with a psychiatrist',
        'Use crisis resources if anxiety escalates',
        'Practice grounding techniques during panic attacks'
      ]
    },
    'PSS-10': {
      minimal: [
        'Keep up healthy boundaries and time management',
        'Continue stress-reduction practices'
      ],
      mild: [
        'Use task batching and micro-breaks during the day',
        'Practice time management techniques',
        'Maintain work-life balance'
      ],
      moderate: [
        'Prioritize tasks and delegate when possible',
        'Schedule recovery time daily',
        'Consider stress management counseling',
        'Practice regular relaxation techniques'
      ],
      severe: [
        'Seek workplace or academic support',
        'Consider professional stress management help',
        'Evaluate and reduce stressors where possible',
        'Practice regular self-care activities'
      ]
    }
  };

  const typeRecommendations = recommendations[this.type] || recommendations['PHQ-9'];
  return typeRecommendations[this.severity] || typeRecommendations.mild;
};

module.exports = mongoose.model('Assessment', assessmentSchema);
