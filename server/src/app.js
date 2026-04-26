// app.js - Configures and exports the Express application.
// Opted to keep it separate from server.js so it can be imported cleanly in tests.
//
// Middleware stack:
//   helmet  - sets secure HTTP headers
//   cors    - allows the React frontend (CLIENT_URL) to call this API
//   json    - parses incoming request bodies as JSON

require("./config/firebase"); // initializes Firebase once

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const router = require('./routes/index');
const dashboardRouter = require('./routes/dashboard');
const expenseRoutes = require('./routes/expense');

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

//
// TEST ROUTES FOR CRON JOB
//

// !! ACTUAL SNAPSHOT TEST !!
// IMPORTANT: Import the cron job so it runs automatically
require("./jobs/monthlySnapshotJob");

// Snapshots route
const snapshotRoutes = require("./routes/snapshot");
app.use("/api/snapshots", snapshotRoutes);
// !! ACTUAL CRON JOB TEST !!

//
// TEST ROUTES FOR CRON JOB
//

app.use('/api/v1/expenses', expenseRoutes);

app.use('/', router);

module.exports = app;
