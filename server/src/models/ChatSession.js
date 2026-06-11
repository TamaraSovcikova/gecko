const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

// Keep max 40 messages (20 turns) to avoid unbounded growth
ChatSessionSchema.pre("save", function (next) {
  if (this.messages.length > 40) {
    this.messages = this.messages.slice(-40);
  }
  next();
});

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
