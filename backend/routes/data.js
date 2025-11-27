const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { auth } = require('../middleware/auth');
const MoodEntry = require('../models/MoodEntry');
const Assessment = require('../models/Assessment');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'), false);
    }
  }
});

// Export user data
router.post('/export', async (req, res) => {
  try {
    const { format = 'json', includeMoodEntries = true, includeAssessments = true } = req.body;
    const userId = req.user._id;

    const exportData = {
      user: req.user.toPublicJSON(),
      exportDate: new Date().toISOString(),
      data: {}
    };

    // Export mood entries
    if (includeMoodEntries) {
      const moodEntries = await MoodEntry.find({ userId })
        .sort({ date: -1 })
        .lean();

      exportData.data.moodEntries = moodEntries.map(entry => ({
        ...entry,
        _id: entry._id.toString(),
        userId: entry.userId.toString()
      }));
    }

    // Export assessments
    if (includeAssessments) {
      const assessments = await Assessment.find({ userId })
        .sort({ date: -1 })
        .lean();

      exportData.data.assessments = assessments.map(assessment => ({
        ...assessment,
        _id: assessment._id.toString(),
        userId: assessment.userId.toString(),
        responses: Object.fromEntries(assessment.responses)
      }));
    }

    // Generate statistics
    exportData.statistics = {
      totalMoodEntries: exportData.data.moodEntries?.length || 0,
      totalAssessments: exportData.data.assessments?.length || 0,
      dateRange: {
        start: exportData.data.moodEntries?.[exportData.data.moodEntries.length - 1]?.date || null,
        end: exportData.data.moodEntries?.[0]?.date || null
      }
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = [];
      
      // Add mood entries to CSV
      if (exportData.data.moodEntries) {
        exportData.data.moodEntries.forEach(entry => {
          csvData.push({
            type: 'mood_entry',
            date: entry.date,
            mood: entry.mood,
            energy: entry.energy,
            anxiety: entry.anxiety,
            sleep: entry.sleep,
            notes: entry.notes || '',
            factors: entry.factors.join(';'),
            location: entry.location || '',
            tags: entry.tags.join(';')
          });
        });
      }

      // Add assessments to CSV
      if (exportData.data.assessments) {
        exportData.data.assessments.forEach(assessment => {
          csvData.push({
            type: 'assessment',
            date: assessment.date,
            assessmentType: assessment.type,
            score: assessment.score,
            maxScore: assessment.maxScore,
            severity: assessment.severity,
            notes: assessment.notes || '',
            responses: JSON.stringify(Object.fromEntries(assessment.responses))
          });
        });
      }

      // Convert to CSV string
      const csvHeaders = Object.keys(csvData[0] || {});
      const csvString = [
        csvHeaders.join(','),
        ...csvData.map(row => csvHeaders.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="mhms-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvString);

    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="mhms-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Server error exporting data' });
  }
});

// Import user data
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const userId = req.user._id;

    let importData = [];

    if (fileExtension === '.csv') {
      // Parse CSV file
      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve())
          .on('error', (error) => reject(error));
      });
      importData = results;
    } else if (fileExtension === '.json') {
      // Parse JSON file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(fileContent);
      importData = parsedData.data ? parsedData.data : parsedData;
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    // Validate and process import data
    const importResults = {
      moodEntries: { imported: 0, errors: 0, errors: [] },
      assessments: { imported: 0, errors: 0, errors: [] }
    };

    for (const item of importData) {
      try {
        if (item.type === 'mood_entry' || item.mood !== undefined) {
          // Import mood entry
          const moodEntryData = {
            userId,
            date: new Date(item.date),
            mood: parseInt(item.mood),
            energy: parseInt(item.energy),
            anxiety: parseInt(item.anxiety),
            sleep: parseInt(item.sleep),
            notes: item.notes || '',
            factors: item.factors ? item.factors.split(';').filter(f => f) : [],
            location: item.location || '',
            tags: item.tags ? item.tags.split(';').filter(t => t) : []
          };

          // Validate data
          if (moodEntryData.mood < 1 || moodEntryData.mood > 10 ||
              moodEntryData.energy < 1 || moodEntryData.energy > 10 ||
              moodEntryData.anxiety < 1 || moodEntryData.anxiety > 10 ||
              moodEntryData.sleep < 1 || moodEntryData.sleep > 10) {
            throw new Error('Invalid score values');
          }

          // Check for existing entry on the same date
          const existingEntry = await MoodEntry.findOne({
            userId,
            date: {
              $gte: new Date(moodEntryData.date.setHours(0, 0, 0, 0)),
              $lt: new Date(moodEntryData.date.setHours(23, 59, 59, 999))
            }
          });

          if (existingEntry) {
            // Update existing entry
            await MoodEntry.findByIdAndUpdate(existingEntry._id, moodEntryData);
          } else {
            // Create new entry
            await MoodEntry.create(moodEntryData);
          }

          importResults.moodEntries.imported++;

        } else if (item.type === 'assessment' || item.assessmentType !== undefined) {
          // Import assessment
          const assessmentData = {
            userId,
            date: new Date(item.date),
            type: item.assessmentType || item.type,
            score: parseInt(item.score),
            maxScore: parseInt(item.maxScore),
            severity: item.severity,
            notes: item.notes || '',
            responses: new Map()
          };

          // Parse responses
          if (item.responses) {
            try {
              const responses = typeof item.responses === 'string' 
                ? JSON.parse(item.responses) 
                : item.responses;
              
              Object.entries(responses).forEach(([key, value]) => {
                assessmentData.responses.set(key, parseInt(value));
              });
            } catch (error) {
              throw new Error('Invalid responses format');
            }
          }

          // Validate data
          if (assessmentData.score < 0 || assessmentData.score > assessmentData.maxScore) {
            throw new Error('Invalid score values');
          }

          const validSeverities = ['minimal', 'mild', 'moderate', 'severe'];
          if (!validSeverities.includes(assessmentData.severity)) {
            throw new Error('Invalid severity level');
          }

          // Generate recommendations
          const assessment = new Assessment(assessmentData);
          assessment.recommendations = assessment.generateRecommendations();

          await assessment.save();
          importResults.assessments.imported++;

        }
      } catch (error) {
        if (item.type === 'mood_entry' || item.mood !== undefined) {
          importResults.moodEntries.errors++;
          importResults.moodEntries.errors.push(`Row ${importData.indexOf(item) + 1}: ${error.message}`);
        } else if (item.type === 'assessment' || item.assessmentType !== undefined) {
          importResults.assessments.errors++;
          importResults.assessments.errors.push(`Row ${importData.indexOf(item) + 1}: ${error.message}`);
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: 'Data import completed',
      results: importResults,
      summary: {
        totalProcessed: importData.length,
        totalImported: importResults.moodEntries.imported + importResults.assessments.imported,
        totalErrors: importResults.moodEntries.errors + importResults.assessments.errors
      }
    });

  } catch (error) {
    console.error('Import data error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Server error importing data' });
  }
});

