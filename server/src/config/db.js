// db.js - Mongoose connection to MongoDB Atlas.
// Called once at startup from server.js.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // This lets the server keep running without a database
    // so Firebase auth and other non-DB routes still work
    console.warn('Warning: Running without MongoDB — database features will not work');
  }
};

module.exports = connectDB;
