// server/jobs/monthlySnapshotJob.js
// Cron job to generate MonthlyBudget snapshots (idempotent)

const cron = require("node-cron");
const MonthlyBudget = require("../models/MonthlyBudget");
const User = require("../models/User");

// TODO: Replace these with your real calculation functions
async function computeUserSnapshot(userId, month, year) {
  // You should compute these values from your real budget/expenses/payslip logic
  return {
    userId,
    month,
    year,
    grossSalary: 2500,
    taxPaid: 300,
    niPaid: 150,
    takeHomePay: 2050,
    categories: [
      { name: "Rent", budget: 800 },
      { name: "Food", budget: 200 },
    ],
  };
}

async function generateMonthlySnapshots() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  console.log(`[CRON] Running snapshot job for ${month}/${year}`);

  const users = await User.find(); // all users

  for (const user of users) {
    const userId = user._id.toString();

    // skip if snapshot already exists (idempotent)
    const existing = await MonthlyBudget.findOne({ userId, month, year });
    if (existing) {
      console.log(`[CRON] Skipping ${userId} (snapshot already exists)`);
      continue;
    }

    // Example: skip users without completed setup
    // Replace this with your actual check (payslip setup complete, etc.)
    if (!user.hasCompletedPayslipSetup) {
      console.log(`[CRON] Skipping ${userId} (no payslip setup)`);
      continue;
    }

    const snapshotData = await computeUserSnapshot(userId, month, year);

    try {
      await MonthlyBudget.create(snapshotData);
      console.log(`[CRON] Snapshot created for ${userId}`);
    } catch (err) {
      console.error(`[CRON] Error creating snapshot for ${userId}:`, err);
    }
  }
}

// Runs at 00:05 on the 1st of every month
// (captures the previous month state if your data is stored monthly)
cron.schedule("5 0 1 * *", async () => {
  await generateMonthlySnapshots();
});

module.exports = { generateMonthlySnapshots };