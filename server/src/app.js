// app.js - Configures and exports the Express application.
// Opted to keep it separate from server.js so it can be imported cleanly in tests.
//
// Middleware stack:
//   helmet  - sets secure HTTP headers
//   cors    - allows the React frontend (CLIENT_URL) to call this API
//   json    - parses incoming request bodies as JSON

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

const app = express();

app.use(
  helmet({
    // Firebase popup auth can be noisy or blocked with strict COOP in some flows.
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

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
