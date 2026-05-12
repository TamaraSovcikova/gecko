const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const User = require("../src/models/User");
const Expense = require("../src/models/Expense");
const MonthlyBudget = require("../src/models/MonthlyBudget");
const MonthlySnapshot = require("../src/models/MonthlySnapshot");
const NewsletterSnapshot = require("../src/models/NewsletterSnapshot");

const MONGODB_URI = process.env.MONGODB_URI;

const seedUserId = process.env.SEED_USER_ID || "mBrFMABNaNcy4kfa9ycBM4IZJQN2";
const seedUserEmail = process.env.SEED_USER_EMAIL || "seed.user@example.com";
const seedUserDisplayName = process.env.SEED_USER_NAME || "Seed User";

const now = new Date();
const month = Number(process.env.SEED_MONTH || now.getMonth() + 1);
const year = Number(process.env.SEED_YEAR || now.getFullYear());
const HISTORY_MONTHS = 11;

const BASE_XP = 100;
const GROWTH_RATE = 1.2;

const getXpForLevel = (level) => Math.floor(BASE_XP * Math.pow(GROWTH_RATE, level));

const calculateLevel = (xp) => {
  let level = 0;
  let remainingXp = xp;

  while (remainingXp >= getXpForLevel(level)) {
    remainingXp -= getXpForLevel(level);
    level++;
  }

  return level;
};

const buildSeedMonths = (anchorMonth, anchorYear, count) => {
  const months = [];

  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(anchorYear, anchorMonth - 1 - offset, 1);
    months.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      offset,
    });
  }

  return months;
};

const userSeeds = [
  {
    id: seedUserId,
    email: seedUserEmail,
    displayName: seedUserDisplayName,
    jobTitle: "Software Engineering Student",
    location: "Guildford",
    grossSalary: 2500,
    taxPaid: 300,
    niPaid: 150,
    xpTotal: 180,
    xpEarned: 45,
    quizzesCompleted: 3,
    healthScore: 76,
    trends: [
      "Steady spending across transport and leisure.",
      "Food spend remains under category budget.",
    ],
    categories: [
      { name: "Rent", budget: 700 },
      { name: "Food", budget: 300 },
      { name: "Transport", budget: 160 },
      { name: "Leisure", budget: 180 },
      { name: "Savings", budget: 450 },
    ],
    expenses: [
      { category: "Rent", amount: 700, day: 1, note: "Monthly rent" },
      { category: "Food", amount: 42.5, day: 3, note: "Groceries" },
      { category: "Transport", amount: 18.2, day: 5, note: "Bus top up" },
      { category: "Food", amount: 29.99, day: 8, note: "Supermarket" },
      { category: "Leisure", amount: 35, day: 10, note: "Cinema" },
      { category: "Transport", amount: 14.5, day: 12, note: "Train" },
      { category: "Food", amount: 21.75, day: 15, note: "Lunch" },
      { category: "Leisure", amount: 24.5, day: 18, note: "Streaming + games" },
    ],
  },
  {
    id: "s1rmqjptythVg43BQPPTQ9LPKDC3",
    email: "seed.user.two@example.com",
    displayName: "User2",
    jobTitle: "Marketing Intern",
    location: "London",
    grossSalary: 2800,
    taxPaid: 360,
    niPaid: 170,
    xpTotal: 780,
    xpEarned: 120,
    quizzesCompleted: 16,
    healthScore: 69,
    trends: [
      "Dining out increased this month.",
      "Transport costs are stable week to week.",
    ],
    categories: [
      { name: "Rent", budget: 950 },
      { name: "Food", budget: 360 },
      { name: "Transport", budget: 220 },
      { name: "Leisure", budget: 210 },
      { name: "Utilities", budget: 160 },
    ],
    expenses: [
      { category: "Rent", amount: 950, day: 1, note: "Rent payment" },
      { category: "Food", amount: 58.4, day: 2, note: "Groceries" },
      { category: "Transport", amount: 44.8, day: 4, note: "Travel card" },
      { category: "Leisure", amount: 68, day: 6, note: "Concert ticket" },
      { category: "Utilities", amount: 55.6, day: 9, note: "Internet bill" },
      { category: "Food", amount: 41.3, day: 13, note: "Dining" },
      { category: "Transport", amount: 21.6, day: 17, note: "Taxi" },
      { category: "Leisure", amount: 39.5, day: 20, note: "Weekend activities" },
    ],
  },
  {
    id: "AEom1o4SkZddabkGAUNuBU4sp2J3",
    email: "seed.user.three@example.com",
    displayName: "User3",
    jobTitle: "Graduate Analyst",
    location: "Manchester",
    grossSalary: 3300,
    taxPaid: 510,
    niPaid: 240,
    xpTotal: 320,
    xpEarned: 75,
    quizzesCompleted: 5,
    healthScore: 83,
    trends: [
      "Savings trend improved versus last month.",
      "Low discretionary spending kept budget healthy.",
    ],
    categories: [
      { name: "Housing", budget: 1100 },
      { name: "Food", budget: 320 },
      { name: "Transport", budget: 180 },
      { name: "Wellbeing", budget: 140 },
      { name: "Savings", budget: 700 },
    ],
    expenses: [
      { category: "Housing", amount: 1100, day: 1, note: "Rent + service charge" },
      { category: "Food", amount: 49.9, day: 3, note: "Weekly shop" },
      { category: "Transport", amount: 32.4, day: 5, note: "Rail pass" },
      { category: "Wellbeing", amount: 24, day: 7, note: "Gym" },
      { category: "Food", amount: 37.2, day: 11, note: "Groceries" },
      { category: "Transport", amount: 18.7, day: 14, note: "Bus fares" },
      { category: "Wellbeing", amount: 28.5, day: 18, note: "Fitness class" },
      { category: "Food", amount: 33.6, day: 22, note: "Meal prep" },
    ],
  },
];

