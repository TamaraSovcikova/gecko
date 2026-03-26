// models/Expense.js - called it this as suggested in MVP work distribution.

const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    //ID of Firebase owner
    userId: {
        type: String,
        required: true,
    },
    month: { //respective month the expense belongs too...
        type: Number,  // Changed from String -> Number, as needed for the ComputeDashboard() function
        required: true,
    },
    year: { //year of expense
        type: Number,
        required: true,
    },
    category: { //category of the expense, this gonna be like: travel, food, etc so figured string was best but...
        type: String, //...this could also be a number? if easier
        required: true,
    },
    amount: { //this doesn't really need a comment...
        type: Number,
        required: true,
    },
    date: { //this also doesn't really need a comment...
        type: Date,
        required: true,
    },
    note: { //allows user to put a note for specific expense
        type: String,
    }
    //was looking at 'User.js' - wondering if 'timestamps' include dates?
})

//model exported to allow other files to query
module.exports = mongoose.model('Expense', ExpenseSchema);