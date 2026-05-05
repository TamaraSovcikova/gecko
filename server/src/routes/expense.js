const express = require('express');
const router = express.Router();
const {
	createExpense,
	deleteExpense,
	listExpenses,
	scanReceipt,
	updateExpense,
} = require('../controllers/expenseController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

router.get('/', auth, listExpenses);
router.post('/', auth, createExpense);
router.patch('/:expenseId', auth, updateExpense);
router.delete('/:expenseId', auth, deleteExpense);
router.post('/scan', auth, upload.single('image'), scanReceipt);

module.exports = router;