/**
 * Test Script: Login and Update User Data in MongoDB
 * 
 * This script demonstrates how to:
 * 1. Login with email and password
 * 2. Update user data in MongoDB Atlas
 * 
 * Usage: node test-update-user-data.js
 */

const API_URL = 'http://localhost:5000';

// Test credentials - CHANGE THESE
const TEST_EMAIL = 'user@gmail.com';
const TEST_PASSWORD = 'yourpassword';

// Data to update
const UPDATE_DATA = {
  name: 'John Doe Updated',
  phone: '+1234567890',
  dateOfBirth: '1990-01-15',
  gender: 'male',
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA'
  },
  emergencyContact: {
    name: 'Jane Doe',
    phone: '+1987654321',
    relationship: 'Spouse'
  },
  preferences: {
    theme: 'dark',
    notifications: true,
    privacy: 'private',
    language: 'en'
  }
};

/**
 * Login function
 */
async function login(email, password) {
  console.log('\n🔐 Step 1: Logging in...');
  console.log(`Email: ${email}`);

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    console.log('✅ Login successful!');
    console.log(`User ID: ${data.user.id}`);
    console.log(`Name: ${data.user.name}`);
    console.log(`Email: ${data.user.email}`);

    return data.token;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
}

/**
 * Update user data function
 */
async function updateUserData(token, updateData) {
  console.log('\n📝 Step 2: Updating user data...');
  console.log('Data to update:', JSON.stringify(updateData, null, 2));

  try {
    const response = await fetch(`${API_URL}/api/user/update-data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Update failed');
    }

    console.log('✅ User data updated successfully!');
    console.log('\nUpdated user data:');
    console.log(JSON.stringify(data.user, null, 2));

    return data;
  } catch (error) {
    console.error('❌ Update error:', error.message);
    throw error;
  }
}

/**
 * Get user profile
 */
async function getUserProfile(token) {
  console.log('\n👤 Step 3: Fetching updated user profile...');

  try {
    const response = await fetch(`${API_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch profile');
    }

    console.log('✅ Profile fetched successfully!');
    console.log('\nCurrent user profile:');
    console.log(JSON.stringify(data.user, null, 2));

    return data;
  } catch (error) {
    console.error('❌ Profile fetch error:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🧪 TESTING: Login and Update User Data');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);

  try {
    // Step 1: Login
    const token = await login(TEST_EMAIL, TEST_PASSWORD);

    // Step 2: Update user data
    await updateUserData(token, UPDATE_DATA);

    // Step 3: Get updated profile
    await getUserProfile(token);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED:', error.message);
    console.log('='.repeat(60));
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the backend server is running (npm start in backend/)');
    console.log('2. Check that MongoDB is connected');
    console.log('3. Verify your email and password are correct');
    console.log('4. Check the API URL:', API_URL);
    process.exit(1);
  }
}

/**
 * Alternative: Update only specific fields
 */
async function updateSpecificFields(email, password, fieldsToUpdate) {
  console.log('\n🔄 Alternative Method: Update Specific Fields');
  
  try {
    const token = await login(email, password);
    await updateUserData(token, fieldsToUpdate);
    console.log('✅ Specific fields updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the main test
if (require.main === module) {
  main();
}

// Export functions for use in other scripts
module.exports = {
  login,
  updateUserData,
  getUserProfile,
  updateSpecificFields
};

/**
 * EXAMPLES OF USAGE:
 * 
 * // Example 1: Update only name
 * updateSpecificFields('user@gmail.com', 'password', {
 *   name: 'New Name'
 * });
 * 
 * // Example 2: Update only address
 * updateSpecificFields('user@gmail.com', 'password', {
 *   address: {
 *     city: 'Los Angeles',
 *     state: 'CA'
 *   }
 * });
 * 
 * // Example 3: Update only preferences
 * updateSpecificFields('user@gmail.com', 'password', {
 *   preferences: {
 *     theme: 'light',
 *     notifications: false
 *   }
 * });
 */
