// server/scripts/createMonthlySnapshotOnce.js
// Run manually: node server/scripts/createMonthlySnapshotOnce.js

const mongoose = require("mongoose");
require("dotenv").config();

const MonthlySnapshot = require("../models/MonthlySnapshot");
const MonthlyBudget = require("../models/MonthlyBudget");
const Expense = require("../models/Expense");

// helper: month range
function getMonthRange(month, year) {
  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start, end };
}

// health score (same logic as cron job)
function computeHealthScore(takeHomePay, totalExpenses) {
  if (takeHomePay <= 0) return 0;

  const savings = takeHomePay - totalExpenses;
  const ratio = savings / takeHomePay;

  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // CHANGE THESE VALUES
    const userId = "PUT_USER_ID_HERE";
    const month = 3; // 1-12
    const year = 2026;

    // idempotent check
    const existing = await MonthlySnapshot.findOne({ userId, month, year });
    if (existing) {
      console.log("Snapshot already exists. Skipping.");
      process.exit(0);
    }

    // budget record for that month
    const budget = await MonthlyBudget.findOne({ userId, month, year });

    if (!budget) {
      console.log("No MonthlyBudget found for that month/year. Cannot create snapshot.");
      process.exit(0);
    }

    // expenses in month
    const { start, end } = getMonthRange(month, year);

    const expenses = await Expense.find({
      userId,
      date: { $gte: start, $lte: end },
    });

    const actualByCategory = {};
    let totalExpenses = 0;

    for (const exp of expenses) {
      const cat = exp.category || "Other";
      actualByCategory[cat] = (actualByCategory[cat] || 0) + exp.amount;
      totalExpenses += exp.amount;
    }

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
      xpEarned: 0,
      quizzesCompleted: 0,
    };

    const created = await MonthlySnapshot.create(snapshotData);

    console.log("Snapshot created successfully:");
    console.log(created);

    process.exit(0);
  } catch (err) {
    console.error("Error creating snapshot:", err);
    process.exit(1);
  }
}

run();