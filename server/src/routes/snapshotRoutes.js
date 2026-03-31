// server/routes/snapshotRoutes.js

const express = require("express");
const router = express.Router();
const MonthlyBudget = require("../models/MonthlyBudget");

// GET /api/snapshots/:userId
// returns all monthly snapshots for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshots = await MonthlyBudget.find({ userId }).sort({
      year: -1,
      month: -1,
    });

    return res.json(snapshots);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch snapshots" });
  }
});

module.exports = router;