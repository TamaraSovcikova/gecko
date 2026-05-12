// server/src/tests/integration/realtime.int.test.js

jest.mock("firebase-admin", () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: "test-user-id",
      email: "test@example.com",
    }),
  })),
}));

// increase jest timeout
jest.setTimeout(20000);

require("../setupTestDB");

process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.FIREBASE_CLIENT_EMAIL = "test@test-project.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nfake\\n-----END PRIVATE KEY-----\\n";

const request = require("supertest");
const User = require("../../src/models/User");
const Expense = require("../../src/models/Expense");
const MonthlyBudget = require("../../src/models/MonthlyBudget");

// -------------------- MOCK forecast service (prevents ESM crash) --------------------
jest.mock("../../src/services/forecastService", () => ({
  computeForecastForUser: jest.fn().mockResolvedValue({
    warnings: [],
    forecast: [],
  }),
}));

// -------------------- mock auth middleware --------------------
jest.mock("../../src/middleware/auth", () => {
  return (req, res, next) => {
    req.user = { uid: "testUser123" };
    next();
  };
});

// -------------------- mock dashboard aggregate service --------------------
jest.mock("../../src/services/dashboardAggregate", () => ({
  computeDashboard: jest.fn(),
}));

const { computeDashboard } = require("../../src/services/dashboardAggregate");

// IMPORTANT: require app AFTER mocks
const app = require("../../src/app");

describe("Realtime journey integration test", () => {
  let ioMock;

  beforeEach(async () => {
    // create user
    await User.create({
      _id: "testUser123",
      email: "test@test.com",
      displayName: "testuser",
      xp: 0,
      level: 0,
      weeklyStreak: 0,
    });

    // create budget (needed for category validation)
    await MonthlyBudget.create({
      userId: "testUser123",
      grossSalary: 4000,
      categories: [{ name: "Food", budget: 200 }],
    });

    // mock socket.io
    socketEmitMock = jest.fn();

    ioMock = {
      to: jest.fn(() => ({
        emit: socketEmitMock,
      })),
    };

    app.set("io", ioMock);

    computeDashboard.mockResolvedValue({
      totalBudget: 200,
      totalExpenses: 50,
      budgetLeft: 150,
    });
  });

  it("POST expense emits socket update + quiz updates XP in DB", async () => {
    // -------------------------
    // 1) Create expense
    // -------------------------
    const expenseRes = await request(app).post("/api/v1/expenses").send({
      category: "Food",
      amount: 50,
      date: "2026-04-21",
      note: "Lunch",
    });
    
    expect(expenseRes.statusCode).toBe(201);
    expect(expenseRes.body.success).toBe(true);

    const expenses = await Expense.find({ userId: "testUser123" });
    expect(expenses.length).toBe(1);
    expect(expenses[0].amount).toBe(50);

    // should recompute dashboard + emit socket update
    expect(computeDashboard).toHaveBeenCalledWith("testUser123");
    //expect(ioMock.to).toHaveBeenCalledWith("testUser123");
    //expect(ioMock.to).toHaveBeenCalled();
    //console.log(ioMock.to.mock.calls);
    
    expect(ioMock.to).toHaveBeenCalledWith("testUser123");

    expect(socketEmitMock).toHaveBeenCalledWith(
      "budget:update",
      expect.any(Object)
    );
    

    // -------------------------
    // 2) Complete quiz
    // -------------------------
    const quizRes = await request(app).post("/api/v1/quiz/complete").send({
      score: 5,
    });

    expect(quizRes.statusCode).toBe(200);
    expect(quizRes.body.gamification).toBeDefined();

    // -------------------------
    // 3) Assert XP updated in DB
    // -------------------------
    const updatedUser = await User.findById("testUser123");

    expect(updatedUser.xp).toBeGreaterThan(0);
    expect(updatedUser.level).toBeGreaterThanOrEqual(0);
    expect(updatedUser.weeklyStreak).toBeGreaterThanOrEqual(1);
  });
});