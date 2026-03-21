const express = require('express');
const router = express.Router();
// Importing GET function from the controller
const { createExpense } = require('../controllers/expenseController');
const auth = require('../middleware/auth');

router.post('/', auth, createExpense);

module.exports = router;