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

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use('/', router);

module.exports = app;
