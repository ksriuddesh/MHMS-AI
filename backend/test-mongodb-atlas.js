/**
 * Test MongoDB Atlas Connection
 * Run this to verify your MongoDB Atlas connection works
 * 
 * Usage: node test-mongodb-atlas.js
 */

require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');

console.log('====================================');
console.log('MongoDB Atlas Connection Test');
console.log('====================================\n');

const testConnection = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in config.env');
    }

    console.log('🔌 Attempting to connect to MongoDB Atlas...');
    console.log(`📍 Connection String: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(mongoURI, options);

    console.log('\n✅ SUCCESS! Connected to MongoDB Atlas');
    console.log(`📦 Database: ${mongoose.connection.name || 'default'}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔢 Port: ${mongoose.connection.port || 'N/A (using SRV)'}`);
    console.log(`📊 Ready State: ${mongoose.connection.readyState} (1 = connected)`);

    // Test creating a simple document
    console.log('\n🧪 Testing database operations...');

    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });

    const TestModel = mongoose.model('ConnectionTest', TestSchema);

    // Create test document
    const testDoc = await TestModel.create({
      message: 'MongoDB Atlas connection test successful!'
    });

    console.log('✅ Write test successful - Document created');
    console.log(`   ID: ${testDoc._id}`);

    // Read test document
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log('✅ Read test successful - Document retrieved');
    console.log(`   Message: ${foundDoc.message}`);

    // Delete test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Delete test successful - Document removed');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Collections in database: ${collections.length}`);
    collections.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name}`);
    });

    console.log('\n====================================');
    console.log('✨ All tests passed successfully!');
    console.log('====================================\n');

  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!');
    console.error(`Error: ${error.message}`);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check if your IP address is whitelisted in MongoDB Atlas');
    console.error('   2. Verify username and password are correct');
    console.error('   3. Ensure the connection string is properly formatted');
    console.error('   4. Check if you have internet connectivity');
    console.error('\n💡 MongoDB Atlas Dashboard: https://cloud.mongodb.com/');
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed\n');
    process.exit(0);
  }
};

// Run the test
testConnection();
