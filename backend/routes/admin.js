const express = require('express');
const prisma = require('../prisma/client');

const router = express.Router();

// Get all users with their data counts
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            moodEntries: true,
            assessments: true
          }
        },
        patientProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const usersWithStats = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      moodEntriesCount: user._count.moodEntries,
      assessmentsCount: user._count.assessments,
      hasProfile: !!user.patientProfile,
      profileComplete: user.patientProfile ? !!(
        user.patientProfile.firstName &&
        user.patientProfile.lastName &&
        user.patientProfile.dateOfBirth &&
        user.patientProfile.gender
      ) : false
    }));

    res.json({
      success: true,
      count: usersWithStats.length,
      users: usersWithStats
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get specific user's complete data
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: true,
        moodEntries: {
          orderBy: { date: 'desc' },
          take: 50
        },
        assessments: {
          orderBy: { date: 'desc' },
          take: 50
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format mood entries with mood as string
    const moodEntries = user.moodEntries.map(entry => ({
      ...entry,
      moodString: getMoodString(entry.mood),
      energyString: getEnergyString(entry.energy),
      anxietyString: getAnxietyString(entry.anxiety),
      sleepString: getSleepString(entry.sleep)
    }));

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.patientProfile,
        moodEntries,
        assessments: user.assessments,
        stats: {
          totalMoodEntries: user.moodEntries.length,
          totalAssessments: user.assessments.length,
          avgMood: calculateAverage(user.moodEntries.map(e => e.mood)),
          avgEnergy: calculateAverage(user.moodEntries.map(e => e.energy)),
          avgAnxiety: calculateAverage(user.moodEntries.map(e => e.anxiety)),
          avgSleep: calculateAverage(user.moodEntries.map(e => e.sleep))
        }
      }
    });
  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Get all mood entries across all users
router.get('/mood-entries', async (req, res) => {
  try {
    const entries = await prisma.moodEntry.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    const formattedEntries = entries.map(entry => ({
      ...entry,
      moodString: getMoodString(entry.mood),
      energyString: getEnergyString(entry.energy),
      anxietyString: getAnxietyString(entry.anxiety),
      sleepString: getSleepString(entry.sleep),
      userName: `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || entry.user.email
    }));

    res.json({
      success: true,
      count: formattedEntries.length,
      entries: formattedEntries
    });
  } catch (error) {
    console.error('Get mood entries error:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// Get all assessments across all users
router.get('/assessments', async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    const formattedAssessments = assessments.map(assessment => ({
      ...assessment,
      userName: `${assessment.user.firstName || ''} ${assessment.user.lastName || ''}`.trim() || assessment.user.email
    }));

    res.json({
      success: true,
      count: formattedAssessments.length,
      assessments: formattedAssessments
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalMoodEntries,
      totalAssessments,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.moodEntry.count(),
      prisma.assessment.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true
        }
      })
    ]);

    // Get mood entries from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoodEntries = await prisma.moodEntry.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    const avgMood = calculateAverage(recentMoodEntries.map(e => e.mood));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalMoodEntries,
        totalAssessments,
        avgMoodLast7Days: avgMood,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Helper functions
function getMoodString(mood) {
  if (mood >= 9) return 'Excellent';
  if (mood >= 7) return 'Good';
  if (mood >= 5) return 'Okay';
  if (mood >= 3) return 'Low';
  return 'Very Low';
}

function getEnergyString(energy) {
  if (energy >= 8) return 'High Energy';
  if (energy >= 5) return 'Moderate';
  if (energy >= 3) return 'Low';
  return 'Very Low';
}

function getAnxietyString(anxiety) {
  if (anxiety >= 8) return 'High Anxiety';
  if (anxiety >= 5) return 'Moderate';
  if (anxiety >= 3) return 'Mild';
  return 'Minimal';
}

function getSleepString(sleep) {
  if (sleep >= 8) return 'Excellent Sleep';
  if (sleep >= 6) return 'Good Sleep';
  if (sleep >= 4) return 'Fair Sleep';
  return 'Poor Sleep';
}

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return Math.round((sum / numbers.length) * 10) / 10;
}

module.exports = router;
