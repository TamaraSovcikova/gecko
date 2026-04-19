// server/models/MonthlySnapshot.js

const mongoose = require("mongoose");

const CategorySnapshotSchema = new mongoose.Schema({
  name: String,
  budget: Number,
  actual: Number,
});

const MonthlySnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    healthScore: {
      type: Number,
      required: true,
    },

    grossSalary: {
      type: Number,
      required: true,
    },

    takeHomePay: {
      type: Number,
      required: true,
    },

    totalExpenses: {
      type: Number,
      required: true,
    },

    savings: {
      type: Number,
      required: true,
    },

    categories: [CategorySnapshotSchema],

    xpEarned: {
      type: Number,
      default: 0,
    },

    quizzesCompleted: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// prevents duplicates
MonthlySnapshotSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("MonthlySnapshot", MonthlySnapshotSchema);