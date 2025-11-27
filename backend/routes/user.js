const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    res.json({
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error retrieving profile' });
  }
});

// Update user profile
router.patch('/profile', async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'avatar', 'preferences', 'profile'];
    const filteredUpdates = {};

    // Only allow specific fields to be updated
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Comprehensive user data update endpoint
router.put('/update-data', async (req, res) => {
  try {
    const {
      name,
      avatar,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      preferences,
      medicalInfo
    } = req.body;

    const updateData = {};

    // Basic information
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;

    // Profile information
    if (phone || dateOfBirth || gender || address || emergencyContact || medicalInfo) {
      updateData.profile = req.user.profile || {};
      
      if (phone) updateData.profile.phone = phone;
      if (dateOfBirth) updateData.profile.dateOfBirth = dateOfBirth;
      if (gender) updateData.profile.gender = gender;
      
      if (address) {
        updateData.profile.address = {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          zipCode: address.zipCode || '',
          country: address.country || ''
        };
      }
      
      if (emergencyContact) {
        updateData.profile.emergencyContact = {
          name: emergencyContact.name || '',
          phone: emergencyContact.phone || '',
          relationship: emergencyContact.relationship || ''
        };
      }
      
      if (medicalInfo) {
        updateData.profile.medicalInfo = {
          allergies: medicalInfo.allergies || [],
          medications: medicalInfo.medications || [],
          conditions: medicalInfo.conditions || [],
          bloodType: medicalInfo.bloodType || ''
        };
      }
    }

    // Preferences
    if (preferences) {
      updateData.preferences = {
        theme: preferences.theme || req.user.preferences?.theme || 'light',
        notifications: preferences.notifications !== undefined ? preferences.notifications : true,
        privacy: preferences.privacy || req.user.preferences?.privacy || 'private',
        language: preferences.language || req.user.preferences?.language || 'en'
      };
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User data updated successfully',
      user: updatedUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Update user data error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error updating user data',
      details: error.message 
    });
  }
});

// Update user preferences
router.patch('/preferences', async (req, res) => {
  try {
    const { theme, notifications, privacy } = req.body;
    const updates = {};

    if (theme && ['light', 'dark'].includes(theme)) {
      updates['preferences.theme'] = theme;
    }
    if (typeof notifications === 'boolean') {
      updates['preferences.notifications'] = notifications;
    }
    if (privacy && ['private', 'limited', 'open'].includes(privacy)) {
      updates['preferences.privacy'] = privacy;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Preferences updated successfully',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Server error updating preferences' });
  }
});

// Update emergency contact
router.patch('/emergency-contact', async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'profile.emergencyContact': {
          name,
          phone,
          relationship: relationship || ''
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Emergency contact updated successfully',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Update emergency contact error:', error);
    res.status(500).json({ error: 'Server error updating emergency contact' });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const MoodEntry = require('../models/MoodEntry');
    const Assessment = require('../models/Assessment');

    const userId = req.user._id;

    // Get counts
    const totalMoodEntries = await MoodEntry.countDocuments({ userId });
    const totalAssessments = await Assessment.countDocuments({ userId });

    // Get streak information
    const recentMoodEntries = await MoodEntry.find({ userId })
      .sort({ date: -1 })
      .limit(30);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < recentMoodEntries.length; i++) {
      const entry = recentMoodEntries[i];
      const entryDate = new Date(entry.date);
      const today = new Date();
      const diffTime = Math.abs(today - entryDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === i + 1) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Get average wellness score
    let averageWellnessScore = 0;
    if (recentMoodEntries.length > 0) {
      const totalScore = recentMoodEntries.reduce((sum, entry) => sum + entry.wellnessScore, 0);
      averageWellnessScore = Math.round(totalScore / recentMoodEntries.length);
    }

    // Get most common factors
    const allFactors = recentMoodEntries.flatMap(entry => entry.factors);
    const factorCounts = {};
    allFactors.forEach(factor => {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    });

    const topFactors = Object.entries(factorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));

    res.json({
      stats: {
        totalMoodEntries,
        totalAssessments,
        currentStreak,
        longestStreak,
        averageWellnessScore,
        topFactors,
        accountCreated: req.user.createdAt,
        lastLogin: req.user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error retrieving user statistics' });
  }
});

// Delete user account
router.delete('/account', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    // Verify password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user data (mood entries and assessments)
    const MoodEntry = require('../models/MoodEntry');
    const Assessment = require('../models/Assessment');

    await MoodEntry.deleteMany({ userId: req.user._id });
    await Assessment.deleteMany({ userId: req.user._id });

    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error deleting account' });
  }
});

// Get user activity summary
router.get('/activity', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const MoodEntry = require('../models/MoodEntry');
    const Assessment = require('../models/Assessment');

    const userId = req.user._id;

    // Get mood entries for the period
    const moodEntries = await MoodEntry.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    // Get assessments for the period
    const assessments = await Assessment.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    // Calculate activity metrics
    const activityMetrics = {
      totalDays: parseInt(days),
      daysWithMoodEntries: moodEntries.length,
      daysWithAssessments: assessments.length,
      moodEntryRate: Math.round((moodEntries.length / parseInt(days)) * 100),
      assessmentRate: Math.round((assessments.length / parseInt(days)) * 100),
      averageMoodScore: moodEntries.length > 0 
        ? Math.round(moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / moodEntries.length)
        : 0,
      averageWellnessScore: moodEntries.length > 0
        ? Math.round(moodEntries.reduce((sum, entry) => sum + entry.wellnessScore, 0) / moodEntries.length)
        : 0
    };

    // Get daily activity breakdown
    const dailyActivity = [];
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayMoodEntries = moodEntries.filter(entry => 
        entry.date.toISOString().split('T')[0] === dateStr
      );
      const dayAssessments = assessments.filter(assessment => 
        assessment.date.toISOString().split('T')[0] === dateStr
      );

      dailyActivity.unshift({
        date: dateStr,
        moodEntries: dayMoodEntries.length,
        assessments: dayAssessments.length,
        hasActivity: dayMoodEntries.length > 0 || dayAssessments.length > 0
      });
    }

    res.json({
      activityMetrics,
      dailyActivity,
      recentMoodEntries: moodEntries.slice(0, 5),
      recentAssessments: assessments.slice(0, 5)
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Server error retrieving user activity' });
  }
});

module.exports = router;
