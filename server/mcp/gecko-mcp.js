#!/usr/bin/env node
/**
 * Gecko MCP Server
 *
 * Exposes your Gecko financial data as a set of tools that any MCP-compatible
 * AI client can call directly.
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." GECKO_USER_ID="your-firebase-uid" node server/mcp/gecko-mcp.js
 *
 * Connect from an MCP client by adding to its config:
 *   {
 *     "mcpServers": {
 *       "gecko": {
 *         "command": "node",
 *         "args": ["path/to/gecko/server/mcp/gecko-mcp.js"],
 *         "env": { "MONGODB_URI": "...", "GECKO_USER_ID": "..." }
 *       }
 *     }
 *   }
 */

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const mongoose = require("mongoose");
const path = require("path");

// ─── Environment ─────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
const USER_ID = process.env.GECKO_USER_ID;

if (!MONGODB_URI) { console.error("[gecko-mcp] MONGODB_URI env var is required"); process.exit(1); }
if (!USER_ID) { console.error("[gecko-mcp] GECKO_USER_ID env var is required"); process.exit(1); }

// ─── Models (loaded after Mongoose connects) ─────────────────────────────────

let Expense, MonthlyBudget, SavingsGoal, User;

async function loadModels() {
  // Dynamic require after connection to avoid Mongoose registration issues
  Expense = require(path.join(__dirname, "../src/models/Expense"));
  MonthlyBudget = require(path.join(__dirname, "../src/models/MonthlyBudget"));
  SavingsGoal = require(path.join(__dirname, "../src/models/SavingsGoal"));
  User = require(path.join(__dirname, "../src/models/User"));
}

// ─── Helper services ─────────────────────────────────────────────────────────

const { computeHealthScoreBreakdown } = require(path.join(__dirname, "../src/services/healthScoreService"));
const { computeForecastForUser } = require(path.join(__dirname, "../src/services/forecastService"));
const { LOAN_PLANS, monthlyRepayment, projectLoan } = require(path.join(__dirname, "../src/lib/studentLoan"));

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "gecko",
  version: "1.0.0",
});

