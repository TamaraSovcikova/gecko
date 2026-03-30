//
// TEST MODEL FOR CRON JOB
//

const mongoose = require("mongoose");

const DailyMessageSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true }, // YYYY-MM-DD
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyMessage", DailyMessageSchema);

//
// TEST MODEL FOR CRON JOB
//