// Get data summary for user
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts
    const totalMoodEntries = await MoodEntry.countDocuments({ userId });
    const totalAssessments = await Assessment.countDocuments({ userId });

    // Get date ranges
    const firstMoodEntry = await MoodEntry.findOne({ userId }).sort({ date: 1 });
    const lastMoodEntry = await MoodEntry.findOne({ userId }).sort({ date: -1 });
    const firstAssessment = await Assessment.findOne({ userId }).sort({ date: 1 });
    const lastAssessment = await Assessment.findOne({ userId }).sort({ date: -1 });

    // Get recent activity
    const recentMoodEntries = await MoodEntry.find({ userId })
      .sort({ date: -1 })
      .limit(5);

    const recentAssessments = await Assessment.find({ userId })
      .sort({ date: -1 })
      .limit(5);

    res.json({
      summary: {
        totalMoodEntries,
        totalAssessments,
        dateRanges: {
          moodEntries: {
            first: firstMoodEntry?.date || null,
            last: lastMoodEntry?.date || null
          },
          assessments: {
            first: firstAssessment?.date || null,
            last: lastAssessment?.date || null
          }
        },
        recentActivity: {
          moodEntries: recentMoodEntries.length,
          assessments: recentAssessments.length
        }
      }
    });

  } catch (error) {
    console.error('Get data summary error:', error);
    res.status(500).json({ error: 'Server error retrieving data summary' });
  }
});

module.exports = router;
