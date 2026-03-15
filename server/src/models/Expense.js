//models.Expense - called it this as suggested in MVP work distribution.
//this is basic - mongoose new to me so based off documentaton and User.js

const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.schema({
    user_id: {
        type: String,
        required: true,
    },
    month: {
        type: String,  //could alternatively be a number?
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    category: {
        type: String, //this could also be a number? if easier
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    note: {
        type: String,
    }
})

module.exports = mongoose.model('Expense', ExpenseSchema);