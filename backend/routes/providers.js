const express = require('express');
const Provider = require('../models/Provider');

const router = express.Router();

// Get all providers (public endpoint, no auth required)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      specialty, 
      city, 
      state, 
      available, 
      acceptsInsurance, 
      telehealth, 
      minRating,
      languages 
    } = req.query;

    const filters = {};
    
    if (specialty) filters.specialty = specialty;
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (available !== undefined) filters.available = available === 'true';
    if (acceptsInsurance !== undefined) filters.acceptsInsurance = acceptsInsurance === 'true';
    if (telehealth !== undefined) filters.telehealth = telehealth === 'true';
    if (minRating) filters.minRating = parseFloat(minRating);
    if (languages) filters.languages = languages.split(',');

    const providers = await Provider.searchProviders(filters, parseInt(page), parseInt(limit));
    const total = await Provider.countDocuments({ active: true });

    res.json({
      providers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProviders: total,
        hasNext: (parseInt(page) - 1) * parseInt(limit) + providers.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Server error retrieving providers' });
  }
});

// Get a specific provider
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider || !provider.active) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({ provider: provider.toJSON() });

  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ error: 'Server error retrieving provider' });
  }
});

// Get provider statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Provider.getProviderStats();
    
    if (stats.length === 0) {
      return res.json({
        message: 'No provider data available',
        stats: {
          totalProviders: 0,
          avgRating: 0,
          availableProviders: 0,
          telehealthProviders: 0,
          insuranceProviders: 0
        }
      });
    }

    const stat = stats[0];
    res.json({
      stats: {
        totalProviders: stat.totalProviders,
        avgRating: Math.round(stat.avgRating * 10) / 10,
        availableProviders: stat.availableProviders,
        telehealthProviders: stat.telehealthProviders,
        insuranceProviders: stat.insuranceProviders
      }
    });

  } catch (error) {
    console.error('Get provider stats error:', error);
    res.status(500).json({ error: 'Server error retrieving provider statistics' });
  }
});

// Search providers by specialty
router.get('/search/specialty/:specialty', async (req, res) => {
  try {
    const { specialty } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const providers = await Provider.searchProviders(
      { specialty: new RegExp(specialty, 'i') }, 
      parseInt(page), 
      parseInt(limit)
    );

    res.json({ providers });

  } catch (error) {
    console.error('Search providers by specialty error:', error);
    res.status(500).json({ error: 'Server error searching providers' });
  }
});

// Get providers by location
router.get('/search/location', async (req, res) => {
  try {
    const { city, state, page = 1, limit = 10 } = req.query;

    if (!city && !state) {
      return res.status(400).json({ error: 'City or state is required' });
    }

    const filters = {};
    if (city) filters.city = city;
    if (state) filters.state = state;

    const providers = await Provider.searchProviders(filters, parseInt(page), parseInt(limit));

    res.json({ providers });

  } catch (error) {
    console.error('Search providers by location error:', error);
    res.status(500).json({ error: 'Server error searching providers by location' });
  }
});

// Get telehealth providers
router.get('/telehealth/available', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const providers = await Provider.searchProviders(
      { telehealth: true, available: true }, 
      parseInt(page), 
      parseInt(limit)
    );

    res.json({ providers });

  } catch (error) {
    console.error('Get telehealth providers error:', error);
    res.status(500).json({ error: 'Server error retrieving telehealth providers' });
  }
});

// Get providers that accept insurance
router.get('/insurance/accepted', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const providers = await Provider.searchProviders(
      { acceptsInsurance: true }, 
      parseInt(page), 
      parseInt(limit)
    );

    res.json({ providers });

  } catch (error) {
    console.error('Get insurance providers error:', error);
    res.status(500).json({ error: 'Server error retrieving insurance providers' });
  }
});

module.exports = router;
