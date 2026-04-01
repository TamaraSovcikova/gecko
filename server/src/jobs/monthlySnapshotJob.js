// server/jobs/monthlySnapshotJob.js
const cron = require("node-cron");
const MonthlyBudget = require("../models/MonthlyBudget");
const User = require("../models/User");
const Expense = require("../models/Expense");

// helper to get month/year (calendar month)
function getMonthYear(date = new Date()) {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

// helper to get start/end of month
function getMonthRange(month, year) {
  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59); // last day of month
  return { start, end };
}

// main snapshot generator (idempotent)
async function generateMonthlySnapshots() {
  const now = new Date();
  const { month, year } = getMonthYear(now);

  console.log(`[CRON] Running monthly snapshot job for ${month}/${year}`);

  const users = await User.find();

  for (const user of users) {
    const userId = user._id.toString();

    // skip users without payslip setup (change this field to match your User model)
    if (!user.hasCompletedPayslipSetup) {
      console.log(`[CRON] Skipping user ${userId} (no payslip setup)`);
      continue;
    }

    // skip if snapshot already exists (idempotent)
    const existing = await MonthlyBudget.findOne({ userId, month, year });
    if (existing) {
      console.log(`[CRON] Skipping user ${userId} (snapshot already exists)`);
      continue;
    }

    const { start, end } = getMonthRange(month, year);

    // get expenses for this month
    const expenses = await Expense.find({
      userId,
      createdAt: { $gte: start, $lte: end },
    });

    // total expenses by category
    const categoryTotals = {};
    let totalExpenses = 0;

    for (const exp of expenses) {
      const category = exp.category || "Other";
      categoryTotals[category] = (categoryTotals[category] || 0) + exp.amount;
      totalExpenses += exp.amount;
    }

    // get most recent MonthlyBudget record for this user (their current budget setup)
    const latestBudget = await MonthlyBudget.findOne({ userId }).sort({
      year: -1,
      month: -1,
    });

    if (!latestBudget) {
      console.log(`[CRON] Skipping user ${userId} (no budget exists)`);
      continue;
    }

    // compute budget adherence (actual vs goal per category)
    const budgetAdherence = latestBudget.categories.map((cat) => ({
      name: cat.name,
      goal: cat.budget,
      actual: categoryTotals[cat.name] || 0,
    }));

    // compute savings (takehome - total expenses)
    const takeHomePay = latestBudget.takeHomePay || 0;
    const savings = takeHomePay - totalExpenses;

    // compute health score (basic example logic)
    let healthScore = 0;
    if (takeHomePay > 0) {
      const savingsRatio = savings / takeHomePay;
      healthScore = Math.round(Math.max(0, Math.min(100, savingsRatio * 100)));
    }

    // placeholders for XP and quizzes (replace with your real logic/models)
    const xpEarned = 0;
    const quizzesCompleted = 0;

    // save snapshot document (same schema as MonthlyBudget)
    const snapshot = {
      userId,
      month,
      year,
      grossSalary: latestBudget.grossSalary,
      taxPaid: latestBudget.taxPaid,
      niPaid: latestBudget.niPaid,
      takeHomePay: takeHomePay,
      categories: latestBudget.categories,

      // extra snapshot fields stored inside categories or computed in frontend
      // (if you want these stored explicitly, extend schema later)
    };

    try {
      await MonthlyBudget.create(snapshot);
      console.log(`[CRON] Snapshot created for user ${userId} (${month}/${year})`);
    } catch (err) {
      console.error(`[CRON] Failed snapshot for user ${userId}:`, err);
    }
  }
}

// runs 00:05 on the 1st day of each month
cron.schedule("5 0 1 * *", async () => {
  await generateMonthlySnapshots();
});

module.exports = { generateMonthlySnapshots };