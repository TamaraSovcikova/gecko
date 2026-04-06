// scripts/clearMonthlySnapshots.js

const mongoose = require("mongoose");
const MonthlySnapshot = require("../models/MonthlySnapshot");

async function clearSnapshots() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await MonthlySnapshot.deleteMany({});
    console.log(`[CLEAR] Deleted ${result.deletedCount} monthly snapshots`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[CLEAR] Error clearing snapshots:", err);
    process.exit(1);
  }
}

clearSnapshots();