// models/MonthlyBudget.js - Mongoose schema for the category document.

const mongoose = require('mongoose');

// For the categories[] array to store user-defined budget categories
const CategorySchema = new mongoose.Schema(
  {
    name: String,
    budget: Number
  });

const MonthlyBudgetSchema = new mongoose.Schema(
    {
    userId: {
        type: String,
        ref: "User",
        required: true,
    },

    grossSalary: {
        type: Number,
        required: true
    }, 

    taxPaid: Number,
    niPaid: Number,
    takeHomePay: Number,
    
    // Dependency for Slot 4
    categories: [CategorySchema]
  },
  {
    // createdAt and updatedAt timestamps added automatically by Mongoose
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

module.exports = mongoose.model('MonthlyBudget', MonthlyBudgetSchema);