const buildCategoryActuals = (categories, expenses) => {
  return categories.map((category) => {
    const actual = expenses
      .filter((expense) => expense.category === category.name)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      name: category.name,
      budget: category.budget,
      actual: Number(actual.toFixed(2)),
    };
  });
};

const monthOffsetFactor = (offset) => {
  const maxOffset = Math.max(HISTORY_MONTHS - 1, 1);
  const fraction = (maxOffset - offset) / maxOffset;
  return Number((0.88 + fraction * 0.18).toFixed(4));
};

const adjustByMonth = (entry, period) => {
  const factor = monthOffsetFactor(period.offset);
  const seasonalNudge = ((period.month % 3) - 1) * 0.01;
  const adjustedFactor = factor + seasonalNudge;

  const adjustMoney = (value) => Number((value * adjustedFactor).toFixed(2));

  const grossSalary = adjustMoney(entry.grossSalary);
  const taxPaid = adjustMoney(entry.taxPaid);
  const niPaid = adjustMoney(entry.niPaid);
  const takeHomePay = Number((grossSalary - taxPaid - niPaid).toFixed(2));

  const categories = entry.categories.map((category) => ({
    ...category,
    budget: adjustMoney(category.budget),
  }));

  const expenses = entry.expenses.map((expense) => ({
    ...expense,
    amount: adjustMoney(expense.amount),
  }));

  return {
    ...entry,
    grossSalary,
    taxPaid,
    niPaid,
    takeHomePay,
    categories,
    expenses,
    xpEarned: Math.max(10, Math.round(entry.xpEarned - period.offset * 2)),
    quizzesCompleted: Math.max(1, Math.round(entry.quizzesCompleted - period.offset * 0.2)),
    healthScore: Math.max(50, Math.round(entry.healthScore - period.offset * 0.8)),
    xpTotal: Math.max(50, Math.round(entry.xpTotal - period.offset * 6)),
  };
};

