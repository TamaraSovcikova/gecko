// routes/index.js - Root router
// All feature routers are mounted here so app.js stays clean.
//
// How to add a new feature:
//   1. Create src/routes/featureName.js with its own express.Router()
//   2. Uncomment the template line below and point it at your file

const express = require('express');
const router = express.Router();

// Add all routes here
router.get('/', (req, res) => {
  res.send('<h1>Login</h1>');
});

// Template: router.use('/feature', require('./feature'))
// Examples:
//   router.use('/auth',     require('./auth'));
//   router.use('/payslips', require('./payslips'));

module.exports = router;
