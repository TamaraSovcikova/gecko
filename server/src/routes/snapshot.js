// server/routes/snapshotRoutes.js

const express = require("express");
const router = express.Router();
const MonthlySnapshot = require("../models/MonthlySnapshot");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { computeDashboard } = require("../services/dashboardAggregate");

const ensureHistoricalSnapshots = async (userId) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const expenseMonths = await Expense.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: {
          year: "$year",
          month: "$month",
        },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
      },
    },
  ]);

  if (!expenseMonths.length) return;

  for (const monthEntry of expenseMonths) {
    const month = Number(monthEntry.month);
    const year = Number(monthEntry.year);

    if (!Number.isInteger(month) || !Number.isInteger(year)) continue;
    if (month === currentMonth && year === currentYear) continue;

    const dashboardData = await computeDashboard(userId, month, year);

    const actualSpending = Array.isArray(dashboardData.actualSpending) ? dashboardData.actualSpending : [];
    const budgetAllocation = Array.isArray(dashboardData.budgetAllocation) ? dashboardData.budgetAllocation : [];

    const budgetMap = new Map(budgetAllocation.map((item) => [String(item.name || ""), Number(item.value || 0)]));
    const actualMap = new Map(actualSpending.map((item) => [String(item.name || ""), Number(item.value || 0)]));

    const categoryNames = Array.from(new Set([...budgetMap.keys(), ...actualMap.keys()])).filter(Boolean);

    const categories = categoryNames.map((name) => ({
      name,
      budget: budgetMap.get(name) || 0,
      actual: actualMap.get(name) || 0,
    }));

    const totalExpenses = actualSpending.reduce((sum, item) => sum + Number(item.value || 0), 0);

    await MonthlySnapshot.findOneAndUpdate(
      { userId, month, year },
      {
        userId,
        month,
        year,
        healthScore: Number(dashboardData.healthScore || 0),
        grossSalary: Number(dashboardData.grossSalary || 0),
        takeHomePay: Number(dashboardData.takeHome || 0),
        totalExpenses,
        savings: Number(dashboardData.takeHome || 0) - totalExpenses,
        categories,
        xpEarned: 0,
        quizzesCompleted: 0,
      },
      { upsert: true, new: true }
    );
  }
};

// POST /api/snapshots/popup-seen
router.post("/popup-seen", async (req, res) => {
  try {
    const userId = req.user?.uid;
    const popupKey = String(req.body?.popupKey || "").trim();

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!popupKey) {
      return res.status(400).json({ error: "popupKey is required" });
    }

    await User.updateOne({ _id: userId }, { $addToSet: { seenSnapshotPopupKeys: popupKey } });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Failed to persist snapshot popup state:", err);
    return res.status(500).json({ error: "Failed to persist popup state" });
  }
});

// GET /api/snapshots  (uses authenticated user from token)
router.get("/", async (req, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    await ensureHistoricalSnapshots(userId);
    const snapshots = await MonthlySnapshot.find({
      userId,
      $nor: [{ month: currentMonth, year: currentYear }],
    }).sort({ year: -1, month: -1 });
    return res.json(snapshots);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch snapshots" });
  }
});

// GET /api/snapshots/:userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await ensureHistoricalSnapshots(userId);

    const snapshots = await MonthlySnapshot.find({
      userId,
      $nor: [{ month: currentMonth, year: currentYear }],
    }).sort({
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
