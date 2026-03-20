// auth.js — Authentication middleware.
// This runs on every protected route BEFORE the route handler.

const admin = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check the Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - no token provided' });
  }

  // Pull the token
  const token = authHeader.split(' ')[1];

  try {
    // Ask Firebase Admin to verify the token is real and not expired
    // If valid, decodedToken contains uid, email, and other user info
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach the decoded user to the request so route handlers can access it
    // e.g. req.user.uid, req.user.email
    const normalizedUid = decodedToken.uid || decodedToken.user_id || decodedToken.sub;
    req.user = {
      ...decodedToken,
      uid: normalizedUid,
      id: normalizedUid,
    };

    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized - invalid or expired token' });
  }
};

module.exports = authMiddleware;
