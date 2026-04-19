// routes/index.js - Root router for the Zoar API
//
// How to add a new feature:
//   1. Create src/routes/featureName.js with its own express.Router()
//   2. Add router.use('/api/v1/feature', require('./featureName')) below

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { unsubscribeFromNewsletter } = require('../controllers/userController');

// ---- Public routes (no token required) ----
router.get('/', (req, res) => res.send('<h1>Login</h1>'));

// Auth routes — register/login handling (token verified inside these routes)
router.use('/api/v1/auth', require('./auth'));

// Newsletter unsubscribe route (public, from email link)
router.get('/api/v1/user/newsletter/unsubscribe', unsubscribeFromNewsletter);

router.use('/api/v1/quiz', require('./quiz'));
// ---- Protected routes (token required) ----
// All routes below this line require a valid Firebase token.
router.use('/api/v1/payslip', authMiddleware, require('./payslip'));
router.use('/api/v1/dashboard', authMiddleware, require('./dashboard'));
router.use('/api/v1/user', authMiddleware, require('./user'));

module.exports = router;
