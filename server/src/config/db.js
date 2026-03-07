// db.js - Mongoose connection to MongoDB Atlas.
// Called once at startup from server.js.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Exit the process so the server doesn't silently run without a database
    process.exit(1);
  }
};

module.exports = connectDB;
