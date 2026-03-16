// routes/index.js - Root router for the Zoar API
//
// How to add a new feature:
//   1. Create src/routes/featureName.js with its own express.Router()
//   2. Add router.use('/api/v1/feature', require('./featureName')) below

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// ---- Public routes (no token required) ----
router.get('/', (req, res) => res.send('<h1>Login</h1>'));

// Auth routes — register/login handling (token verified inside these routes)
router.use('/api/v1/auth', require('./auth'));

// ---- Protected routes (token required) ----
// All routes below this line require a valid Firebase token.
router.use('api/v1/dashboard', require('./dashboard'));


module.exports = router;
