const express = require('express');
const MoodEntry = require('../models/MoodEntry');
const Assessment = require('../models/Assessment');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get comprehensive dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get today's mood entry
    const todayEntry = await MoodEntry.findOne({
      userId,
      date: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    });

    // Calculate daily score
    let dailyScore = 0;
    if (todayEntry) {
      dailyScore = todayEntry.wellnessScore;
    }

    // Get weekly mood entries for trend calculation
    const weeklyEntries = await MoodEntry.find({
      userId,
      date: { $gte: weekAgo }
    }).sort({ date: -1 });

    const previousWeekEntries = await MoodEntry.find({
      userId,
      date: { $gte: twoWeeksAgo, $lt: weekAgo }
    }).sort({ date: -1 });

    // Calculate weekly trend
    let weeklyTrend = 0;
    if (weeklyEntries.length > 0) {
      const currentWeekAvg = weeklyEntries.reduce((sum, entry) => sum + entry.wellnessScore, 0) / weeklyEntries.length;
      const previousWeekAvg = previousWeekEntries.length > 0 
        ? previousWeekEntries.reduce((sum, entry) => sum + entry.wellnessScore, 0) / previousWeekEntries.length
        : currentWeekAvg;
      
      weeklyTrend = Math.round(currentWeekAvg - previousWeekAvg);
    }

    // Get recent activity (last 5 entries)
    const recentMoodEntries = await MoodEntry.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('userId', 'name');

    const recentAssessments = await Assessment.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('userId', 'name');

    // Combine and sort recent activity
    const recentActivity = [...recentMoodEntries, ...recentAssessments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(item => ({
        id: item._id,
        type: item.constructor.modelName === 'MoodEntry' ? 'mood' : 'assessment',
        date: item.date,
        title: item.constructor.modelName === 'MoodEntry' 
          ? `Mood: ${item.mood}/10` 
          : `${item.type}: ${item.score}/${item.maxScore}`,
        description: item.constructor.modelName === 'MoodEntry'
          ? `Energy: ${item.energy}/10, Sleep: ${item.sleep}/10`
          : `Severity: ${item.severity}`,
        score: item.constructor.modelName === 'MoodEntry' ? item.wellnessScore : item.score
      }));

    // Wellness goals (static for now, can be made dynamic later)
    const wellnessGoals = [
      {
        id: 1,
        title: 'Daily Mood Tracking',
        description: 'Track your mood every day',
        progress: recentMoodEntries.length,
        target: 7,
        unit: 'days',
        completed: recentMoodEntries.length >= 7
      },
      {
        id: 2,
        title: 'Weekly Assessment',
        description: 'Complete a mental health assessment',
        progress: recentAssessments.filter(a => 
          new Date(a.date) >= weekAgo
        ).length,
        target: 1,
        unit: 'assessments',
        completed: recentAssessments.filter(a => 
          new Date(a.date) >= weekAgo
        ).length >= 1
      },
      {
        id: 3,
        title: 'Sleep Quality',
        description: 'Maintain good sleep quality',
        progress: recentMoodEntries.length > 0 
          ? Math.round(recentMoodEntries.reduce((sum, entry) => sum + entry.sleep, 0) / recentMoodEntries.length)
          : 0,
        target: 7,
        unit: 'average score',
        completed: recentMoodEntries.length > 0 && 
          recentMoodEntries.reduce((sum, entry) => sum + entry.sleep, 0) / recentMoodEntries.length >= 7
      }
    ];

    // Latest achievement
    let latestAchievement = null;
    const completedGoals = wellnessGoals.filter(goal => goal.completed);
    if (completedGoals.length > 0) {
      const latestGoal = completedGoals[0];
      latestAchievement = {
        id: latestGoal.id,
        title: `Completed: ${latestGoal.title}`,
        description: `You achieved your goal of ${latestGoal.title.toLowerCase()}`,
        date: new Date(),
        type: 'goal_completion'
      };
    }

    // Mood trends for the last 7 days
    const moodTrends = await MoodEntry.aggregate([
      { $match: { userId: userId, date: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          avgMood: { $avg: "$mood" },
          avgEnergy: { $avg: "$energy" },
          avgAnxiety: { $avg: "$anxiety" },
          avgSleep: { $avg: "$sleep" },
          wellnessScore: { $avg: "$wellnessScore" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Assessment summary
    const assessmentSummary = await Assessment.aggregate([
      { $match: { userId: userId, date: { $gte: weekAgo } } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          avgScore: { $avg: "$score" },
          avgPercentage: { $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] } }
        }
      }
    ]);

    res.json({
      dailyScore,
      weeklyTrend,
      recentActivity,
      wellnessGoals,
      latestAchievement,
      moodTrends,
      assessmentSummary,
      insights: {
        totalMoodEntries: await MoodEntry.countDocuments({ userId }),
        totalAssessments: await Assessment.countDocuments({ userId }),
        streakDays: recentMoodEntries.length,
        averageWellnessScore: recentMoodEntries.length > 0 
          ? Math.round(recentMoodEntries.reduce((sum, entry) => sum + entry.wellnessScore, 0) / recentMoodEntries.length)
          : 0
      }
    });

  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Server error retrieving dashboard metrics' });
  }
});

