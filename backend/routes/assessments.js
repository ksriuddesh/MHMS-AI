const express = require('express');
const Assessment = require('../models/Assessment');
const { auth } = require('../middleware/auth');
const predictor = require('../utils/mentalHealthPredictor');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Initialize predictor on first request
let predictorInitialized = false;
const initializePredictor = async () => {
  if (!predictorInitialized) {
    await predictor.initialize();
    predictorInitialized = true;
  }
};

// Create a new assessment
router.post('/', async (req, res) => {
  try {
    await initializePredictor();

    const { date, type, score, maxScore, severity, responses, notes, followUpDate } = req.body;

    // Validate required fields
    if (!type || score === undefined || !maxScore || !severity || !responses) {
      return res.status(400).json({ 
        error: 'Type, score, maxScore, severity, and responses are required' 
      });
    }

    // Validate score ranges
    if (score < 0 || score > maxScore) {
      return res.status(400).json({ 
        error: `Score must be between 0 and ${maxScore}` 
      });
    }

    // Validate severity
    const validSeverities = ['minimal', 'mild', 'moderate', 'severe'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({ 
        error: 'Severity must be one of: minimal, mild, moderate, severe' 
      });
    }

    // Generate recommendations based on assessment type and severity
    const assessment = new Assessment({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      type,
      score,
      maxScore,
      severity,
      responses,
      notes: notes || '',
      followUpDate: followUpDate ? new Date(followUpDate) : null
    });

    // Generate recommendations
    assessment.recommendations = assessment.generateRecommendations();

    // Get AI prediction if it's a PHQ-9 assessment
    if (type === 'PHQ-9' && responses) {
      try {
        // Convert responses to the format expected by the predictor
        const predictionInput = {};
        for (let i = 1; i <= 9; i++) {
          const key = `q${i}_score`;
          predictionInput[key] = responses[i - 1] || responses[key] || 0;
        }

        const prediction = predictor.predictMentalHealthStatus(predictionInput);
        
        if (!prediction.error) {
          assessment.prediction = {
            status: prediction.predicted_status,
            confidence: Math.max(...Object.values(prediction.confidence)),
            modelVersion: prediction.model_version,
            predictedAt: new Date()
          };
        }
      } catch (predictionError) {
        console.error('Prediction error:', predictionError);
        // Continue without prediction if it fails
      }
    }

    await assessment.save();

    res.status(201).json({
      message: 'Assessment created successfully',
      assessment: assessment.toJSON()
    });

  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Server error creating assessment' });
  }
});

// Get all assessments for the user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { userId: req.user._id };
    
    if (type) {
      query.type = type;
    }
    
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
    const total = await Assessment.countDocuments(query);

    // Get assessments with pagination
    const assessments = await Assessment.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    res.json({
      assessments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAssessments: total,
        hasNext: skip + assessments.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Server error retrieving assessments' });
  }
});

// Get a specific assessment
router.get('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('userId', 'name email');

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({ assessment: assessment.toJSON() });

  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Server error retrieving assessment' });
  }
});

// Update an assessment
router.patch('/:id', async (req, res) => {
  try {
    const { score, maxScore, severity, responses, notes, followUpDate } = req.body;

    // Validate score ranges if provided
    if (score !== undefined && maxScore !== undefined) {
      if (score < 0 || score > maxScore) {
        return res.status(400).json({ 
          error: `Score must be between 0 and ${maxScore}` 
        });
      }
    }

    // Validate severity if provided
    if (severity) {
      const validSeverities = ['minimal', 'mild', 'moderate', 'severe'];
      if (!validSeverities.includes(severity)) {
        return res.status(400).json({ 
          error: 'Severity must be one of: minimal, mild, moderate, severe' 
        });
      }
    }

    const assessment = await Assessment.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      {
        ...(score !== undefined && { score }),
        ...(maxScore !== undefined && { maxScore }),
        ...(severity !== undefined && { severity }),
        ...(responses !== undefined && { responses }),
        ...(notes !== undefined && { notes }),
        ...(followUpDate !== undefined && { followUpDate: new Date(followUpDate) })
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Regenerate recommendations if severity changed
    if (severity) {
      assessment.recommendations = assessment.generateRecommendations();
      await assessment.save();
    }

    res.json({
      message: 'Assessment updated successfully',
      assessment: assessment.toJSON()
    });

  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ error: 'Server error updating assessment' });
  }
});

// Delete an assessment
router.delete('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({ message: 'Assessment deleted successfully' });

  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Server error deleting assessment' });
  }
});

// Get assessment statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { type, days = 30 } = req.query;
    
    const stats = await Assessment.getAssessmentStats(req.user._id, type, parseInt(days));
    
    if (stats.length === 0) {
      return res.json({
        message: 'No assessment data available for the specified period',
        stats: []
      });
    }

    // Process severity breakdown
    const processedStats = stats.map(stat => {
      const severityCounts = {};
      stat.severityBreakdown.forEach(severity => {
        severityCounts[severity] = (severityCounts[severity] || 0) + 1;
      });

      return {
        type: stat._id,
        avgScore: Math.round(stat.avgScore * 10) / 10,
        avgPercentage: Math.round(stat.avgPercentage * 10) / 10,
        totalAssessments: stat.totalAssessments,
        severityBreakdown: severityCounts,
        latestAssessment: stat.latestAssessment
      };
    });

    res.json({ stats: processedStats });

  } catch (error) {
    console.error('Get assessment stats error:', error);
    res.status(500).json({ error: 'Server error retrieving assessment statistics' });
  }
});

// Get prediction model statistics
router.get('/prediction/stats', async (req, res) => {
  try {
    await initializePredictor();
    
    const modelStats = predictor.getModelStats();
    
    if (modelStats.error) {
      return res.status(500).json({ error: modelStats.error });
    }

    res.json({ modelStats });

  } catch (error) {
    console.error('Get prediction stats error:', error);
    res.status(500).json({ error: 'Server error retrieving prediction statistics' });
  }
});

// Retrain prediction model
router.post('/prediction/retrain', async (req, res) => {
  try {
    await initializePredictor();
    
    const result = await predictor.retrainModel();
    
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ 
      message: 'Model retrained successfully',
      result 
    });

  } catch (error) {
    console.error('Retrain model error:', error);
    res.status(500).json({ error: 'Server error retraining model' });
  }
});

module.exports = router;
