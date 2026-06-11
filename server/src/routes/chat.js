const express = require("express");
const router = express.Router();
const axios = require("axios");
const { retrieveDashboardData } = require("./dashboard");
const { validate } = require("../middleware/validate");
const { chatMessageSchema } = require("../schemas");
const ChatSession = require("../models/ChatSession");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const MAX_HISTORY = 20;

function buildSystemPrompt(data) {
  const d = data || {};
  const takeHome = d.takeHome ? `£${Number(d.takeHome).toFixed(2)}/month` : "unknown";
  const budgetLeft = d.budgetLeft != null ? `£${Number(d.budgetLeft).toFixed(2)} remaining this month` : null;
  const healthScore = d.healthScore != null ? `${d.healthScore}/100` : null;
  const categories =
    Array.isArray(d.budgetAllocation) && d.budgetAllocation.length
      ? d.budgetAllocation.map((c) => `${c.name}: £${Number(c.value).toFixed(2)}`).join(", ")
      : null;
  const spending =
    Array.isArray(d.actualSpending) && d.actualSpending.length
      ? d.actualSpending.map((c) => `${c.name}: £${Number(c.value).toFixed(2)}`).join(", ")
      : null;

  const userSummary = [
    `Take-home pay: ${takeHome}`,
    budgetLeft ? `Budget remaining: ${budgetLeft}` : null,
    healthScore ? `Financial health score: ${healthScore}` : null,
    categories ? `Budget categories: ${categories}` : null,
    spending ? `Actual spending this month: ${spending}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a personal finance tutor built into Gecko, an app for young UK adults (ages 18-28) learning to manage money for the first time.

Your job is to teach, not just answer. When you explain something, help the user understand WHY it matters, not just what the number is. Reference their real data directly — never give generic advice when you know their actual situation.

Rules:
- Only answer personal finance questions: payslips, tax, NI, budgeting, saving, debt, ISAs, pensions basics, financial habits.
- No regulated investment or specific pension product recommendations — politely redirect if asked.
- Use GBP. Assume UK tax rules (income tax bands, NI, personal allowance).
- Keep responses concise: 3-5 sentences max unless a step-by-step breakdown is genuinely needed.
- Use plain markdown: **bold** for key numbers or terms, bullet points where helpful. No headers (#).
- When explaining payslip items (tax, NI, pension), explain what that money actually does — e.g. NI builds State Pension entitlement, income tax funds public services.
- When the user overspends somewhere, say so with the exact figure and the annualised impact.
- If you don't have enough data to answer specifically, say so and suggest what they should add in the app.
- Be direct and warm. Skip filler phrases like "Great question!" or "Certainly!".
- When a topic has a deeper explanation, point toward the Learn section in the app.

User's financial snapshot:
${userSummary || "No financial data available yet. The user may not have set up their payslip."}

Remember: this user may be seeing their payslip explained for the first time. Assume no prior financial knowledge unless they demonstrate it.`;
}

// GET /api/v1/chat/history - load session history
router.get("/history", async (req, res) => {
  try {
    const userId = req.user.uid;
    const session = await ChatSession.findOne({ userId });
    res.json({ messages: session ? session.messages : [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat history" });
  }
});

// DELETE /api/v1/chat/history - clear session
router.delete("/history", async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({ userId: req.user.uid });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// POST /api/v1/chat - send a message (with history, non-streaming)
router.post("/", validate({ body: chatMessageSchema }), async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "Groq API key not configured" });

    const dashboardData = await retrieveDashboardData(userId);
    const systemPrompt = buildSystemPrompt(dashboardData);

    let session = await ChatSession.findOne({ userId });
    if (!session) session = new ChatSession({ userId, messages: [] });

    const history = session.messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }));

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }],
        max_tokens: 512,
        temperature: 0.7,
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const reply = response.data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    session.messages.push({ role: "user", content: message });
    session.messages.push({ role: "assistant", content: reply });
    await session.save();

    res.json({ reply });
  } catch (error) {
    console.error("[chat] Groq request failed:", error?.response?.data || error?.message);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
});

// POST /api/v1/chat/stream - SSE streaming response
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
    const dashboardData = await retrieveDashboardData(userId);
    const systemPrompt = buildSystemPrompt(dashboardData);

    let session = await ChatSession.findOne({ userId });
    if (!session) session = new ChatSession({ userId, messages: [] });
    const history = session.messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }));

    const groqRes = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }],
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
      const lines = chunk
        .toString()
        .split("\n")
        .filter((l) => l.trim());
      for (const line of lines) {
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
          /* ignore malformed chunks */
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

module.exports = router;
