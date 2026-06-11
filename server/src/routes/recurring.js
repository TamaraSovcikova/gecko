const express = require("express");
const router = express.Router();
const { detectRecurringTransactions } = require("../services/recurringService");

// GET /api/v1/recurring - list detected recurring transactions
router.get("/", async (req, res) => {
  try {
    const recurring = await detectRecurringTransactions(req.user.uid);
    res.json({ recurring, count: recurring.length });
  } catch (err) {
    console.error("Error detecting recurring transactions:", err);
    res.status(500).json({ error: "Failed to detect recurring transactions" });
  }
});

module.exports = router;
