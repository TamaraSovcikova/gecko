const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const User = require("../src/models/User");
const Expense = require("../src/models/Expense");
const MonthlyBudget = require("../src/models/MonthlyBudget");
const MonthlySnapshot = require("../src/models/MonthlySnapshot");
const NewsletterSnapshot = require("../src/models/NewsletterSnapshot");

const MONGODB_URI = process.env.MONGODB_URI;

const seedUserId = process.env.SEED_USER_ID || "seed-user-001";
const seedUserEmail = process.env.SEED_USER_EMAIL || "seed.user@example.com";
const seedUserDisplayName = process.env.SEED_USER_NAME || "Seed User";

const now = new Date();
const month = Number(process.env.SEED_MONTH || now.getMonth() + 1);
const year = Number(process.env.SEED_YEAR || now.getFullYear());

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
    id: "seed-user-002",
    email: "seed.user.two@example.com",
    displayName: "Seed User Two",
    jobTitle: "Marketing Intern",
    location: "London",
    grossSalary: 2800,
    taxPaid: 360,
    niPaid: 170,
    xpTotal: 245,
    xpEarned: 60,
    quizzesCompleted: 4,
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
    id: "seed-user-003",
    email: "seed.user.three@example.com",
    displayName: "Seed User Three",
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

const seedUser = async (entry) => {
  const takeHomePay = entry.grossSalary - entry.taxPaid - entry.niPaid;
  const categoryActuals = buildCategoryActuals(entry.categories, entry.expenses);
  const totalExpenses = Number(entry.expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2));
  const totalBudget = entry.categories.reduce((sum, category) => sum + category.budget, 0);
  const savings = Number((takeHomePay - totalExpenses).toFixed(2));
  const budgetLeft = Number((totalBudget - totalExpenses).toFixed(2));

  const expenseDocs = entry.expenses.map((expense) => ({
    userId: entry.id,
    month,
    year,
    category: expense.category,
    amount: expense.amount,
    date: new Date(year, month - 1, expense.day),
    note: expense.note,
  }));

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
      xpTotal: entry.xpTotal,
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

  await MonthlyBudget.create({
    userId: entry.id,
    grossSalary: entry.grossSalary,
    taxPaid: entry.taxPaid,
    niPaid: entry.niPaid,
    takeHomePay,
    categories: entry.categories,
  });

  await Expense.insertMany(expenseDocs);

  await MonthlySnapshot.findOneAndUpdate(
    { userId: entry.id, month, year },
    {
      userId: entry.id,
      month,
      year,
      healthScore: entry.healthScore,
      grossSalary: entry.grossSalary,
      takeHomePay,
      totalExpenses,
      savings,
      categories: categoryActuals,
      xpEarned: entry.xpEarned,
      quizzesCompleted: entry.quizzesCompleted,
    },
    { upsert: true, new: true }
  );

  await NewsletterSnapshot.findOneAndUpdate(
    { userId: entry.id, month, year },
    {
      userId: entry.id,
      month,
      year,
      metrics: {
        income: takeHomePay,
        expenses: totalExpenses,
        savings,
        totalBudget,
        budgetLeft,
        quizXpActivity: entry.xpEarned,
        quizXpTotal: entry.xpTotal,
      },
      comparisons: {
        incomePercent: null,
        expensesPercent: null,
        savingsPercent: null,
        quizXpPercent: null,
      },
      trends: entry.trends,
      categoryTotals: categoryActuals.map((item) => ({
        category: item.name,
        total: item.actual,
      })),
      consistencyChecks: [
        "Income - expenses matches calculated savings.",
        "Category totals match month expense aggregation.",
      ],
      isFirstMonth: false,
      endingXpTotal: entry.xpTotal,
      sentAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return {
    userId: entry.id,
    expensesInserted: expenseDocs.length,
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

  console.log(`Seed complete for ${results.length} users (${month}/${year}).`);
  results.forEach((result) => {
    console.log(`- ${result.userId}: ${result.expensesInserted} expenses, 1 monthly budget, 1 monthly snapshot, 1 newsletter snapshot.`);
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