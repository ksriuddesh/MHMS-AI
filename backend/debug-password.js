const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

async function debugPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    
    const user = await User.findOne({ email: 'john.doe@example.com' });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('Email:', user.email);
      console.log('Password hash:', user.password);
      console.log('Hash length:', user.password.length);
      
      const testPassword = 'TestPassword123';
      console.log('\nTesting password:', testPassword);
      
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('Password match:', isValid);
      
      // Try with the comparePassword method
      const isValidMethod = await user.comparePassword(testPassword);
      console.log('Password match (method):', isValidMethod);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugPassword();
