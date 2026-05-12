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
  : ["mBrFMABNaNcy4kfa9ycBM4IZJQN2", "4fkv879AkYZDtDyIKdCCjYKI0o62", "AEom1o4SkZddabkGAUNuBU4sp2J3"];
const now = new Date();
const month = Number(process.env.SEED_MONTH || now.getMonth() + 1);
const year = Number(process.env.SEED_YEAR || now.getFullYear());
const HISTORY_MONTHS = 11;
const EXPENSES_PER_MONTH = 8;

const buildSeedMonths = (anchorMonth, anchorYear, count) => {
  const months = [];

  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(anchorYear, anchorMonth - 1 - offset, 1);
    months.push({ month: date.getMonth() + 1, year: date.getFullYear() });
  }

  return months;
};

const checks = [];

const addCheck = (name, pass, details) => {
  checks.push({ name, pass, details });
};

const verify = async () => {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Set it in your environment before running verification.");
  }

  await mongoose.connect(MONGODB_URI);
  const targetPeriods = buildSeedMonths(month, year, HISTORY_MONTHS);
  const expectedExpenses = HISTORY_MONTHS * EXPENSES_PER_MONTH;

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
      MonthlySnapshot.countDocuments({ userId }),
      NewsletterSnapshot.countDocuments({ userId }),
    ]);

    addCheck("User exists", Boolean(user), `userId=${userId}`);
    addCheck("MonthlyBudget count is 1", budgetCount === 1, `userId=${userId}, actual=${budgetCount}`);
    addCheck("Expense count matches 11-month history", expenseCount === expectedExpenses, `userId=${userId}, expected=${expectedExpenses}, actual=${expenseCount}`);
    addCheck(
      "MonthlySnapshot count matches 11-month history",
      snapshotCount === HISTORY_MONTHS,
      `userId=${userId}, expected=${HISTORY_MONTHS}, actual=${snapshotCount}`
    );
    addCheck(
      "NewsletterSnapshot count matches 11-month history",
      newsletterCount === HISTORY_MONTHS,
      `userId=${userId}, expected=${HISTORY_MONTHS}, actual=${newsletterCount}`
    );

    for (const period of targetPeriods) {
      const [monthlySnapshot, newsletterSnapshot] = await Promise.all([
        MonthlySnapshot.exists({ userId, month: period.month, year: period.year }),
        NewsletterSnapshot.exists({ userId, month: period.month, year: period.year }),
      ]);

      addCheck(
        "MonthlySnapshot exists for each period",
        Boolean(monthlySnapshot),
        `userId=${userId}, month=${period.month}, year=${period.year}`
      );
      addCheck(
        "NewsletterSnapshot exists for each period",
        Boolean(newsletterSnapshot),
        `userId=${userId}, month=${period.month}, year=${period.year}`
      );
    }
  }

  const failed = checks.filter((item) => !item.pass);

  console.log(`Seed verification for ${seedUserIds.length} user(s), month=${month}, year=${year}, historyMonths=${HISTORY_MONTHS}.`);
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