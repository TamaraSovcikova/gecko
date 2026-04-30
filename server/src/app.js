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

const router = require('./routes/index');
const dashboardRouter = require('./routes/dashboard');
const expenseRoutes = require('./routes/expense');
const authRouter = require('./routes/auth');

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


app.use("/api/v1/auth", authRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/snapshots", snapshotRoutes);

app.use('/', router);

module.exports = app;
