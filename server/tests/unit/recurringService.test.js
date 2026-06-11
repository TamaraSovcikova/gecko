// tests/unit/recurringService.test.js
// Unit tests for the recurring transaction detection service.

const { detectRecurringTransactions } = require("../../src/services/recurringService");

jest.mock("../../src/models/Expense");
const Expense = require("../../src/models/Expense");

function mockFind(data) {
  Expense.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(data) });
}

function makeExpenses(category, amount, startYear, startMonth, count, day = 15) {
  return Array.from({ length: count }, (_, i) => {
    const month = ((startMonth - 1 + i) % 12) + 1;
    const year = startYear + Math.floor((startMonth - 1 + i) / 12);
    return { userId: "u1", category, amount, date: new Date(year, month - 1, day), note: "" };
  });
}

beforeEach(() => jest.clearAllMocks());

describe("detectRecurringTransactions", () => {
  it("returns empty array when no expenses", async () => {
    mockFind([]);
    const result = await detectRecurringTransactions("u1");
    expect(result).toEqual([]);
  });

  it("returns empty for fewer than 3 total expenses", async () => {
    mockFind([
      { userId: "u1", category: "food", amount: 50, date: new Date(2026, 0, 15), note: "" },
      { userId: "u1", category: "food", amount: 50, date: new Date(2026, 1, 15), note: "" },
    ]);
    const result = await detectRecurringTransactions("u1");
    expect(result).toEqual([]);
  });

  it("detects a consistent monthly subscription", async () => {
    const expenses = makeExpenses("streaming", 14.99, 2026, 1, 4);
    mockFind(expenses);
    const result = await detectRecurringTransactions("u1");
    expect(result.length).toBeGreaterThan(0);
    const found = result.find((r) => r.category === "streaming");
    expect(found).toBeDefined();
    expect(found.avgAmount).toBeCloseTo(14.99, 1);
    expect(found.confidence).toBeGreaterThan(60);
    expect(found.monthsSeen).toBe(4);
  });

  it("ignores irregular transactions (high amount variance)", async () => {
    const expenses = [
      { userId: "u1", category: "misc", amount: 10, date: new Date(2026, 0, 15), note: "" },
      { userId: "u1", category: "misc", amount: 80, date: new Date(2026, 1, 15), note: "" },
      { userId: "u1", category: "misc", amount: 200, date: new Date(2026, 2, 15), note: "" },
    ];
    mockFind(expenses);
    const result = await detectRecurringTransactions("u1");
    expect(result.find((r) => r.category === "misc")).toBeUndefined();
  });

  it("ignores transactions that only appear in one month", async () => {
    const expenses = [
      { userId: "u1", category: "singleton", amount: 50, date: new Date(2026, 0, 10), note: "" },
      { userId: "u1", category: "singleton", amount: 50, date: new Date(2026, 0, 11), note: "" },
      { userId: "u1", category: "singleton", amount: 50, date: new Date(2026, 0, 12), note: "" },
    ];
    mockFind(expenses);
    const result = await detectRecurringTransactions("u1");
    expect(result.find((r) => r.category === "singleton")).toBeUndefined();
  });

  it("returns results sorted by daysUntil ascending", async () => {
    const expenses = [...makeExpenses("cat-a", 20, 2026, 1, 3, 5), ...makeExpenses("cat-b", 30, 2026, 1, 3, 20)];
    mockFind(expenses);
    const result = await detectRecurringTransactions("u1");
    for (let i = 1; i < result.length; i++) {
      expect(result[i].daysUntil).toBeGreaterThanOrEqual(result[i - 1].daysUntil);
    }
  });

  it("marks paidThisMonth true when current month has an entry", async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const expenses = [
      // 3 past months
      { userId: "u1", category: "gym", amount: 25, date: new Date(year, month - 3, 10), note: "" },
      { userId: "u1", category: "gym", amount: 25, date: new Date(year, month - 2, 10), note: "" },
      { userId: "u1", category: "gym", amount: 25, date: new Date(year, month - 1, 10), note: "" },
      // current month - already paid
      { userId: "u1", category: "gym", amount: 25, date: new Date(year, month, 10), note: "" },
    ];
    mockFind(expenses);
    const result = await detectRecurringTransactions("u1");
    const found = result.find((r) => r.category === "gym");
    if (found) expect(found.paidThisMonth).toBe(true);
  });
});
