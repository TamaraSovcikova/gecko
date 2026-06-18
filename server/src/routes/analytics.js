const express = require('express');
const router = express.Router();
const { computeAnalytics } = require('../services/analyticsService');
const User = require('../models/User');

/**
 * @openapi
 * /analytics:
 *   get:
 *     summary: 12-month spend analytics — trends, category breakdown, anomalies
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 monthlyTotals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label: { type: string }
 *                       total: { type: number }
 *                 anomalies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label: { type: string }
 *                       category: { type: string }
 *                       amount: { type: number }
 *                       zscore: { type: number }
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.uid;
    const user = await User.findById(userId).select('payslipData').lean();
    const monthlyIncome = user?.payslipData?.takeHome
      ? user.payslipData.takeHome / 12
      : 0;

    const data = await computeAnalytics(userId, monthlyIncome);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('[analytics] failed:', err);
    res.status(500).json({ success: false, error: 'Analytics failed' });
  }
});

module.exports = router;
