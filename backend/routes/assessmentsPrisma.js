const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { body, validationResult } = require('express-validator');

// Get all assessments for a user
router.get('/:userId', async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { userId: req.params.userId },
      orderBy: { date: 'desc' }
    });
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single assessment
router.get('/entry/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id }
    });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create assessment
router.post('/', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('score').isInt().withMessage('Score must be an integer'),
  body('maxScore').isInt().withMessage('Max score must be an integer'),
  body('severity').isIn(['minimal', 'mild', 'moderate', 'severe']).withMessage('Invalid severity')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const assessment = await prisma.assessment.create({
      data: {
        userId: req.body.userId,
        type: req.body.type,
        date: req.body.date,
        score: req.body.score,
        maxScore: req.body.maxScore,
        severity: req.body.severity,
        responses: req.body.responses || {},
        questions: req.body.questions || [],
        followUpQuestions: req.body.followUpQuestions || [],
        followUpResponses: req.body.followUpResponses || null,
        domain: req.body.domain || null
      }
    });
    res.status(201).json(assessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update assessment
router.put('/:id', async (req, res) => {
  try {
    const assessment = await prisma.assessment.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(assessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete assessment
router.delete('/:id', async (req, res) => {
  try {
    await prisma.assessment.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
