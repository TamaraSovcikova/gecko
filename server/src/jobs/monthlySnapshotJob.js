// server/jobs/monthlySnapshotJob.js

const cron = require("node-cron");
const { Types } = require("mongoose");
const MonthlySnapshot = require("../models/MonthlySnapshot");
const MonthlyBudget = require("../models/MonthlyBudget");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { computeHealthScoreBreakdown } = require("../services/healthScoreService");

// Helper to get start/end of month
function getMonthRange(month, year) {
  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start, end };
}

// Compute health score
function computeHealthScore(takeHomePay, totalExpenses) {
  const breakdown = computeHealthScoreBreakdown(takeHomePay, totalExpenses);
  return breakdown.healthScore;
}

// Main snapshot generator
async function generateMonthlySnapshots() {
  const now = new Date();

  // configure for the month before
  // scheduled time 00:05 1st of every month
  now.setMonth(now.getMonth() - 1);

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  console.log(`[CRON] Generating snapshots for ${month}/${year}`);

  const users = await User.find();
  console.log('Users found:', users.length);
  console.log("[CRON] Found users:", users.map(u => u._id));

  for (const user of users) {
    // Properly read user ID as string
    const userId = user._id;

    if (!user.hasCompletedOnboarding) {
      console.log(`[CRON] Skipping ${userId} (no payslip setup)`);
      continue;
    }

    // Idempotent: skip if snapshot exists
    const existing = await MonthlySnapshot.findOne({ userId, month, year });
    if (existing) {
      console.log(`[CRON] Skipping ${userId} (snapshot exists)`);
      continue;
    }

    // Get user's budget for the month
    const budget = await MonthlyBudget.findOne({ 
        userId,
        // month,
        // year
    });
  
    // Skip if user has no budget whatsoever
    // the month of the budget doesn't count
    if (!budget) {
      console.log(`[CRON] Skipping ${userId} (no MonthlyBudget found)`);
      continue;
    }

    // Find expenses for this user during the month/year
    const expenses = await Expense.find({
        userId: user._id,
        month,
        year,
    });

    // Skip if no expenses
    if (!expenses.length) {
        console.log(`[CRON] Skipping ${userId} (no expenses found)`);
        continue;
    }


    // Aggregate actual expenses by category
    const actualByCategory = {};
    let totalExpenses = 0;
    for (const exp of expenses) {
      const cat = exp.category || "Other";
      actualByCategory[cat] = (actualByCategory[cat] || 0) + exp.amount;
      totalExpenses += exp.amount;
    }

    // Merge budget categories with actual spending
    const categoriesSnapshot = budget.categories.map((cat) => ({
      name: cat.name,
      budget: cat.budget,
      actual: actualByCategory[cat.name] || 0,
    }));

    const takeHomePay = budget.takeHomePay || 0;
    const savings = takeHomePay - totalExpenses;
    const healthScore = computeHealthScore(takeHomePay, totalExpenses);

    const snapshotData = {
      userId, // always string
      month,
      year,
      healthScore,
      grossSalary: budget.grossSalary,
      takeHomePay,
      totalExpenses,
      savings,
      categories: categoriesSnapshot,
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


// Schedule: runs 00:05 on 1st of each month
cron.schedule("5 0 1 * *", async () => {
  await generateMonthlySnapshots();
});

module.exports = { generateMonthlySnapshots };
