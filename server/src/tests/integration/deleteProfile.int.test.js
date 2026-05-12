// server/src/tests/integration/deleteProfile.int.test.js

/*
Slots 3 --> 6 --> 1: GDPR Compliance

What it tests for:
Can a user securely wipe all their data?

Backend journey:
  Seed the DB with a User,
  Budget (Slot 2 data),
  Expenses (Slot 4 data),
  and XP (Slot 5 data).
  Call DELETE /profile.

  Assert that all associated collections are wiped entirely.

*/
jest.setTimeout(20000);

require("../setupTestDB");

const request = require("supertest");

const User = require("../../models/User");
const Expense = require("../../models/Expense");
const MonthlyBudget = require("../../models/MonthlyBudget");
const MonthlySnapshot = require("../../models/MonthlySnapshot");
const NewsletterSnapshot = require("../../models/NewsletterSnapshot");

// -----------------------------
// Test helper: snapshot seeder
// -----------------------------
const createSnapshot = (overrides = {}) => ({
  userId: "gprUser123",
  month: 4,
  year: 2026,
  healthScore: 78,
  totalExpenses: 1250,
  savings: 3750,
  grossSalary: 5000,
  takeHomePay: 4000,
  xpEarned: 10,
  categories: [],
  ...overrides,
});

// mock firebase
jest.mock("../../config/firebase", () => ({
  auth: () => ({
    deleteUser: jest.fn().mockResolvedValue(true),
  }),
}));

// mock auth middleware
jest.mock("../../middleware/auth", () => {
  return (req, res, next) => {
    req.user = { uid: "gprUser123", email: "gpr@test.com" };
    next();
  };
});

// mock expense forecast
jest.mock("../../services/forecastService", () => ({
  computeForecastForUser: jest.fn().mockResolvedValue({
    warnings: [],
    forecast: [],
  }),
}));

const app = require("../../app");

describe("GPR Integration: secure user data wipe", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Expense.deleteMany({});
    await MonthlyBudget.deleteMany({});
    await MonthlySnapshot.deleteMany({});
    await NewsletterSnapshot.deleteMany({});

    // -----------------------------
    // GIVEN: seeded full user data
    // -----------------------------

    await User.create({
      _id: "gprUser123",
      email: "gpr@test.com",
      displayName: "GPR User",
      xp: 120,
      level: 2,
      weeklyStreak: 3,
    });

    await MonthlyBudget.create({
      userId: "gprUser123",
      grossSalary: 5000,
      categories: [
        { name: "Food", budget: 200 },
        { name: "Rent", budget: 1200 },
      ],
    });

    await Expense.create([
      {
        userId: "gprUser123",
        category: "Food",
        amount: 50,
        date: new Date(),
        month: 4,
        year: 2026,
      },
      {
        userId: "gprUser123",
        category: "Rent",
        amount: 1200,
        date: new Date(),
        month: 4,
        year: 2026,
      },
    ]);

    await MonthlySnapshot.create(
      createSnapshot({
        userId: "gprUser123",
      })
    );

    await NewsletterSnapshot.create({
      userId: "gprUser123",
      month: 4,
      year: 2026,
      sent: true,
    });
  });

  test("WHEN user deletes profile, THEN all associated data is fully wiped", async () => {
    // -----------------------------
    // WHEN: delete profile request
    // -----------------------------
    const res = await request(app)
      .delete("/api/v1/user/profile")
      .expect(200);

    expect(res.body).toEqual({
      message: "Profile deleted successfully",
    });

    // -----------------------------
    // THEN: all collections wiped
    // -----------------------------

    const user = await User.findById("gprUser123");
    expect(user).toBeNull();

    const expenses = await Expense.find({ userId: "gprUser123" });
    expect(expenses.length).toBe(0);

    const budgets = await MonthlyBudget.find({ userId: "gprUser123" });
    expect(budgets.length).toBe(0);

    const snapshots = await MonthlySnapshot.find({ userId: "gprUser123" });
    expect(snapshots.length).toBe(0);

    const newsletter = await NewsletterSnapshot.find({ userId: "gprUser123" });
    expect(newsletter.length).toBe(0);
  });
});