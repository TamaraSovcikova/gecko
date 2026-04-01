const mongoose = require("mongoose");

const CategoryTotalSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    total: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const NewsletterSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    metrics: {
      income: { type: Number, default: 0 },
      expenses: { type: Number, default: 0 },
      savings: { type: Number, default: 0 },
      totalBudget: { type: Number, default: 0 },
      budgetLeft: { type: Number, default: 0 },
      quizXpActivity: { type: Number, default: 0 },
      quizXpTotal: { type: Number, default: 0 },
    },
    comparisons: {
      incomePercent: { type: Number, default: null },
      expensesPercent: { type: Number, default: null },
      savingsPercent: { type: Number, default: null },
      quizXpPercent: { type: Number, default: null },
    },
    trends: {
      type: [String],
      default: [],
    },
    categoryTotals: {
      type: [CategoryTotalSchema],
      default: [],
    },
    consistencyChecks: {
      type: [String],
      default: [],
    },
    isFirstMonth: {
      type: Boolean,
      default: false,
    },
    endingXpTotal: {
      type: Number,
      default: 0,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

NewsletterSnapshotSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("NewsletterSnapshot", NewsletterSnapshotSchema);
