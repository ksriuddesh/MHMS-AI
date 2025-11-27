const fetch = require('node-fetch');

async function testBackend() {
  console.log('🧪 Testing MindWell Backend API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthData);
    }

    // Test OTP request endpoint
    console.log('\n2. Testing OTP request endpoint...');
    const otpResponse = await fetch('http://localhost:5000/api/auth/request-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const otpData = await otpResponse.json();
    
    if (otpResponse.ok) {
      console.log('✅ OTP request successful:', otpData);
    } else {
      console.log('❌ OTP request failed:', otpData);
    }

  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Backend server is running on port 5000');
    console.log('   - MongoDB is running');
    console.log('   - Email configuration is set up in config.env');
  }
}

testBackend();
