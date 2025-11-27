const mongoose = require('mongoose');

/**
 * MongoDB Atlas Connection Configuration
 * Using MindWell Cluster
 */

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    };

    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI, options);

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name || 'mindwell'}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`☁️  Connection type: MongoDB Atlas (Cloud)`);

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Check your MongoDB Atlas connection string');
    console.error('💡 Verify your IP address is whitelisted in Atlas');
    console.error('💡 Ensure username and password are correct');
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
  isConnected = false;
});

module.exports = { connectDB };
