// routes/auth.js - Authentication routes.
//
// This file handles the server-side of the registration flow.
// Firebase should handle the actual sign-in/sign-up on the frontend 

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// POST /api/v1/auth/register
// Checks if a user document already exists in MongoDB if not, creates one and returns the user document and a firstLogin flag 
// to redirect either to /payslip-setup or /dashboard
router.post('/register', authMiddleware, async (req, res) => {
  try {   
    const { uid, email, name } = req.user;

    // TODO: import User model once it is created (models/ folder)
    // const User = require('../models/User');

    // const existingUser = await User.findOne({ uid });
    // if (existingUser) {
    //   return res.json({ user: existingUser, firstLogin: false });
    // }
    // const newUser = await User.create({ uid, email, displayName: name });
    // return res.status(201).json({ user: newUser, firstLogin: true });

    // Stub response until User model is created
    res.status(201).json({
      message: 'Register endpoint reached - User model not yet implemented',
      uid,
      email,
      firstLogin: true,
    });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

module.exports = router;
