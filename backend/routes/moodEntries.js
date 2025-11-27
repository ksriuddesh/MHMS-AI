const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { body, validationResult } = require('express-validator');

// Get all mood entries for a user
router.get('/:userId', async (req, res) => {
  try {
    const entries = await prisma.moodEntry.findMany({
      where: { userId: req.params.userId },
      orderBy: { date: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single mood entry
router.get('/entry/:id', async (req, res) => {
  try {
    const entry = await prisma.moodEntry.findUnique({
      where: { id: req.params.id }
    });
    if (!entry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error('Error fetching mood entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create mood entry
router.post('/', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('mood').isInt({ min: 0, max: 10 }).withMessage('Mood must be between 0 and 10'),
  body('energy').isInt({ min: 0, max: 10 }).withMessage('Energy must be between 0 and 10'),
  body('anxiety').isInt({ min: 0, max: 10 }).withMessage('Anxiety must be between 0 and 10'),
  body('sleep').isInt({ min: 0, max: 10 }).withMessage('Sleep must be between 0 and 10')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const entry = await prisma.moodEntry.create({
      data: {
        userId: req.body.userId,
        date: req.body.date,
        mood: req.body.mood,
        energy: req.body.energy,
        anxiety: req.body.anxiety,
        sleep: req.body.sleep,
        notes: req.body.notes || '',
        factors: req.body.factors || [],
        location: req.body.location || null
      }
    });
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating mood entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update mood entry
router.put('/:id', async (req, res) => {
  try {
    const entry = await prisma.moodEntry.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(entry);
  } catch (error) {
    console.error('Error updating mood entry:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Mood entry not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete mood entry
router.delete('/:id', async (req, res) => {
  try {
    await prisma.moodEntry.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Mood entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Mood entry not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
