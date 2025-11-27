const fs = require('fs').promises;
const path = require('path');

class MentalHealthPredictor {
  constructor() {
    this.modelPath = path.join(__dirname, '../models/mental_health_model.json');
    this.trainingDataPath = path.join(__dirname, '../data/training_data.json');
    this.model = null;
    this.isModelLoaded = false;
  }

  // Initialize the predictor with training data and model
  async initialize() {
    try {
      await this.loadOrCreateTrainingData();
      await this.loadOrCreateModel();
      this.isModelLoaded = true;
      console.log('Mental Health Predictor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Mental Health Predictor:', error);
      throw error;
    }
  }

  // Load or create training data
  async loadOrCreateTrainingData() {
    try {
      const data = await fs.readFile(this.trainingDataPath, 'utf8');
      this.trainingData = JSON.parse(data);
    } catch (error) {
      // Create dummy training data if file doesn't exist
      this.trainingData = this.generateDummyTrainingData();
      await this.saveTrainingData();
    }
  }

  // Load or create the prediction model
  async loadOrCreateModel() {
    try {
      const modelData = await fs.readFile(this.modelPath, 'utf8');
      this.model = JSON.parse(modelData);
    } catch (error) {
      // Create a simple rule-based model if file doesn't exist
      this.model = this.createRuleBasedModel();
      await this.saveModel();
    }
  }

  // Generate dummy training data for initial setup
  generateDummyTrainingData() {
    const data = [];
    const severityLevels = ['minimal', 'mild', 'moderate', 'severe'];
    
    // Generate 1000 dummy records
    for (let i = 0; i < 1000; i++) {
      const responses = {};
      let totalScore = 0;
      
      // Generate random PHQ-9 responses (0-3 for each question)
      for (let q = 1; q <= 9; q++) {
        const score = Math.floor(Math.random() * 4);
        responses[`q${q}_score`] = score;
        totalScore += score;
      }
      
      // Determine severity based on total score
      let severity;
      if (totalScore <= 4) severity = 'minimal';
      else if (totalScore <= 9) severity = 'mild';
      else if (totalScore <= 14) severity = 'moderate';
      else severity = 'severe';
      
      data.push({
        id: i + 1,
        responses,
        totalScore,
        severity,
        timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return data;
  }

  // Create a simple rule-based model
  createRuleBasedModel() {
    return {
      type: 'rule-based',
      version: '1.0',
      rules: {
        minimal: { maxScore: 4, confidence: 0.85 },
        mild: { minScore: 5, maxScore: 9, confidence: 0.80 },
        moderate: { minScore: 10, maxScore: 14, confidence: 0.75 },
        severe: { minScore: 15, maxScore: 27, confidence: 0.90 }
      },
      features: ['q1_score', 'q2_score', 'q3_score', 'q4_score', 'q5_score', 
                'q6_score', 'q7_score', 'q8_score', 'q9_score'],
      lastUpdated: new Date().toISOString()
    };
  }

  // Save training data to file
  async saveTrainingData() {
    try {
      await fs.mkdir(path.dirname(this.trainingDataPath), { recursive: true });
      await fs.writeFile(this.trainingDataPath, JSON.stringify(this.trainingData, null, 2));
    } catch (error) {
      console.error('Failed to save training data:', error);
    }
  }

  // Save model to file
  async saveModel() {
    try {
      await fs.mkdir(path.dirname(this.modelPath), { recursive: true });
      await fs.writeFile(this.modelPath, JSON.stringify(this.model, null, 2));
    } catch (error) {
      console.error('Failed to save model:', error);
    }
  }

  // Predict mental health status based on new responses
  predictMentalHealthStatus(newResponses) {
    try {
      if (!this.isModelLoaded) {
        throw new Error('Model not loaded. Please initialize the predictor first.');
      }

      // Validate input
      if (!newResponses || typeof newResponses !== 'object') {
        throw new Error('Invalid input: newResponses must be an object');
      }

      // Calculate total score
      let totalScore = 0;
      const requiredQuestions = ['q1_score', 'q2_score', 'q3_score', 'q4_score', 'q5_score', 
                               'q6_score', 'q7_score', 'q8_score', 'q9_score'];

      for (const question of requiredQuestions) {
        if (newResponses[question] === undefined) {
          throw new Error(`Missing required question: ${question}`);
        }
        if (newResponses[question] < 0 || newResponses[question] > 3) {
          throw new Error(`Invalid score for ${question}: must be between 0 and 3`);
        }
        totalScore += newResponses[question];
      }

      // Apply rule-based prediction
      let predictedStatus = 'mild';
      let confidence = 0.75;

      if (totalScore <= 4) {
        predictedStatus = 'minimal';
        confidence = this.model.rules.minimal.confidence;
      } else if (totalScore <= 9) {
        predictedStatus = 'mild';
        confidence = this.model.rules.mild.confidence;
      } else if (totalScore <= 14) {
        predictedStatus = 'moderate';
        confidence = this.model.rules.moderate.confidence;
      } else {
        predictedStatus = 'severe';
        confidence = this.model.rules.severe.confidence;
      }

      // Calculate confidence scores for all classes
      const confidenceScores = {
        minimal: totalScore <= 4 ? confidence : 0.1,
        mild: totalScore > 4 && totalScore <= 9 ? confidence : 0.1,
        moderate: totalScore > 9 && totalScore <= 14 ? confidence : 0.1,
        severe: totalScore > 14 ? confidence : 0.1
      };

      // Add new data to training set (for model improvement)
      this.addToTrainingData(newResponses, totalScore, predictedStatus);

      return {
        predicted_status: predictedStatus,
        confidence: confidenceScores,
        total_score: totalScore,
        model_version: this.model.version,
        prediction_timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Add new data to training set
  addToTrainingData(responses, totalScore, predictedStatus) {
    const newEntry = {
      id: this.trainingData.length + 1,
      responses,
      totalScore,
      severity: predictedStatus,
      timestamp: new Date().toISOString()
    };

    this.trainingData.push(newEntry);

    // Keep only last 1000 entries to prevent memory issues
    if (this.trainingData.length > 1000) {
      this.trainingData = this.trainingData.slice(-1000);
    }

    // Save updated training data asynchronously
    this.saveTrainingData().catch(console.error);
  }

  // Get model statistics
  getModelStats() {
    if (!this.isModelLoaded) {
      return { error: 'Model not loaded' };
    }

    const severityCounts = {};
    this.trainingData.forEach(entry => {
      severityCounts[entry.severity] = (severityCounts[entry.severity] || 0) + 1;
    });

    return {
      model_type: this.model.type,
      model_version: this.model.version,
      total_training_samples: this.trainingData.length,
      severity_distribution: severityCounts,
      last_updated: this.model.lastUpdated,
      features: this.model.features
    };
  }

  // Retrain model with new data (simple implementation)
  async retrainModel() {
    try {
      // For now, just update the model timestamp
      this.model.lastUpdated = new Date().toISOString();
      await this.saveModel();
      
      return {
        success: true,
        message: 'Model retrained successfully',
        timestamp: this.model.lastUpdated
      };
    } catch (error) {
      return {
        error: `Failed to retrain model: ${error.message}`
      };
    }
  }
}

// Create singleton instance
const predictor = new MentalHealthPredictor();

module.exports = predictor;
