const express = require('express');
const router = express.Router();
const PatientProfile = require('../models/PatientProfile');
const { auth } = require('../middleware/auth');

// Get patient profile by userId (with auth)
router.get('/', auth, async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.json({ profile: null });
    }
    
    res.json({ profile });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update patient profile (upsert)
router.post('/', auth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      zip,
      patientId,
      emergencyContact
    } = req.body;

    let profile = await PatientProfile.findOne({ userId: req.user.id });

    if (profile) {
      // Update existing profile
      profile.firstName = firstName || profile.firstName;
      profile.lastName = lastName || profile.lastName;
      profile.dateOfBirth = dateOfBirth || profile.dateOfBirth;
      profile.gender = gender || profile.gender;
      profile.phone = phone || profile.phone;
      profile.email = email || profile.email;
      profile.addressLine1 = addressLine1 || profile.addressLine1;
      profile.addressLine2 = addressLine2 || profile.addressLine2;
      profile.city = city || profile.city;
      profile.state = state || profile.state;
      profile.zip = zip || profile.zip;
      profile.patientId = patientId || profile.patientId;
      if (emergencyContact) {
        profile.emergencyContact = emergencyContact;
      }

      await profile.save();
    } else {
      // Create new profile
      profile = new PatientProfile({
        userId: req.user.id,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phone,
        email,
        addressLine1,
        addressLine2,
        city,
        state,
        zip,
        patientId,
        emergencyContact
      });

      await profile.save();
    }
    
    res.json({
      message: 'Profile saved successfully',
      profile
    });
  } catch (error) {
    console.error('Error creating/updating patient profile:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
