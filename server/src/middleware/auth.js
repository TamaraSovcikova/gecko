// auth.js - Authentication middleware.
// This runs on every protected route BEFORE the route handler.

const admin = require('../config/firebase');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  if (!admin) {
    return res.status(503).json({ error: 'Server not configured - Firebase Admin credentials missing from .env' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - no token provided' });
  }

  const token = authHeader.split(' ')[1];

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized - invalid or expired token' });
  }

  const normalizedUid = decodedToken.uid || decodedToken.user_id || decodedToken.sub;

  if (!normalizedUid) {
    return res.status(401).json({ error: 'Unauthorized - token missing user id' });
  }

  // Attach the decoded user so route handlers can access req.user.uid, req.user.email, etc.
  req.user = {
    ...decodedToken,
    uid: normalizedUid,
    id: normalizedUid,
  };

  // Best-effort sync between Firebase and Mongo. Never reject a valid token for this.
  try {
  if (decodedToken.email) {
    const normalizedEmail = String(decodedToken.email).toLowerCase().trim();
    const fallbackName =
      String(decodedToken.name || normalizedEmail.split('@')[0] || 'User').trim() || 'User';

    const existingUser = await User.findById(normalizedUid);

    if (!existingUser) {
      await User.create({
        _id: normalizedUid,
        email: normalizedEmail,
        displayName: fallbackName,
      });
    } else if (existingUser.email !== normalizedEmail) {
      await User.updateOne(
        { _id: normalizedUid },
        {
          $set: { email: normalizedEmail },
          $push: {
            accountChangeLog: {
              action: 'email_changed',
              changedAt: new Date(),
            },
          },
        }
      );
    }
  }
} catch (err) {
  console.error('Auth profile sync warning:', err.message);
}

  next();
};

module.exports = authMiddleware;
