const express = require("express");
const router = express.Router();
const axios = require("axios");
const { validate } = require("../middleware/validate");
const { chatMessageSchema } = require("../schemas");
const ChatSession = require("../models/ChatSession");
const Expense = require("../models/Expense");
const MonthlyBudget = require("../models/MonthlyBudget");
const SavingsGoal = require("../models/SavingsGoal");
const User = require("../models/User");
const { computeHealthScoreBreakdown } = require("../services/healthScoreService");
const { computeForecastForUser } = require("../services/forecastService");
const { monthlyRepayment, projectLoan, LOAN_PLANS } = require("../lib/studentLoan");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const MAX_HISTORY = 20;
const MAX_TOOL_ROUNDS = 3;

// ─── Tool definitions ────────────────────────────────────────────────────────

const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_budget_overview",
      description:
        "Get the user's monthly take-home pay, total budget, total spent so far this month, and budget remaining. Call this when asked about income, overall budget position, or how much money is left.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_expense_breakdown",
      description:
        "Get spending grouped by category for a specific month. Call this when asked about specific spending, categories, or where money went. Defaults to current month if no month provided.",
      parameters: {
        type: "object",
        properties: {
          month: {
            type: "number",
            description: "Month number 1-12. Defaults to current month.",
          },
          year: {
            type: "number",
            description: "4-digit year. Defaults to current year.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_forecast",
      description:
        "Get the ensemble forecast for next month's spending by category, including confidence scores and any overspend warnings. Call this when asked about predicted spending, forecasts, or whether the user will go over budget.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_health_score",
      description:
        "Get the user's financial health score (0-100) with a breakdown by factor: spending vs income (40%), budget adherence (35%), and plan alignment (25%). Call this when asked about financial health, the health score, or overall financial performance.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_loan_summary",
      description:
        "Get the user's student loan plan, their estimated monthly repayment amount at their current salary, and a 30/40-year payoff projection. Call this when asked about student loan, repayments, or student debt.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_savings_goals",
      description:
        "Get all savings goals with current amount saved, target amount, progress percentage, and completion status. Call this when asked about savings, goals, or saving targets.",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ─── Tool implementations ────────────────────────────────────────────────────

async function executeTool(name, args, userId) {
  const now = new Date();

  switch (name) {
    case "get_budget_overview": {
      const payslip = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });
      if (!payslip) return { error: "No payslip set up yet. The user needs to complete payslip setup first." };

      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const totals = await Expense.aggregate([
        { $match: { userId, month, year } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const totalExpenses = totals[0]?.total || 0;
      const totalBudget = (payslip.categories || []).reduce((s, c) => s + c.budget, 0);

      return {
        takeHomePay: payslip.takeHomePay,
        grossSalary: payslip.grossSalary,
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSpentThisMonth: Math.round(totalExpenses * 100) / 100,
        budgetRemaining: Math.round((totalBudget - totalExpenses) * 100) / 100,
        month: now.toLocaleString("en-GB", { month: "long" }),
        year: now.getFullYear(),
      };
    }

    case "get_expense_breakdown": {
      const month = args.month || now.getMonth() + 1;
      const year = args.year || now.getFullYear();
      const categories = await Expense.aggregate([
        { $match: { userId, month, year } },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]);
      const total = categories.reduce((s, c) => s + c.total, 0);

      return {
        month,
        year,
        total: Math.round(total * 100) / 100,
        categories: categories.map((c) => ({
          category: c._id,
          spent: Math.round(c.total * 100) / 100,
          transactions: c.count,
          pct: total > 0 ? Math.round((c.total / total) * 100) : 0,
        })),
      };
    }

    case "get_forecast": {
      try {
        const result = await computeForecastForUser(userId);
        if (!result.forecastingActive) {
          return {
            active: false,
            reason: result.reason,
            message: "Not enough data to forecast yet. Need at least 2 months of expense history.",
          };
        }
        const topProjections = Object.values(result.projections)
          .sort((a, b) => b.finalForecast - a.finalForecast)
          .slice(0, 8)
          .map((p) => ({
            category: p.category,
            projected: p.finalForecast,
            budget: p.budget,
            confidence: p.confidence,
            trend: p.trend,
            overBudget: p.budget > 0 && p.finalForecast > p.budget,
          }));
        return {
          active: true,
          monthsOfHistory: result.monthsOfHistory,
          totalProjected: result.totals?.totalProjectedSpend,
          projections: topProjections,
          warnings: result.warnings.map((w) => ({
            category: w.category,
            type: w.type,
            message: w.message,
          })),
        };
      } catch {
        return { active: false, reason: "FORECAST_ERROR", message: "Could not compute forecast." };
      }
    }

    case "get_health_score": {
      const payslip = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });
      if (!payslip) return { error: "No payslip set up yet." };

      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const categoryTotals = await Expense.aggregate([
        { $match: { userId, month, year } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
      ]);
      const actualSpending = categoryTotals.map((c) => ({ name: c._id, value: c.total }));
      const totalExpenses = categoryTotals.reduce((s, c) => s + c.total, 0);
      const budgetAllocation = (payslip.categories || []).map((c) => ({ name: c.name, value: c.budget }));
      const totalBudget = budgetAllocation.reduce((s, c) => s + c.value, 0);

      const breakdown = computeHealthScoreBreakdown({
        takeHome: payslip.takeHomePay,
        totalBudget,
        totalExpenses,
        budgetAllocation,
        actualSpending,
      });

      return {
        healthScore: breakdown.healthScore,
        summary: breakdown.summary,
        factors: breakdown.factors.map((f) => ({
          title: f.title,
          score: f.score,
          weight: f.weight,
          impact: f.impact,
          explanation: f.explanation,
          valueLabel: f.valueLabel,
        })),
      };
    }

    case "get_loan_summary": {
      const user = await User.findById(userId);
      if (!user) return { error: "User not found." };

      const plan = user.studentLoan?.plan || "none";
      if (plan === "none")
        return {
          hasloan: false,
          message: "No student loan configured. The user can set this up in the Loans section.",
        };

      const payslip = await MonthlyBudget.findOne({ userId }).sort({ createdAt: -1 });
      const grossAnnual = payslip?.grossSalary || 0;
      const balance = user.studentLoan?.balance || null;
      const planConfig = LOAN_PLANS[plan];
      const monthly = monthlyRepayment(grossAnnual, plan);
      const projection = balance ? projectLoan(grossAnnual, plan, balance) : null;

      return {
        hasloan: true,
        plan,
        planLabel: planConfig?.label || plan,
        threshold: planConfig?.threshold,
        rate: planConfig?.rate,
        writeOffYears: planConfig?.writeOffYears,
        grossSalary: grossAnnual,
        monthlyRepayment: monthly,
        annualRepayment: monthly * 12,
        balance,
        projection: projection
          ? {
              totalRepaid: projection.totalRepaid,
              willWriteOff: projection.willWriteOff,
              yearsToPayOff: projection.yearsToPayOff,
              writeOffBalance: projection.writeOffBalance,
            }
          : null,
        aboveThreshold: grossAnnual > (planConfig?.threshold || 0),
      };
    }

    case "get_savings_goals": {
      const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });
      if (!goals.length) return { goals: [], message: "No savings goals set up yet." };

      return {
        goals: goals.map((g) => ({
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          progressPct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
          remaining: Math.max(0, g.targetAmount - g.currentAmount),
          category: g.category,
          targetDate: g.targetDate,
          isCompleted: g.isCompleted,
        })),
        totalGoals: goals.length,
        completedGoals: goals.filter((g) => g.isCompleted).length,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a personal finance tutor built into Gecko, an app for young UK adults (ages 18-28) learning to manage money for the first time.

You have tools to look up the user's real financial data. Use them when the question is about their specific situation. Ask yourself: "do I need their actual numbers to answer this?" If yes, call the relevant tool before responding.

Rules:
- Answer only personal finance questions: payslips, tax, NI, budgeting, saving, debt, ISAs, pensions basics, financial habits.
- No regulated investment advice or specific product recommendations.
- Use GBP. Assume UK tax rules (income tax bands, NI, personal allowance).
- Keep responses concise: 3-5 sentences max unless a step-by-step breakdown is genuinely needed.
- Use plain markdown: **bold** for key numbers or terms, bullet points where helpful. No headers (#).
- When explaining payslip items (tax, NI, pension), explain what that money actually does.
- When the user overspends somewhere, say so with the exact figure and the annualised impact.
- Be direct and warm. Skip filler phrases like "Great question!" or "Certainly!".
- When you fetch data, reference the real numbers in your answer - do not summarise vaguely.
- If you do not have enough data, say what the user needs to add in the app.

Remember: this user may be seeing their payslip explained for the first time. Assume no prior financial knowledge unless they demonstrate it.`;

// ─── Agentic loop ────────────────────────────────────────────────────────────

async function runAgentLoop(messages, userId, onTool) {
  let round = 0;
  const msgs = [...messages];

  while (round < MAX_TOOL_ROUNDS) {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: msgs,
        tools: AGENT_TOOLS,
        tool_choice: "auto",
        max_tokens: 1024,
        temperature: 0.5,
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const choice = response.data.choices[0];
    if (!choice) break;

    if (choice.finish_reason !== "tool_calls" || !choice.message?.tool_calls?.length) {
      break;
    }

    msgs.push(choice.message);

    for (const toolCall of choice.message.tool_calls) {
      const toolName = toolCall.function.name;
      let toolArgs = {};
      try {
        toolArgs = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        /* ignore */
      }

      if (onTool) onTool(toolName);

      const result = await executeTool(toolName, toolArgs, userId);
      msgs.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    round++;
  }

  return msgs;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get("/history", async (req, res) => {
  try {
    const session = await ChatSession.findOne({ userId: req.user.uid });
    res.json({ messages: session ? session.messages : [] });
  } catch {
    res.status(500).json({ error: "Failed to load chat history" });
  }
});

router.delete("/history", async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({ userId: req.user.uid });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// POST /api/v1/chat/stream - SSE streaming agent response
router.post("/stream", validate({ body: chatMessageSchema }), async (req, res) => {
  const { message } = req.body;
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "Groq API key not configured" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    let session = await ChatSession.findOne({ userId });
    if (!session) session = new ChatSession({ userId, messages: [] });
    const history = session.messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }));

    const initialMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    // Run the agentic tool-calling loop. Notify client of each tool being called.
    const resolvedMessages = await runAgentLoop(initialMessages, userId, (toolName) => {
      send({ tool: toolName });
    });

    // Stream the final response
    const groqRes = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: resolvedMessages,
        max_tokens: 512,
        temperature: 0.7,
        stream: true,
      },
      {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        responseType: "stream",
      }
    );

    let fullReply = "";

    groqRes.data.on("data", (chunk) => {
      for (const line of chunk
        .toString()
        .split("\n")
        .filter((l) => l.trim())) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") {
          send({ done: true });
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          const token = parsed.choices?.[0]?.delta?.content || "";
          if (token) {
            fullReply += token;
            send({ token });
          }
        } catch {
          /* ignore */
        }
      }
    });

    groqRes.data.on("end", async () => {
      if (fullReply) {
        session.messages.push({ role: "user", content: message });
        session.messages.push({ role: "assistant", content: fullReply });
        await session.save();
      }
      send({ done: true });
      res.end();
    });

    groqRes.data.on("error", (err) => {
      console.error("[chat/stream] stream error:", err.message);
      send({ error: "Stream error" });
      res.end();
    });

    req.on("close", () => groqRes.data.destroy());
  } catch (error) {
    console.error("[chat/stream] failed:", error?.response?.data || error?.message);
    send({ error: "Failed to get streaming response" });
    res.end();
  }
});

// POST /api/v1/chat - non-streaming fallback
router.post("/", validate({ body: chatMessageSchema }), async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "Groq API key not configured" });

    let session = await ChatSession.findOne({ userId });
    if (!session) session = new ChatSession({ userId, messages: [] });
    const history = session.messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }));

    const initialMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    const resolvedMessages = await runAgentLoop(initialMessages, userId, null);

    const response = await axios.post(
      GROQ_API_URL,
      { model: GROQ_MODEL, messages: resolvedMessages, max_tokens: 512, temperature: 0.7 },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const reply = response.data.choices[0]?.message?.content || "Sorry, I could not generate a response.";
    session.messages.push({ role: "user", content: message });
    session.messages.push({ role: "assistant", content: reply });
    await session.save();

    res.json({ reply });
  } catch (error) {
    console.error("[chat] Groq request failed:", error?.response?.data || error?.message);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
});

module.exports = router;