const seedUser = async (entry) => {
  const periods = buildSeedMonths(month, year, HISTORY_MONTHS);
  const expenseDocs = [];
  const snapshotOps = [];
  const newsletterOps = [];

  await Promise.all([
    Expense.deleteMany({ userId: entry.id }),
    MonthlyBudget.deleteMany({ userId: entry.id }),
    MonthlySnapshot.deleteMany({ userId: entry.id }),
    NewsletterSnapshot.deleteMany({ userId: entry.id }),
  ]);

  await User.findByIdAndUpdate(
    entry.id,
    {
      _id: entry.id,
      email: entry.email,
      displayName: entry.displayName,
      payslipData: {
        grossSalary: entry.grossSalary,
        jobTitle: entry.jobTitle,
        location: entry.location,
      },
      xp: entry.xpTotal,
      level: calculateLevel(entry.xpTotal),
      weeklyStreak: Math.max(1, Math.min(12, Math.round(entry.quizzesCompleted / 2))),
      lastQuizCompletedAt: new Date(),
      completedQuizzesThisMonth: entry.quizzesCompleted,
      streakAtRisk: false,
      hasCompletedOnboarding: true,
      financialOnboarding: {
        completedPages: ["/dashboard", "/payslip"],
        updatedAt: new Date(),
      },
      newsletterOptIn: true,
      accountChangeLog: [{ action: "seed-data-created" }],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await MonthlyBudget.findOneAndUpdate(
    { userId: entry.id },
    {
    userId: entry.id,
    grossSalary: entry.grossSalary,
    taxPaid: entry.taxPaid,
    niPaid: entry.niPaid,
    takeHomePay: entry.grossSalary - entry.taxPaid - entry.niPaid,
    categories: entry.categories,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  for (const period of periods) {
    const monthEntry = adjustByMonth(entry, period);
    const categoryActuals = buildCategoryActuals(monthEntry.categories, monthEntry.expenses);
    const totalExpenses = Number(monthEntry.expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2));
    const totalBudget = monthEntry.categories.reduce((sum, category) => sum + category.budget, 0);
    const savings = Number((monthEntry.takeHomePay - totalExpenses).toFixed(2));
    const budgetLeft = Number((totalBudget - totalExpenses).toFixed(2));

    expenseDocs.push(
      ...monthEntry.expenses.map((expense) => ({
        userId: entry.id,
        month: period.month,
        year: period.year,
        category: expense.category,
        amount: expense.amount,
        date: new Date(period.year, period.month - 1, expense.day),
        note: expense.note,
      }))
    );

    snapshotOps.push(
      MonthlySnapshot.findOneAndUpdate(
        { userId: entry.id, month: period.month, year: period.year },
        {
          userId: entry.id,
          month: period.month,
          year: period.year,
          healthScore: monthEntry.healthScore,
          grossSalary: monthEntry.grossSalary,
          takeHomePay: monthEntry.takeHomePay,
          totalExpenses,
          savings,
          categories: categoryActuals,
          xpEarned: monthEntry.xpEarned,
          quizzesCompleted: monthEntry.quizzesCompleted,
        },
        { upsert: true, new: true }
      )
    );

    newsletterOps.push(
      NewsletterSnapshot.findOneAndUpdate(
        { userId: entry.id, month: period.month, year: period.year },
        {
          userId: entry.id,
          month: period.month,
          year: period.year,
          metrics: {
            income: monthEntry.takeHomePay,
            expenses: totalExpenses,
            savings,
            totalBudget,
            budgetLeft,
            quizXpActivity: monthEntry.xpEarned,
            quizXpTotal: monthEntry.xpTotal,
          },
          comparisons: {
            incomePercent: null,
            expensesPercent: null,
            savingsPercent: null,
            quizXpPercent: null,
          },
          trends: monthEntry.trends,
          categoryTotals: categoryActuals.map((item) => ({
            category: item.name,
            total: item.actual,
          })),
          consistencyChecks: [
            "Income - expenses matches calculated savings.",
            "Category totals match month expense aggregation.",
          ],
          isFirstMonth: period.offset === HISTORY_MONTHS - 1,
          endingXpTotal: monthEntry.xpTotal,
          sentAt: new Date(period.year, period.month - 1, 25),
        },
        { upsert: true, new: true }
      )
    );
  }

  await Expense.insertMany(expenseDocs);
  await Promise.all(snapshotOps);
  await Promise.all(newsletterOps);

  return {
    userId: entry.id,
    expensesInserted: expenseDocs.length,
    snapshotsUpserted: periods.length,
    newslettersUpserted: periods.length,
  };
};

const seed = async () => {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Set it in your environment before running seed.");
  }

  await mongoose.connect(MONGODB_URI);

  const results = [];
  for (const entry of userSeeds) {
    const result = await seedUser(entry);
    results.push(result);
  }

  console.log(`Seed complete for ${results.length} users (${month}/${year}, ${HISTORY_MONTHS} months of history).`);
  results.forEach((result) => {
    console.log(`- ${result.userId}: ${result.expensesInserted} expenses, 1 monthly budget, ${result.snapshotsUpserted} monthly snapshots, ${result.newslettersUpserted} newsletter snapshots.`);
  });
};

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });