// server/routes/snapshotRoutes.js

const express = require("express");
const router = express.Router();
const MonthlySnapshot = require("../models/MonthlySnapshot");

// GET /api/snapshots/:userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshots = await MonthlySnapshot.find({ userId }).sort({
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