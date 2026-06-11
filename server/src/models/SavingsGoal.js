const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema({
  amount:    { type: Number, required: true, min: 0 },
  note:      { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  targetDate: {
    type: Date,
    default: null,
  },
  category: {
    type: String,
    enum: ["emergency", "travel", "purchase", "education", "home", "retirement", "other"],
    default: "other",
  },
  emoji: {
    type: String,
    default: "🎯",
    maxlength: 8,
  },
  color: {
    type: String,
    default: "#8b6fd4",
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  contributions: [contributionSchema],
}, {
  timestamps: true,
});

savingsGoalSchema.virtual("progressPct").get(function () {
  if (!this.targetAmount || this.targetAmount === 0) return 0;
  return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

savingsGoalSchema.virtual("remainingAmount").get(function () {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

savingsGoalSchema.virtual("monthsToTarget").get(function () {
  if (!this.targetDate) return null;
  const now = new Date();
  const months = (this.targetDate.getFullYear() - now.getFullYear()) * 12 + (this.targetDate.getMonth() - now.getMonth());
  return Math.max(0, months);
});

savingsGoalSchema.set("toJSON", { virtuals: true });
savingsGoalSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("SavingsGoal", savingsGoalSchema);
