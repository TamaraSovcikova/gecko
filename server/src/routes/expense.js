const express = require('express');
const router = express.Router();
const {
	createExpense,
	deleteExpense,
	listExpenses,
	updateExpense,
} = require('../controllers/expenseController');
const auth = require('../middleware/auth');

router.get('/', auth, listExpenses);
router.post('/', auth, createExpense);
router.patch('/:expenseId', auth, updateExpense);
router.delete('/:expenseId', auth, deleteExpense);

module.exports = router;