// Tool: budget overview
server.tool(
  "gecko_budget_overview",
  "Get the user's monthly take-home pay, total budget, total spent so far this month, and budget remaining.",
  {},
  async () => {
    const now = new Date();
    const payslip = await MonthlyBudget.findOne({ userId: USER_ID }).sort({ createdAt: -1 });
    if (!payslip) return { content: [{ type: "text", text: "No payslip set up." }] };

    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const totals = await Expense.aggregate([
      { $match: { userId: USER_ID, month, year } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses = totals[0]?.total || 0;
    const totalBudget = (payslip.categories || []).reduce((s, c) => s + c.budget, 0);

    const result = {
      takeHomePay: payslip.takeHomePay,
      grossSalary: payslip.grossSalary,
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalSpentThisMonth: Math.round(totalExpenses * 100) / 100,
      budgetRemaining: Math.round((totalBudget - totalExpenses) * 100) / 100,
      month: now.toLocaleString("en-GB", { month: "long" }),
      year: now.getFullYear(),
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool: expense breakdown
server.tool(
  "gecko_expense_breakdown",
  "Get spending grouped by category for a given month. Defaults to the current month.",
  { month: z.number().int().min(1).max(12).optional(), year: z.number().int().optional() },
  async ({ month, year }) => {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const categories = await Expense.aggregate([
      { $match: { userId: USER_ID, month: m, year: y } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    const total = categories.reduce((s, c) => s + c.total, 0);

    const result = {
      month: m,
      year: y,
      total: Math.round(total * 100) / 100,
      categories: categories.map((c) => ({
        category: c._id,
        spent: Math.round(c.total * 100) / 100,
        transactions: c.count,
        pct: total > 0 ? Math.round((c.total / total) * 100) : 0,
      })),
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool: forecast
server.tool(
  "gecko_forecast",
  "Get the ensemble spending forecast for next month with per-category projections, confidence scores, and overspend warnings.",
  {},
  async () => {
    try {
      const result = await computeForecastForUser(USER_ID);
      if (!result.forecastingActive) {
        return { content: [{ type: "text", text: `Forecast not active: ${result.reason}. Need at least 2 months of expense history.` }] };
      }
      const summary = {
        active: true,
        monthsOfHistory: result.monthsOfHistory,
        totalProjected: result.totals?.totalProjectedSpend,
        projections: Object.values(result.projections).sort((a, b) => b.finalForecast - a.finalForecast).map((p) => ({
          category: p.category,
          projected: p.finalForecast,
          budget: p.budget,
          confidence: p.confidence,
          trend: p.trend,
          overBudget: p.budget > 0 && p.finalForecast > p.budget,
        })),
        warnings: result.warnings,
      };
      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Forecast error: ${err.message}` }] };
    }
  }
);

// Tool: health score
server.tool(
  "gecko_health_score",
  "Get the user's financial health score (0-100) with a breakdown by factor: spending vs income (40%), budget adherence (35%), and plan alignment (25%).",
  {},
  async () => {
    const now = new Date();
    const payslip = await MonthlyBudget.findOne({ userId: USER_ID }).sort({ createdAt: -1 });
    if (!payslip) return { content: [{ type: "text", text: "No payslip set up." }] };

    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const categoryTotals = await Expense.aggregate([
      { $match: { userId: USER_ID, month, year } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);
    const actualSpending = categoryTotals.map((c) => ({ name: c._id, value: c.total }));
    const totalExpenses = categoryTotals.reduce((s, c) => s + c.total, 0);
    const budgetAllocation = (payslip.categories || []).map((c) => ({ name: c.name, value: c.budget }));
    const totalBudget = budgetAllocation.reduce((s, c) => s + c.value, 0);

    const breakdown = computeHealthScoreBreakdown({ takeHome: payslip.takeHomePay, totalBudget, totalExpenses, budgetAllocation, actualSpending });
    return { content: [{ type: "text", text: JSON.stringify(breakdown, null, 2) }] };
  }
);

// Tool: student loan summary
server.tool(
  "gecko_loan_summary",
  "Get student loan plan, monthly repayment amount, and 30/40-year payoff projection.",
  {},
  async () => {
    const user = await User.findById(USER_ID);
    if (!user) return { content: [{ type: "text", text: "User not found." }] };

    const plan = user.studentLoan?.plan || "none";
    if (plan === "none") return { content: [{ type: "text", text: "No student loan configured." }] };

    const payslip = await MonthlyBudget.findOne({ userId: USER_ID }).sort({ createdAt: -1 });
    const grossAnnual = payslip?.grossSalary || 0;
    const balance = user.studentLoan?.balance || null;
    const planConfig = LOAN_PLANS[plan];
    const monthly = monthlyRepayment(grossAnnual, plan);
    const projection = balance ? projectLoan(grossAnnual, plan, balance) : null;

    const result = {
      plan, planLabel: planConfig?.label, threshold: planConfig?.threshold,
      grossSalary: grossAnnual, monthlyRepayment: monthly, annualRepayment: monthly * 12,
      balance, projection, aboveThreshold: grossAnnual > (planConfig?.threshold || 0),
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool: savings goals
server.tool(
  "gecko_savings_goals",
  "Get all savings goals with current progress, target amounts, and completion status.",
  {},
  async () => {
    const goals = await SavingsGoal.find({ userId: USER_ID }).sort({ createdAt: -1 });
    if (!goals.length) return { content: [{ type: "text", text: "No savings goals set up." }] };

    const result = {
      goals: goals.map((g) => ({
        name: g.name, category: g.category,
        targetAmount: g.targetAmount, currentAmount: g.currentAmount,
        progressPct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
        remaining: Math.max(0, g.targetAmount - g.currentAmount),
        targetDate: g.targetDate, isCompleted: g.isCompleted,
      })),
      summary: { total: goals.length, completed: goals.filter((g) => g.isCompleted).length },
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ─── Start ───────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(MONGODB_URI);
  await loadModels();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server runs until the process is killed — do not log to stdout (MCP uses stdio)
}

main().catch((err) => {
  console.error("[gecko-mcp] Fatal error:", err);
  process.exit(1);
});
