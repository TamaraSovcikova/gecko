// routes/auth.js - Authentication routes.
//
// Firebase handles sign-in on the frontend our backend just needs to
// know about the user so we can store app-specific data in MongoDB.

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const admin = require("../config/firebase");

// POST /v1/auth/register
// Protected - requires a valid Firebase token in the Authorization header.
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const { uid, email, name } = req.user;
    const preferredDisplayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
    const emailFallback = String(email || "").split("@")[0] || "User";

    let resolvedDisplayName = preferredDisplayName || String(name || "").trim();

    // Token claims can be stale immediately after signup profile updates.
    if (!resolvedDisplayName) {
      try {
        const firebaseUser = await admin.auth().getUser(uid);
        resolvedDisplayName = String(firebaseUser.displayName || "").trim();
      } catch (firebaseReadError) {
        console.warn("Register displayName lookup warning:", firebaseReadError.message);
      }
    }

    if (!resolvedDisplayName) {
      resolvedDisplayName = emailFallback;
    }

    // Check if this user already exists in MongoDB
    const existingUser = await User.findById(uid);

    if (existingUser) {
      const existingLooksLikeEmailFallback =
        existingUser.displayName === String(existingUser.email || "").split("@")[0];

      // Repair first-signup fallback names created before fresh displayName was available.
      if (
        resolvedDisplayName &&
        existingUser.displayName !== resolvedDisplayName &&
        (preferredDisplayName || existingLooksLikeEmailFallback)
      ) {
        existingUser.displayName = resolvedDisplayName;
        await existingUser.save();
      }

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
      displayName: resolvedDisplayName,
    });

    // First login - send them to payslip setup
    return res.status(201).json({
      user: newUser,
      firstLogin: true,
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error during registration" });
  }
});

module.exports = router;
