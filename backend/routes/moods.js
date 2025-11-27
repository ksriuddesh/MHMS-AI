const express = require('express');
const MoodEntry = require('../models/MoodEntry');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new mood entry
router.post('/', async (req, res) => {
  try {
    const { date, mood, energy, anxiety, sleep, notes, factors, location, tags } = req.body;

    // Validate required fields
    if (!mood || !energy || !anxiety || !sleep) {
      return res.status(400).json({ 
        error: 'Mood, energy, anxiety, and sleep scores are required' 
      });
    }

    // Validate score ranges
    const scores = { mood, energy, anxiety, sleep };
    for (const [key, value] of Object.entries(scores)) {
      if (value < 1 || value > 10) {
        return res.status(400).json({ 
          error: `${key} score must be between 1 and 10` 
        });
      }
    }

    // Check if entry already exists for the date
    const entryDate = date ? new Date(date) : new Date();
    const existingEntry = await MoodEntry.findOne({
      userId: req.user._id,
      date: {
        $gte: new Date(entryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(entryDate.setHours(23, 59, 59, 999))
      }
    });

    if (existingEntry) {
      return res.status(400).json({ 
        error: 'A mood entry already exists for this date' 
      });
    }

    // Create new mood entry
    const moodEntry = new MoodEntry({
      userId: req.user._id,
      date: entryDate,
      mood,
      energy,
      anxiety,
      sleep,
      notes: notes || '',
      factors: factors || [],
      location: location || '',
      tags: tags || []
    });

    await moodEntry.save();

    res.status(201).json({
      message: 'Mood entry created successfully',
      moodEntry: moodEntry.toJSON()
    });

  } catch (error) {
    console.error('Create mood entry error:', error);
    res.status(500).json({ error: 'Server error creating mood entry' });
  }
});

// Get all mood entries for the user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { userId: req.user._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await MoodEntry.countDocuments(query);

    // Get mood entries with pagination
    const moodEntries = await MoodEntry.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    res.json({
      moodEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEntries: total,
        hasNext: skip + moodEntries.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get mood entries error:', error);
    res.status(500).json({ error: 'Server error retrieving mood entries' });
  }
});

// Get a specific mood entry
router.get('/:id', async (req, res) => {
  try {
    const moodEntry = await MoodEntry.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('userId', 'name email');

    if (!moodEntry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json({ moodEntry: moodEntry.toJSON() });

  } catch (error) {
    console.error('Get mood entry error:', error);
    res.status(500).json({ error: 'Server error retrieving mood entry' });
  }
});

// Update a mood entry
router.patch('/:id', async (req, res) => {
  try {
    const { mood, energy, anxiety, sleep, notes, factors, location, tags } = req.body;

    // Validate score ranges if provided
    const scores = { mood, energy, anxiety, sleep };
    for (const [key, value] of Object.entries(scores)) {
      if (value !== undefined && (value < 1 || value > 10)) {
        return res.status(400).json({ 
          error: `${key} score must be between 1 and 10` 
        });
      }
    }

    const moodEntry = await MoodEntry.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      {
        ...(mood !== undefined && { mood }),
        ...(energy !== undefined && { energy }),
        ...(anxiety !== undefined && { anxiety }),
        ...(sleep !== undefined && { sleep }),
        ...(notes !== undefined && { notes }),
        ...(factors !== undefined && { factors }),
        ...(location !== undefined && { location }),
        ...(tags !== undefined && { tags })
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!moodEntry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json({
      message: 'Mood entry updated successfully',
      moodEntry: moodEntry.toJSON()
    });

  } catch (error) {
    console.error('Update mood entry error:', error);
    res.status(500).json({ error: 'Server error updating mood entry' });
  }
});

// Delete a mood entry
router.delete('/:id', async (req, res) => {
  try {
    const moodEntry = await MoodEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!moodEntry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json({ message: 'Mood entry deleted successfully' });

  } catch (error) {
    console.error('Delete mood entry error:', error);
    res.status(500).json({ error: 'Server error deleting mood entry' });
  }
});

// Get mood statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const stats = await MoodEntry.getMoodStats(req.user._id, parseInt(days));
    
    if (stats.length === 0) {
      return res.json({
        message: 'No mood data available for the specified period',
        stats: {
          avgMood: 0,
          avgEnergy: 0,
          avgAnxiety: 0,
          avgSleep: 0,
          totalEntries: 0,
          mostCommonFactors: []
        }
      });
    }

    const stat = stats[0];
    
    // Process most common factors
    const factorCounts = {};
    stat.mostCommonFactors.flat().forEach(factor => {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    });
    
    const sortedFactors = Object.entries(factorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));

    res.json({
      stats: {
        avgMood: Math.round(stat.avgMood * 10) / 10,
        avgEnergy: Math.round(stat.avgEnergy * 10) / 10,
        avgAnxiety: Math.round(stat.avgAnxiety * 10) / 10,
        avgSleep: Math.round(stat.avgSleep * 10) / 10,
        totalEntries: stat.totalEntries,
        mostCommonFactors: sortedFactors
      }
    });

  } catch (error) {
    console.error('Get mood stats error:', error);
    res.status(500).json({ error: 'Server error retrieving mood statistics' });
  }
});

module.exports = router;
