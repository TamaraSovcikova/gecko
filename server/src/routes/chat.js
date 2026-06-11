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
  return `You are a finance-only assistant inside a budgeting app for young adults (ages 20-25).

Rules:
- Only answer questions about personal finance: budgeting, spending, saving, debt, income, expense tracking.
- No investment or pension recommendations (regulated advice).
- No medical, fitness, or general lifestyle advice unless directly tied to spending.
- Do not give mental health advice. Be supportive and non-judgmental.
- If a question is ambiguous, interpret it financially.
- Use GBP (British pounds) as the default currency.
- Responses should be clear, practical, and appropriate for a young adult.
- No markdown formatting (no bold, headers, or bullet points).
- If you cannot answer, apologise briefly and redirect.
- Encourage using the in-app quiz or learning features when relevant.

User's current financial data:
${JSON.stringify(data, null, 2)}`;
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
      const lines = chunk.toString().split("\n").filter((l) => l.trim());
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
        } catch { /* ignore malformed chunks */ }
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
