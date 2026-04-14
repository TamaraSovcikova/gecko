// scripts/clearMonthlySnapshots.js

const mongoose = require("mongoose");
const MonthlySnapshot = require("../src/models/MonthlySnapshot");

mongoose.connect('mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>');

async function clearSnapshots() {
  await MonthlySnapshot.deleteMany({});
  console.log('All snapshots deleted');
  process.exit();
}

clearSnapshots();