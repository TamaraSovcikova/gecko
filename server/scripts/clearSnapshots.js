// scripts/clearMonthlySnapshots.js

require("dotenv").config();
const mongoose = require("mongoose");
const MonthlySnapshot = require("../src/models/MonthlySnapshot");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set. Add it to server/.env before running this script.");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI);

async function clearSnapshots() {
  await MonthlySnapshot.deleteMany({});
  console.log('All snapshots deleted');
  process.exit();
}

clearSnapshots();