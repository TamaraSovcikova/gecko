// server/jobs/monthlySnapshotJob.js
const cron = require("node-cron");
const MonthlySnapshot = require("../models/MonthlySnapshot");
const User = require("../models/User");
const { computeDashboard } = require("../services/dashboardAggregate");

// Helper to get previous month/year
function getPreviousMonthYear() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// Main snapshot generator
async function generateMonthlySnapshots() {
  const { month, year } = getPreviousMonthYear();

  // DEBUGGING
  console.log(`[CRON] Generating snapshots for ${month}/${year}`);

  const users = await User.find();

  for (const user of users) {
    const userId = user._id.toString();

    if (!user.hasCompletedOnboarding) {
      console.log(`[CRON] Skipping ${userId} (no payslip setup)`);
      continue;
    }

  // DEBUGGING
  // console.log('Users found:', users.length);
  // console.log("[CRON] Found users:", users.map(u => u._id));

  // Idempotent: skip if snapshot exists
   const existing = await MonthlySnapshot.findOne({ userId, month, year });
   if (existing) {
     console.log(`[CRON] Skipping ${userId} (snapshot exists)`);
     continue;
   }

  // check if budget exists for month
  let budget = await MonthlyBudget.findOne({ userId, month, year });

  // if not, take latest budget
  if (!budget) {
    budget = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });
  }

  if (!budget) {
    console.log(`[CRON] Skipping ${userId} (no MonthlyBudget found)`);
    continue;
  }
  // skip if no budget exists

   // Pull all available data from dashboard for the specified month
   let dashboardData;
   try {
     dashboardData = await computeDashboard(userId, month, year);
   } catch (err) {
     console.error(`[CRON] Failed to compute dashboard for ${userId}:`, err);
     continue;
   }

   const {
     healthScore,
     takeHome,
     totalBudget,
     actualSpending,
     budgetAllocation,
     grossSalary,
   } = dashboardData;

   const totalExpenses = actualSpending.reduce((sum, cat) => sum + cat.value, 0);
   const savings = takeHome - totalExpenses;

   // Merge budget and actual spending for snapshot
   const categoriesSnapshot = budgetAllocation.map((cat) => {
     const actual = actualSpending.find(a => a.name === cat.name)?.value || 0;
     return {
       name: cat.name,
       budget: cat.value,
       actual,
     };
   });

   const snapshotData = {
     userId,
     month,
     year,
     healthScore,
     grossSalary,
     takeHomePay: takeHome,
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