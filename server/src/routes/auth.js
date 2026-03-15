// routes/auth.js — Authentication routes.
//
// Firebase handles sign-in on the frontend our backend just needs to
// know about the user so we can store app-specific data in MongoDB.

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// POST /api/v1/auth/register
// Protected - requires a valid Firebase token in the Authorization header.
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { uid, email, name } = req.user;

    // Check if this user already exists in MongoDB
    const existingUser = await User.findById(uid);

    if (existingUser) {
      // Returning user - send them to the dashboard
      return res.json({
        user: existingUser,
        firstLogin: !existingUser.hasCompletedOnboarding,
      });
    }

    // New user - create a document in MongoDB
    const newUser = await User.create({
      _id: uid,
      email: email,
      displayName: name || email.split('@')[0], // fallback if no display name
    });

    // First login - send them to payslip setup
    return res.status(201).json({
      user: newUser,
      firstLogin: true,
    });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

module.exports = router;
