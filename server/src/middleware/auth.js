// auth.js — Authentication middleware.
// This runs on every protected route BEFORE the route handler.

// don't initialise firebase here
// it fails testing
const admin = require('../config/firebase');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check the Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - no token provided' });
  }

  // Pull the token
  const token = authHeader.split(' ')[1];

  let decodedToken;
  try {
    // Ask Firebase Admin to verify the token is real and not expired.
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
      const fallbackName = String(decodedToken.name || normalizedEmail.split('@')[0] || 'User').trim() || 'User';
      const existingUser = await User.findById(normalizedUid).select('_id email displayName');

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
                $each: [{ action: 'email_changed', changedAt: new Date() }],
              },
            },
          }
        );
      }
    }
  } catch (syncErr) {
    console.error('Auth profile sync warning:', syncErr.message);
  }

  next();
};

module.exports = authMiddleware;
