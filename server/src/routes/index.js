// routes/index.js - Public routes (health checks, login page, etc.)
//
// NOTE: All API feature routes are now mounted in app.js under /api/v1/*
// This file is reserved for public routes that don't require API versioning.

const express = require('express');
const router = express.Router();
const { unsubscribeFromNewsletter } = require('../controllers/userController');

// ---- Public routes (no token required) ----
router.get('/', (req, res) => res.send('<h1>Zoar API - use /api/v1/* endpoints from frontend</h1>'));

// Newsletter unsubscribe (public route from email links)
// Frontend calls: /api/v1/user/newsletter/unsubscribe
// Caddy proxies /api/* unchanged, so backend receives /api/v1/user/newsletter/unsubscribe
router.get('/api/v1/user/newsletter/unsubscribe', unsubscribeFromNewsletter);
module.exports = router;
