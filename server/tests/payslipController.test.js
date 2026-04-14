jest.mock("../src/models/MonthlyBudget", () => ({
  create: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../src/models/Expense", () => ({
  updateMany: jest.fn(),
}));

jest.mock("../src/services/hmrcCalculator", () => jest.fn());

jest.mock("../src/services/dashboardAggregate", () => ({
  computeDashboard: jest.fn(),
}));

const MonthlyBudget = require("../src/models/MonthlyBudget");
const User = require("../src/models/User");
const calculatePayslip = require("../src/services/hmrcCalculator");
const { computeDashboard } = require("../src/services/dashboardAggregate");
const { createPayslip } = require("../src/controllers/payslipController");

const makeResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("payslipController.createPayslip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when gross salary is invalid", async () => {
    // GIVEN: An authenticated user with an invalid gross salary payload
    const req = {
      body: {
        grossSalary: 0,
        categories: [{ name: "Rent", budget: 500 }],
      },
      user: { uid: "user-123" },
      app: { get: jest.fn() },
    };
    const res = makeResponse();

    // WHEN: createPayslip is called
    await createPayslip(req, res);

    // THEN: The API should reject with 400 and should not create a budget
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Gross salary must be a positive number" });
    expect(MonthlyBudget.create).not.toHaveBeenCalled();
  });

  test("creates payslip, updates user, and emits dashboard update", async () => {
    // GIVEN: An authenticated user and a valid payslip payload
    const req = {
      body: {
        grossSalary: 36000,
        categories: [
          { name: "Rent", budget: 900 },
          { name: "Food", budget: 300 },
        ],
      },
      user: { uid: "user-456" },
      app: { get: jest.fn() },
    };
    const res = makeResponse();

    const createdBudget = {
      _id: "budget-1",
      userId: "user-456",
      grossSalary: 36000,
      taxPaid: 4000,
      niPaid: 2000,
      takeHomePay: 30000,
      categories: [
        { name: "Rent", budget: 900 },
        { name: "Food", budget: 300 },
      ],
    };
    const dashboardData = { remainingBudget: 1200, score: 84 };
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const io = { to };

    req.app.get.mockReturnValue(io);
    calculatePayslip.mockReturnValue({ taxPaid: 4000, niPaid: 2000, takeHomePay: 30000 });
    MonthlyBudget.create.mockResolvedValue(createdBudget);
    User.findByIdAndUpdate.mockResolvedValue(null);
    computeDashboard.mockResolvedValue(dashboardData);

    // WHEN: createPayslip is called
    await createPayslip(req, res);

    // THEN: Payslip is created, user onboarding is updated, and budget:update is emitted
    expect(calculatePayslip).toHaveBeenCalledWith(36000);
    expect(MonthlyBudget.create).toHaveBeenCalledWith({
      userId: "user-456",
      grossSalary: 36000,
      taxPaid: 4000,
      niPaid: 2000,
      takeHomePay: 30000,
      categories: [
        { name: "Rent", budget: 900 },
        { name: "Food", budget: 300 },
      ],
    });
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-456", {
      "payslipData.grossSalary": 36000,
      hasCompletedOnboarding: true,
    });
    expect(computeDashboard).toHaveBeenCalledWith("user-456");
    expect(to).toHaveBeenCalledWith("user-456");
    expect(emit).toHaveBeenCalledWith("budget:update", dashboardData);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdBudget);
  });
});