// Get mood trends for charts
router.get('/trends/mood', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trends = await MoodEntry.aggregate([
      { $match: { userId: req.user._id, date: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          mood: { $avg: "$mood" },
          energy: { $avg: "$energy" },
          anxiety: { $avg: "$anxiety" },
          sleep: { $avg: "$sleep" },
          wellnessScore: { $avg: "$wellnessScore" },
          factors: { $push: "$factors" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ trends });

  } catch (error) {
    console.error('Get mood trends error:', error);
    res.status(500).json({ error: 'Server error retrieving mood trends' });
  }
});

// Get assessment trends
router.get('/trends/assessments', async (req, res) => {
  try {
    const { days = 30, type } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const match = { userId: req.user._id, date: { $gte: startDate } };
    if (type) match.type = type;

    const trends = await Assessment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          avgScore: { $avg: "$score" },
          avgPercentage: { $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] } },
          count: { $sum: 1 },
          severityBreakdown: { $push: "$severity" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ trends });

  } catch (error) {
    console.error('Get assessment trends error:', error);
    res.status(500).json({ error: 'Server error retrieving assessment trends' });
  }
});

// Get wellness insights
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user._id;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get recent mood entries
    const recentEntries = await MoodEntry.find({
      userId,
      date: { $gte: weekAgo }
    }).sort({ date: -1 });

    if (recentEntries.length === 0) {
      return res.json({
        message: 'No recent data available for insights',
        insights: []
      });
    }

    const insights = [];

    // Mood consistency insight
    const moodScores = recentEntries.map(entry => entry.mood);
    const moodVariance = Math.max(...moodScores) - Math.min(...moodScores);
    if (moodVariance > 5) {
      insights.push({
        type: 'mood_volatility',
        title: 'Mood Variability Detected',
        description: 'Your mood has been quite variable recently. Consider what might be causing these fluctuations.',
        severity: 'medium',
        suggestion: 'Try to identify patterns in what affects your mood and develop coping strategies.'
      });
    }

    // Sleep quality insight
    const avgSleep = recentEntries.reduce((sum, entry) => sum + entry.sleep, 0) / recentEntries.length;
    if (avgSleep < 6) {
      insights.push({
        type: 'sleep_quality',
        title: 'Sleep Quality Concern',
        description: 'Your average sleep quality is below recommended levels.',
        severity: 'high',
        suggestion: 'Consider improving your sleep hygiene and establishing a consistent bedtime routine.'
      });
    }

    // Anxiety levels insight
    const avgAnxiety = recentEntries.reduce((sum, entry) => sum + entry.anxiety, 0) / recentEntries.length;
    if (avgAnxiety > 7) {
      insights.push({
        type: 'anxiety_levels',
        title: 'Elevated Anxiety Levels',
        description: 'Your anxiety levels have been consistently high.',
        severity: 'high',
        suggestion: 'Consider practicing relaxation techniques or speaking with a mental health professional.'
      });
    }

    // Common factors insight
    const allFactors = recentEntries.flatMap(entry => entry.factors);
    const factorCounts = {};
    allFactors.forEach(factor => {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    });

    const mostCommonFactor = Object.entries(factorCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommonFactor && mostCommonFactor[1] > 3) {
      insights.push({
        type: 'common_factor',
        title: 'Frequent Factor Identified',
        description: `${mostCommonFactor[0]} appears frequently in your mood entries.`,
        severity: 'low',
        suggestion: 'Consider how this factor affects your mental health and what you can do to manage it.'
      });
    }

    res.json({ insights });

  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Server error retrieving insights' });
  }
});

module.exports = router;
