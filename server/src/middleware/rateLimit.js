// middleware/rateLimit.js - Per-route rate limiters.
// Keyed by Firebase UID where available (auth middleware has run), IP otherwise.

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Prefer the authenticated Firebase UID; fall back to IP (with IPv6 normalisation).
const userOrIp = (req, res) => req.user?.uid || ipKeyGenerator(req, res);

// Tight limit on registration to slow account-creation abuse.
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again in a minute.' },
});

// Chat is the most expensive route (Groq call). Limit per user.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIp,
  message: { error: 'You are sending messages too quickly. Wait a minute.' },
});

// General fallback for all other authenticated API routes.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIp,
});

module.exports = { authLimiter, chatLimiter, apiLimiter };
