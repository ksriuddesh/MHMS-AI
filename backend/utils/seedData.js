const mongoose = require('mongoose');
const User = require('../models/User');
const Provider = require('../models/Provider');
const MoodEntry = require('../models/MoodEntry');
const Assessment = require('../models/Assessment');
require('dotenv').config({ path: './config.env' });

// Sample providers data
const sampleProviders = [
  {
    name: 'Dr. Sarah Mitchell',
    specialty: 'Clinical Psychology',
    languages: ['English', 'Spanish'],
    rating: 4.9,
    available: true,
    acceptsInsurance: true,
    avatar: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=400',
    distance: '2.3 miles',
    nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000),
    contact: {
      phone: '(555) 123-4567',
      email: 'sarah.mitchell@example.com',
      website: 'https://dr-sarah-mitchell.com'
    },
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    credentials: {
      license: 'NY-12345',
      education: 'Ph.D. Clinical Psychology, Columbia University',
      certifications: ['Licensed Clinical Psychologist', 'CBT Specialist']
    },
    services: ['Individual Therapy', 'Couples Counseling', 'Anxiety Treatment', 'Depression Treatment'],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'Cigna', 'UnitedHealth'],
    slidingScale: true,
    telehealth: true,
    inPerson: true,
    specialties: ['Anxiety Disorders', 'Depression', 'Trauma', 'Relationship Issues'],
    ageGroups: ['adolescents', 'adults']
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'Psychiatry',
    languages: ['English', 'Mandarin'],
    rating: 4.8,
    available: true,
    acceptsInsurance: true,
    avatar: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=400',
    distance: '1.8 miles',
    nextAvailable: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    contact: {
      phone: '(555) 234-5678',
      email: 'michael.chen@example.com',
      website: 'https://dr-michael-chen.com'
    },
    address: {
      street: '456 Oak Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      country: 'USA'
    },
    credentials: {
      license: 'NY-67890',
      education: 'M.D. Psychiatry, Harvard Medical School',
      certifications: ['Board Certified Psychiatrist', 'Addiction Medicine Specialist']
    },
    services: ['Medication Management', 'Psychiatric Evaluation', 'Addiction Treatment', 'Mood Disorders'],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'Medicare', 'Medicaid'],
    slidingScale: false,
    telehealth: true,
    inPerson: true,
    specialties: ['Mood Disorders', 'Anxiety Disorders', 'Addiction', 'ADHD'],
    ageGroups: ['adolescents', 'adults', 'seniors']
  },
  {
    name: 'Dr. Emma Rodriguez',
    specialty: 'Cognitive Behavioral Therapy',
    languages: ['English', 'Spanish'],
    rating: 4.7,
    available: false,
    acceptsInsurance: true,
    avatar: 'https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=400',
    distance: '3.1 miles',
    nextAvailable: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    contact: {
      phone: '(555) 345-6789',
      email: 'emma.rodriguez@example.com',
      website: 'https://dr-emma-rodriguez.com'
    },
    address: {
      street: '789 Pine Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      country: 'USA'
    },
    credentials: {
      license: 'NY-11111',
      education: 'Ph.D. Clinical Psychology, NYU',
      certifications: ['Licensed Clinical Psychologist', 'CBT Certified']
    },
    services: ['CBT Therapy', 'Anxiety Treatment', 'Depression Treatment', 'Stress Management'],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'Cigna'],
    slidingScale: true,
    telehealth: true,
    inPerson: true,
    specialties: ['Cognitive Behavioral Therapy', 'Anxiety', 'Depression', 'Stress'],
    ageGroups: ['adolescents', 'adults']
  },
  {
    name: 'Dr. James Wilson',
    specialty: 'Child and Adolescent Psychology',
    languages: ['English'],
    rating: 4.6,
    available: true,
    acceptsInsurance: true,
    avatar: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=400',
    distance: '4.2 miles',
    nextAvailable: new Date(Date.now() + 6 * 60 * 60 * 1000),
    contact: {
      phone: '(555) 456-7890',
      email: 'james.wilson@example.com',
      website: 'https://dr-james-wilson.com'
    },
    address: {
      street: '321 Elm Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10004',
      country: 'USA'
    },
    credentials: {
      license: 'NY-22222',
      education: 'Ph.D. Child Psychology, Stanford University',
      certifications: ['Licensed Child Psychologist', 'Play Therapy Specialist']
    },
    services: ['Child Therapy', 'Adolescent Counseling', 'Family Therapy', 'ADHD Assessment'],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'Cigna', 'UnitedHealth'],
    slidingScale: true,
    telehealth: false,
    inPerson: true,
    specialties: ['Child Psychology', 'Adolescent Issues', 'Family Therapy', 'ADHD'],
    ageGroups: ['children', 'adolescents']
  },
  {
    name: 'Dr. Lisa Thompson',
    specialty: 'Trauma and PTSD Specialist',
    languages: ['English', 'French'],
    rating: 4.9,
    available: true,
    acceptsInsurance: true,
    avatar: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=400',
    distance: '2.7 miles',
    nextAvailable: new Date(Date.now() + 12 * 60 * 60 * 1000),
    contact: {
      phone: '(555) 567-8901',
      email: 'lisa.thompson@example.com',
      website: 'https://dr-lisa-thompson.com'
    },
    address: {
      street: '654 Maple Drive',
      city: 'New York',
      state: 'NY',
      zipCode: '10005',
      country: 'USA'
    },
    credentials: {
      license: 'NY-33333',
      education: 'Ph.D. Clinical Psychology, UCLA',
      certifications: ['Licensed Clinical Psychologist', 'EMDR Certified', 'Trauma Specialist']
    },
    services: ['Trauma Therapy', 'PTSD Treatment', 'EMDR Therapy', 'Anxiety Treatment'],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'Cigna', 'UnitedHealth'],
    slidingScale: true,
    telehealth: true,
    inPerson: true,
    specialties: ['Trauma', 'PTSD', 'EMDR', 'Anxiety'],
    ageGroups: ['adolescents', 'adults']
  }
];

