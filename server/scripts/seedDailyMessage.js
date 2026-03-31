const mongoose = require("mongoose");
const DailyMessage = require("../src/models/DailyMessage.js");

// mongoose.connect('mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>');

async function seedMessage() {
  await mongoose.connect('mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>');

  const todayKey = new Date().toISOString().split("T")[0];

  const msg = await DailyMessage.findOneAndUpdate(
    { dateKey: todayKey },
    { dateKey: todayKey, message: "Hello World + manual test entry" },
    { upsert: true, new: true }
  );

  console.log("Seeded:", msg);

  await mongoose.disconnect();
}

seedMessage();