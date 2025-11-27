// Test all MongoDB endpoints with authentication
const API_URL = 'http://localhost:5000';

// Test data
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'Test@123'
};

let authToken = null;

async function testRegister() {
  console.log('\n1️⃣  Testing Registration...');
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  
  const data = await response.json();
  if (response.ok && data.token) {
    authToken = data.token;
    console.log('✅ Registration successful');
    console.log('   User ID:', data.user.id);
    console.log('   Token:', authToken.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ Registration failed:', data.message);
    return false;
  }
}

async function testProfileSave() {
  console.log('\n2️⃣  Testing Profile Save...');
  const profileData = {
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    phone: '1234567890',
    email: testUser.email,
    addressLine1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    patientId: 'TEST' + Date.now()
  };

  const response = await fetch(`${API_URL}/api/patient-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(profileData)
  });

  const data = await response.json();
  if (response.ok) {
    console.log('✅ Profile saved successfully');
    console.log('   Profile ID:', data.profile._id);
    return true;
  } else {
    console.log('❌ Profile save failed:', data.error);
    return false;
  }
}

async function testProfileLoad() {
  console.log('\n3️⃣  Testing Profile Load...');
  const response = await fetch(`${API_URL}/api/patient-profile`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  const data = await response.json();
  if (response.ok && data.profile) {
    console.log('✅ Profile loaded successfully');
    console.log('   Name:', data.profile.firstName, data.profile.lastName);
    console.log('   City:', data.profile.city);
    return true;
  } else {
    console.log('❌ Profile load failed');
    return false;
  }
}

async function testMoodEntry() {
  console.log('\n4️⃣  Testing Mood Entry...');
  const moodData = {
    mood: 7,
    energy: 6,
    anxiety: 4,
    sleep: 8,
    notes: 'Test mood entry',
    factors: ['exercise', 'good weather']
  };

  const response = await fetch(`${API_URL}/api/moods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(moodData)
  });

  const data = await response.json();
  if (response.ok || response.status === 201) {
    console.log('✅ Mood entry saved successfully');
    console.log('   Mood ID:', data.moodEntry?._id);
    return true;
  } else {
    console.log('❌ Mood entry failed:', data.error);
    return false;
  }
}

async function testAssessment() {
  console.log('\n5️⃣  Testing Assessment...');
  const assessmentData = {
    type: 'PHQ-9',
    score: 12,
    maxScore: 27,
    severity: 'moderate',
    responses: {
      q1: 2,
      q2: 1,
      q3: 2,
      q4: 1,
      q5: 2,
      q6: 1,
      q7: 1,
      q8: 1,
      q9: 1
    },
    notes: 'Test assessment'
  };

  const response = await fetch(`${API_URL}/api/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(assessmentData)
  });

  const data = await response.json();
  if (response.ok || response.status === 201) {
    console.log('✅ Assessment saved successfully');
    console.log('   Assessment ID:', data.assessment?._id);
    console.log('   Severity:', data.assessment?.severity);
    return true;
  } else {
    console.log('❌ Assessment failed:', data.error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing MongoDB Data Persistence...');
  console.log('=====================================');

  try {
    const registerOk = await testRegister();
    if (!registerOk) return;

    const profileSaveOk = await testProfileSave();
    const profileLoadOk = await testProfileLoad();
    const moodOk = await testMoodEntry();
    const assessmentOk = await testAssessment();

    console.log('\n📊 Test Results:');
    console.log('=====================================');
    console.log('Registration:', registerOk ? '✅' : '❌');
    console.log('Profile Save:', profileSaveOk ? '✅' : '❌');
    console.log('Profile Load:', profileLoadOk ? '✅' : '❌');
    console.log('Mood Entry:', moodOk ? '✅' : '❌');
    console.log('Assessment:', assessmentOk ? '✅' : '❌');
    
    const allPassed = registerOk && profileSaveOk && profileLoadOk && moodOk && assessmentOk;
    console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

runTests();
