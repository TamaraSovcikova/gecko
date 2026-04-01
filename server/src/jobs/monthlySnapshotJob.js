// server/jobs/monthlySnapshotJob.js

const cron = require("node-cron");
const MonthlySnapshot = require("../models/MonthlySnapshot");
const MonthlyBudget = require("../models/MonthlyBudget");
const Expense = require("../models/Expense");
const User = require("../models/User");

// calendar month range helper
function getMonthRange(month, year) {
  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start, end };
}

// health score (simple logic - replace with your computeDashboard formula if needed)
function computeHealthScore(takeHomePay, totalExpenses) {
  if (takeHomePay <= 0) return 0;

  const savings = takeHomePay - totalExpenses;
  const ratio = savings / takeHomePay;

  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

// snapshot generator
async function generateMonthlySnapshots() {
  const now = new Date();

  // snapshot for PREVIOUS month
  // (since job runs on 1st of next month)
  now.setMonth(now.getMonth() - 1);

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  console.log(`[CRON] Generating snapshots for ${month}/${year}`);

  const users = await User.find();

  for (const user of users) {
    const userId = user._id.toString();

    // IMPORTANT: update this field to match your User model
    if (!user.hasCompletedPayslipSetup) {
      console.log(`[CRON] Skipping ${userId} (no payslip setup)`);
      continue;
    }

    // idempotent skip
    const existing = await MonthlySnapshot.findOne({ userId, month, year });
    if (existing) {
      console.log(`[CRON] Skipping ${userId} (snapshot exists)`);
      continue;
    }

    // find the user's budget record for this month
    const budget = await MonthlyBudget.findOne({ userId, month, year });

    // if no budget record, skip (no empty snapshots)
    if (!budget) {
      console.log(`[CRON] Skipping ${userId} (no MonthlyBudget found)`);
      continue;
    }

    // expenses in that month
    const { start, end } = getMonthRange(month, year);

    const expenses = await Expense.find({
      userId,
      date: { $gte: start, $lte: end },
    });

    // compute actual expenses by category
    const actualByCategory = {};
    let totalExpenses = 0;

    for (const exp of expenses) {
      const cat = exp.category || "Other";
      actualByCategory[cat] = (actualByCategory[cat] || 0) + exp.amount;
      totalExpenses += exp.amount;
    }

    // merge budget categories with actual spending
    const categoriesSnapshot = budget.categories.map((cat) => ({
      name: cat.name,
      budget: cat.budget,
      actual: actualByCategory[cat.name] || 0,
    }));

    const takeHomePay = budget.takeHomePay || 0;
    const savings = takeHomePay - totalExpenses;

    const healthScore = computeHealthScore(takeHomePay, totalExpenses);

    const snapshotData = {
      userId,
      month,
      year,
      healthScore,
      grossSalary: budget.grossSalary,
      takeHomePay,
      totalExpenses,
      savings,
      categories: categoriesSnapshot,

      // placeholders unless you already have these models
      xpEarned: 0,
      quizzesCompleted: 0,
    };

    try {
      await MonthlySnapshot.create(snapshotData);
      console.log(`[CRON] Snapshot saved for ${userId} (${month}/${year})`);
    } catch (err) {
      console.error(`[CRON] Error saving snapshot for ${userId}:`, err);
    }
  }
}

// runs 00:05 on the 1st day of every month
cron.schedule("5 0 1 * *", async () => {
  await generateMonthlySnapshots();
});

module.exports = { generateMonthlySnapshots };