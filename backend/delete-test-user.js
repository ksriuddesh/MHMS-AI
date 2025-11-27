const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

async function deleteTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    const LoginHistory = require('./models/LoginHistory');
    
    const result = await User.deleteOne({ email: 'john.doe@example.com' });
    console.log(`Deleted ${result.deletedCount} user(s)`);
    
    const historyResult = await LoginHistory.deleteMany({ email: 'john.doe@example.com' });
    console.log(`Deleted ${historyResult.deletedCount} login history record(s)`);
    
    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

deleteTestUser();
