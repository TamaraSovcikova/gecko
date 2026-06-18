const express = require('express');
const router = express.Router();
const {
	createExpense,
	deleteExpense,
	listExpenses,
	scanReceipt,
	updateExpense,
	exportExpenses,
} = require('../controllers/expenseController');
const { classify } = require('../services/categoryClassifier');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

/**
 * @openapi
 * /expenses:
 *   get:
 *     summary: List all expenses for the authenticated user
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 expenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, amount, date]
 *             properties:
 *               category: { type: string }
 *               amount: { type: number }
 *               date: { type: string, format: date }
 *               note: { type: string }
 *     responses:
 *       201:
 *         description: Expense created
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', auth, listExpenses);
router.post('/', auth, createExpense);

/**
 * @openapi
 * /expenses/export:
 *   get:
 *     summary: Export expenses as CSV or PDF
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *           default: csv
 *         description: Export format
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (inclusive)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (inclusive)
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *           application/pdf:
 *             schema: { type: string, format: binary }
 */
router.get('/export', auth, exportExpenses);

/**
 * @openapi
 * /expenses/classify:
 *   post:
 *     summary: Suggest a category for an expense description (ML classifier)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description]
 *             properties:
 *               description: { type: string, example: 'Tesco Metro Oxford Street' }
 *     responses:
 *       200:
 *         description: Suggested category with confidence score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 category: { type: string }
 *                 confidence: { type: number }
 *                 method: { type: string, enum: [keyword, history] }
 */
router.post('/classify', auth, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { description } = req.body;
    if (!description) return res.status(400).json({ success: false, error: 'description required' });
    const result = await classify(userId, description);
    res.json({ success: true, ...(result || { category: null, confidence: 0, method: null }) });
  } catch (err) {
    console.error('[classify]', err);
    res.status(500).json({ success: false, error: 'Classification failed' });
  }
});

/**
 * @openapi
 * /expenses/{expenseId}:
 *   patch:
 *     summary: Update an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Expense'
 *     responses:
 *       200:
 *         description: Expense updated
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Expense deleted
 *       404:
 *         description: Not found
 */
router.patch('/:expenseId', auth, updateExpense);
router.delete('/:expenseId', auth, deleteExpense);

/**
 * @openapi
 * /expenses/scan:
 *   post:
 *     summary: Scan a receipt image and extract the total amount (OCR)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Extracted amount or failure notice
 */
router.post('/scan', auth, upload.single('image'), scanReceipt);

module.exports = router;
