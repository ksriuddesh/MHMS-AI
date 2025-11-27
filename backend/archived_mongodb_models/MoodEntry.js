const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
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
  mood: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  energy: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  anxiety: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  sleep: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  factors: [{
    type: String,
    enum: [
      'work', 'family', 'friends', 'exercise', 'sleep', 'weather',
      'health', 'finances', 'stress', 'leisure', 'social', 'diet'
    ]
  }],
  location: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient queries
moodEntrySchema.index({ userId: 1, date: -1 });
moodEntrySchema.index({ userId: 1, createdAt: -1 });

// Virtual for calculated wellness score
moodEntrySchema.virtual('wellnessScore').get(function() {
  const moodScore = (this.mood / 10) * 25;
  const energyScore = (this.energy / 10) * 20;
  const anxietyScore = ((10 - this.anxiety) / 10) * 25;
  const sleepScore = (this.sleep / 10) * 20;
  const factorsScore = this.factors.length * 2.5;
  
  return Math.round(moodScore + energyScore + anxietyScore + sleepScore + factorsScore);
});

// Ensure virtuals are serialized
moodEntrySchema.set('toJSON', { virtuals: true });
moodEntrySchema.set('toObject', { virtuals: true });

// Static method to get user's mood entries with pagination
moodEntrySchema.statics.getUserMoods = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method to get mood statistics
moodEntrySchema.statics.getMoodStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), date: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        avgMood: { $avg: '$mood' },
        avgEnergy: { $avg: '$energy' },
        avgAnxiety: { $avg: '$anxiety' },
        avgSleep: { $avg: '$sleep' },
        totalEntries: { $sum: 1 },
        mostCommonFactors: {
          $push: '$factors'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
