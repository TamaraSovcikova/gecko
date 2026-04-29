const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const User = require("../src/models/User");
const Expense = require("../src/models/Expense");
const MonthlyBudget = require("../src/models/MonthlyBudget");
const MonthlySnapshot = require("../src/models/MonthlySnapshot");
const NewsletterSnapshot = require("../src/models/NewsletterSnapshot");

const MONGODB_URI = process.env.MONGODB_URI;
const seedUserIds = process.env.SEED_USER_ID
  ? [process.env.SEED_USER_ID]
  : ["seed-user-001", "seed-user-002", "seed-user-003"];
const now = new Date();
const month = Number(process.env.SEED_MONTH || now.getMonth() + 1);
const year = Number(process.env.SEED_YEAR || now.getFullYear());

const checks = [];

const addCheck = (name, pass, details) => {
  checks.push({ name, pass, details });
};

const verify = async () => {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Set it in your environment before running verification.");
  }

  await mongoose.connect(MONGODB_URI);

  for (const userId of seedUserIds) {
    const [
      user,
      expenseCount,
      budgetCount,
      snapshotCount,
      newsletterCount,
    ] = await Promise.all([
      User.findById(userId).lean(),
      Expense.countDocuments({ userId }),
      MonthlyBudget.countDocuments({ userId }),
      MonthlySnapshot.countDocuments({ userId, month, year }),
      NewsletterSnapshot.countDocuments({ userId, month, year }),
    ]);

    addCheck("User exists", Boolean(user), `userId=${userId}`);
    addCheck("MonthlyBudget count is 1", budgetCount === 1, `userId=${userId}, actual=${budgetCount}`);
    addCheck("Expense count is 8", expenseCount === 8, `userId=${userId}, actual=${expenseCount}`);
    addCheck(
      "MonthlySnapshot count is 1 for seed month",
      snapshotCount === 1,
      `userId=${userId}, month=${month}, year=${year}, actual=${snapshotCount}`
    );
    addCheck(
      "NewsletterSnapshot count is 1 for seed month",
      newsletterCount === 1,
      `userId=${userId}, month=${month}, year=${year}, actual=${newsletterCount}`
    );
  }

  const failed = checks.filter((item) => !item.pass);

  console.log(`Seed verification for ${seedUserIds.length} user(s), month=${month}, year=${year}.`);
  checks.forEach((item) => {
    console.log(`${item.pass ? "PASS" : "FAIL"}: ${item.name} (${item.details})`);
  });

  if (failed.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log("All seed verification checks passed.");
};

verify()
  .catch((error) => {
    console.error("Verification failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });