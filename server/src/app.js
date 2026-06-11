const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const authMiddleware = require("./middleware/auth");
const { authLimiter, chatLimiter, apiLimiter } = require("./middleware/rateLimit");
const logger = require("./utils/logger");

const router = require("./routes/index");
const dashboardRouter = require("./routes/dashboard");
const authRouter = require("./routes/auth");
const payslipRouter = require("./routes/payslip");
const userRouter = require("./routes/user");
const expenseRoutes = require("./routes/expense");
const quizRoutes = require("./routes/quiz");
const forecastRoutes = require("./routes/forecast");
require("./config/firebase"); // initializes Firebase once

const snapshotRoutes = require("./routes/snapshot");
const chatRoutes = require("./routes/chat");
const savingsRoutes = require("./routes/savings");
const recurringRoutes = require("./routes/recurring");

const app = express();

app.use(pinoHttp({ logger, customLogLevel: (_req, res, err) => {
  if (err || res.statusCode >= 500) return "error";
  if (res.statusCode >= 400) return "warn";
  return "info";
}}));

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// Health check (unauthenticated, no rate limit). Used by uptime monitors and CI.
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

require("./jobs/monthlySnapshotJob");

app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/dashboard", authMiddleware, apiLimiter, dashboardRouter);
app.use("/api/v1/expenses", authMiddleware, apiLimiter, expenseRoutes);
app.use("/api/v1/snapshots", authMiddleware, apiLimiter, snapshotRoutes);
app.use("/api/v1/quiz", authMiddleware, apiLimiter, quizRoutes);
app.use("/api/v1/payslip", authMiddleware, apiLimiter, payslipRouter);
app.use("/api/v1/user", authMiddleware, apiLimiter, userRouter);
app.use("/api/v1/forecast", authMiddleware, apiLimiter, forecastRoutes);
app.use("/api/v1/chat", authMiddleware, chatLimiter, chatRoutes);
app.use("/api/v1/savings", authMiddleware, apiLimiter, savingsRoutes);
app.use("/api/v1/recurring", authMiddleware, apiLimiter, recurringRoutes);

app.use("/", router);

module.exports = app;
