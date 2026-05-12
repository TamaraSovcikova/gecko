// server/src/tests/integration/authPayslipDashboard.int.test.js

/*
BACKEND INTEGRATION TEST
Journey: POST /auth/register → POST /payslip → GET /dashboard

What this verifies:
- GIVEN a logged-in user (Firebase mocked),
- WHEN they register and submit a payslip with categories,
- THEN the dashboard endpoint returns aggregated data consistent with that payslip.

Uses in-memory MongoDB:
- Real User, MonthlyBudget, Expense documents are created
- Dashboard performs real aggregation queries

Mocks only external dependencies:
- Firebase Admin (auth)
- Forecast service (ESM dependency)
- Adzuna service
*/

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// -------------------- Firebase Admin mock --------------------

const mockVerifyIdToken = jest.fn();

jest.mock("firebase-admin", () => {
  const auth = jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  }));

  return {
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
    auth,
  };
});

process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.FIREBASE_CLIENT_EMAIL = "test@test-project.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nfake\\n-----END PRIVATE KEY-----\\n";

// -------------------- Forecast service mock (IMPORTANT: prevents ESM crash) --------------------

jest.mock("../../src/services/forecastService", () => ({
  computeForecastForUser: jest.fn().mockResolvedValue({
    warnings: [],
    forecast: [],
  }),
}));

// -------------------- Adzuna service mock --------------------

jest.mock("../../src/services/adzunaCalculator", () => ({
  getAverageSalary: jest.fn().mockResolvedValue(35000),
}));

// -------------------- App --------------------

const app = require("../../src/app");

// -------------------- In-memory DB setup --------------------

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// -------------------- Test suite --------------------

describe("Integration: register → payslip → dashboard", () => {
  const TEST_UID = "integration-user-uid-123";
  const TEST_EMAIL = "integration@test.com";
  const TEST_TOKEN = "valid_integration_token";

  beforeAll(() => {
    // Firebase: always accept TEST_TOKEN as this user
    mockVerifyIdToken.mockImplementation(async (token) => {
      if (token !== TEST_TOKEN) throw new Error("Unexpected token in test");
      return { uid: TEST_UID, email: TEST_EMAIL, name: "Integration User" };
    });
  });

  test("GIVEN a logged-in user, WHEN they submit payslip, THEN dashboard shows their aggregated data", async () => {
    // ============================
    // GIVEN: a valid auth token
    // ============================
    const apiToken = TEST_TOKEN;

    // ============================
    // WHEN: user registers
    // ============================
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .set("Authorization", `Bearer ${apiToken}`)
      .send()
      .expect(200);

    expect(registerRes.body).toEqual(
      expect.objectContaining({
        firstLogin: true,
        user: expect.any(Object),
      })
    );

    // ============================
    // WHEN: user submits payslip
    // ============================
    const payslipPayload = {
      grossSalary: 60000,
      taxCode: "1257L",
      categories: [
        { name: "Rent", budget: 1000 },
        { name: "Food", budget: 300 },
      ],
    };

    const payslipRes = await request(app)
      .post("/api/v1/payslip")
      .set("Authorization", `Bearer ${apiToken}`)
      .send(payslipPayload)
      .expect(201);

    const payslip = payslipRes.body;

    expect(payslip).toEqual(
      expect.objectContaining({
        grossSalary: expect.any(Number),
        taxPaid: expect.any(Number),
        niPaid: expect.any(Number),
        takeHomePay: expect.any(Number),
        categories: expect.any(Array),
      })
    );

    expect(payslip.grossSalary).toBe(payslipPayload.grossSalary);

    // ============================
    // AND: user has expenses (needed for dashboard aggregation)
    // ============================
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await mongoose.connection.collection("expenses").insertMany([
      {
        userId: TEST_UID,
        amount: 1000,
        category: "Rent",
        month,
        year,
        date: now,
        createdAt: now,
      },
      {
        userId: TEST_UID,
        amount: 300,
        category: "Food",
        month,
        year,
        date: now,
        createdAt: now,
      },
    ]);

    // ============================
    // THEN: dashboard returns aggregated data
    // ============================
    const dashboardRes = await request(app)
      .get("/api/v1/dashboard")
      .set("Authorization", `Bearer ${apiToken}`)
      .expect(200);

    const dashboard = dashboardRes.body;

    expect(dashboard).toMatchObject({
      healthScore: expect.any(Number),
      takeHome: expect.any(Number),
      budgetLeft: expect.any(Number),
      totalBudget: expect.any(Number),
      actualSpending: expect.any(Array),
      budgetAllocation: expect.any(Array),
      healthBreakdown: expect.any(Object),
      adzunaTips: expect.any(Array),
      expenses: expect.any(Array),
    });

    // ============================
    // THEN: budgetAllocation matches payslip categories
    // ============================
    expect(dashboard.budgetAllocation).toEqual(
      expect.arrayContaining([
        { name: "Rent", value: 1000 },
        { name: "Food", value: 300 },
      ])
    );

    // ============================
    // THEN: actualSpending matches aggregated expenses
    // ============================
    expect(dashboard.actualSpending).toEqual(
      expect.arrayContaining([
        { name: "Rent", value: 1000 },
        { name: "Food", value: 300 },
      ])
    );

    // ============================
    // THEN: totalBudget should equal sum of budgets
    // ============================
    expect(dashboard.totalBudget).toBe(1300);

    // ============================
    // THEN: takeHome should come from payslip
    // ============================
    expect(dashboard.takeHome).toBeCloseTo(payslip.takeHomePay, 2);
  });
});