// Sample mood entries for testing
const sampleMoodEntries = [
  {
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    mood: 7,
    energy: 6,
    anxiety: 4,
    sleep: 8,
    notes: 'Had a good day at work, feeling optimistic',
    factors: ['work', 'exercise', 'social'],
    location: 'Home',
    tags: ['productive', 'social']
  },
  {
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    mood: 5,
    energy: 4,
    anxiety: 6,
    sleep: 6,
    notes: 'Felt anxious about upcoming presentation',
    factors: ['work', 'stress'],
    location: 'Office',
    tags: ['anxious', 'work']
  },
  {
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    mood: 8,
    energy: 7,
    anxiety: 3,
    sleep: 9,
    notes: 'Great weekend with friends, well-rested',
    factors: ['social', 'rest', 'leisure'],
    location: 'Outdoors',
    tags: ['happy', 'social', 'rested']
  }
];

// Sample assessments for testing
const sampleAssessments = [
  {
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    type: 'PHQ-9',
    score: 8,
    maxScore: 27,
    severity: 'mild',
    responses: new Map([
      ['0', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 0]
    ]),
    notes: 'Feeling better than last week'
  },
  {
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    type: 'GAD-7',
    score: 6,
    maxScore: 21,
    severity: 'mild',
    responses: new Map([
      ['0', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 0]
    ]),
    notes: 'Some anxiety about work deadlines'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mhms');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Provider.deleteMany({});
    console.log('Cleared existing providers');

    // Seed providers
    const providers = await Provider.insertMany(sampleProviders);
    console.log(`Seeded ${providers.length} providers`);

    // Create a test user if it doesn't exist
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('Created test user');
    }

    // Clear existing mood entries and assessments for test user
    await MoodEntry.deleteMany({ userId: testUser._id });
    await Assessment.deleteMany({ userId: testUser._id });

    // Seed mood entries
    const moodEntries = await MoodEntry.insertMany(
      sampleMoodEntries.map(entry => ({ ...entry, userId: testUser._id }))
    );
    console.log(`Seeded ${moodEntries.length} mood entries`);

    // Seed assessments
    const assessments = await Assessment.insertMany(
      sampleAssessments.map(assessment => ({ ...assessment, userId: testUser._id }))
    );
    console.log(`Seeded ${assessments.length} assessments`);

    console.log('Database seeding completed successfully!');
    console.log('\nTest user credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
