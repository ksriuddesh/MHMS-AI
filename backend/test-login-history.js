const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'TestPassword123'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLoginHistory() {
  console.log('='.repeat(50));
  console.log('Testing Login History System');
  console.log('='.repeat(50));
  console.log();

  let userId = null;

  try {
    // Step 1: Register a new user
    console.log('1️⃣  Registering new user...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      userId = registerResponse.data.user.id;
      console.log('✅ User registered successfully');
      console.log(`   User ID: ${userId}`);
      console.log(`   Email: ${testUser.email}`);
      console.log();
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️  User already exists, proceeding with login...');
        console.log();
      } else {
        throw error;
      }
    }

    await sleep(1000);

    // Step 2: Test successful login
    console.log('2️⃣  Testing successful login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    userId = loginResponse.data.user.id;
    console.log('✅ Login successful');
    console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
    console.log();

    await sleep(1000);

    // Step 3: Test failed login (wrong password)
    console.log('3️⃣  Testing failed login (wrong password)...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: 'WrongPassword123'
      });
    } catch (error) {
      console.log('✅ Failed login recorded (as expected)');
      console.log(`   Error: ${error.response.data.message}`);
      console.log();
    }

    await sleep(1000);

    // Step 4: Another successful login
    console.log('4️⃣  Testing another successful login...');
    await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Second login successful');
    console.log();

    await sleep(1000);

    // Step 5: Get login history by user ID
    console.log('5️⃣  Fetching login history by User ID...');
    const historyByUserId = await axios.get(`${BASE_URL}/auth/login-history/${userId}?limit=10`);
    console.log(`✅ Found ${historyByUserId.data.count} login records`);
    console.log();
    console.log('📊 Login History (User ID):');
    console.log('-'.repeat(50));
    historyByUserId.data.history.forEach((record, index) => {
      console.log(`${index + 1}. ${new Date(record.loginTime).toLocaleString()}`);
      console.log(`   Status: ${record.loginStatus}`);
      console.log(`   Email: ${record.email}`);
      console.log(`   Username: ${record.username}`);
      console.log(`   Device: ${record.device} | Browser: ${record.browser} | OS: ${record.os}`);
      console.log(`   IP: ${record.ipAddress}`);
      if (record.failureReason) {
        console.log(`   Failure Reason: ${record.failureReason}`);
      }
      console.log();
    });

    // Step 6: Get login history by email
    console.log('6️⃣  Fetching login history by Email...');
    const historyByEmail = await axios.get(`${BASE_URL}/auth/login-history/email/${testUser.email}?limit=10`);
    console.log(`✅ Found ${historyByEmail.data.count} login records for ${testUser.email}`);
    console.log();

    // Step 7: Get login statistics
    console.log('7️⃣  Fetching login statistics...');
    const stats = await axios.get(`${BASE_URL}/auth/login-stats/${userId}`);
    console.log('✅ Login Statistics:');
    console.log('-'.repeat(50));
    console.log(`   Total Successful Logins: ${stats.data.stats.totalLogins}`);
    console.log(`   Total Failed Logins: ${stats.data.stats.failedLogins}`);
    if (stats.data.stats.lastLogin) {
      console.log(`   Last Login: ${new Date(stats.data.stats.lastLogin.loginTime).toLocaleString()}`);
      console.log(`   Last Device: ${stats.data.stats.lastLogin.device}`);
      console.log(`   Last Browser: ${stats.data.stats.lastLogin.browser}`);
      console.log(`   Last IP: ${stats.data.stats.lastLogin.ipAddress}`);
    }
    console.log();

    // Step 8: Get all recent login attempts
    console.log('8️⃣  Fetching all recent login attempts (admin view)...');
    const allHistory = await axios.get(`${BASE_URL}/auth/login-history?limit=20`);
    console.log(`✅ Found ${allHistory.data.count} total login records`);
    console.log();

    // Step 9: Get only failed login attempts
    console.log('9️⃣  Fetching only failed login attempts...');
    const failedHistory = await axios.get(`${BASE_URL}/auth/login-history?status=failed&limit=10`);
    console.log(`✅ Found ${failedHistory.data.count} failed login attempts`);
    console.log();

    console.log('='.repeat(50));
    console.log('✨ All tests completed successfully!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the test
testLoginHistory();
