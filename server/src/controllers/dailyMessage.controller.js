//
// TEST CONTROLLER FOR CRON JOB
//

const DailyMessage = require("../models/DailyMessage");

function getDateKey(date = new Date()) {
  return date.toISOString().split("T")[0];
}

exports.getTodayMessage = async (req, res) => {
  try {
    const todayKey = getDateKey();
    const msg = await DailyMessage.findOne({ dateKey: todayKey });

    if (!msg) {
      return res.status(404).json({ message: "No message found for today." });
    }

    return res.json(msg);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

//
// TEST CONTROLLER FOR CRON JOB
//