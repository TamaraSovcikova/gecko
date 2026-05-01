const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authMiddleware = require("./middleware/auth");

<<<<<<< HEAD
const router = require("./routes/index");
const expenseRoutes = require("./routes/expense");
const quizRoutes = require("./routes/quiz");
const forecastRoutes = require("./routes/forecast");

const snapshotRoutes = require("./routes/snapshot");
=======
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authMiddleware = require('./middleware/auth');

const router = require('./routes/index');
const dashboardRouter = require('./routes/dashboard');
const expenseRoutes = require('./routes/expense');
const authRouter = require('./routes/auth');
const quizRouter = require('./routes/quiz');
const payslipRouter = require('./routes/payslip');
const userRouter = require('./routes/user');
>>>>>>> origin/main

const app = express();

// Security + middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

<<<<<<< HEAD
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Routes
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/forecast", authMiddleware, forecastRoutes);
app.use("/api/snapshots", snapshotRoutes);
app.use("/", router);

// Optional cron job (safer control)
if (process.env.ENABLE_CRON === "true") {
  require("./jobs/monthlySnapshotJob");
}

module.exports = app;
=======
// IMPORTANT: Import the cron job so it runs automatically
require("./jobs/monthlySnapshotJob");

const snapshotRoutes = require("./routes/snapshot");


// All API routes mounted under /api/v1/*
// Caddy proxies /api/* directly to the backend without stripping the prefix.
// Public routes (no auth required)
app.use("/api/v1/auth", authRouter);

// Protected routes (auth required)
app.use("/api/v1/dashboard", authMiddleware, dashboardRouter);
app.use("/api/v1/expenses", authMiddleware, expenseRoutes);
app.use("/api/v1/snapshots", authMiddleware, snapshotRoutes);
app.use("/api/v1/quiz", authMiddleware, quizRouter);
app.use("/api/v1/payslip", authMiddleware, payslipRouter);
app.use("/api/v1/user", authMiddleware, userRouter);

// Public routes (health checks, login page, etc.)
app.use('/', router);

module.exports = app;
>>>>>>> origin/main
