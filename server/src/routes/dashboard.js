// routes/dashboard.js - provide data for frontend
//aim to collect all 'expenses' and return data

const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense"); //import Expense model
const Payslip = require("../models/MonthlyBudget"); //import MonthlyBudget (this if fro payslip)
const authMiddleware = require("../middleware/auth"); //import middleware - this verifies token before (!!) the route runs - if not authenticated, can't use


// GET api/v1/dashboard
//this should be protected - reuires valid firebase token
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.uid;     
        const payslip = await Payslip.findOne({ userId: user_id }).sort({ createdAt: -1 }); 
        const takeHome = payslip?.takeHomePay || 0;                                                                                         //if no data, dfaults zero as fallback
        const budgetAllocation = (payslip?.categories || []).map(category => ({name: category.name, value: category.budget})); //converts to format that recharts requires
        const totalBudget = (payslip?.categories || []).reduce((sum, category) => sum + category.budget, 0);                    //adds all categories for total budget

        //originally implemented for expnses model so may not have actually been my respnsbility...
        const now = new Date(); //current date to filter expense objects
        const month = now.getMonth() + 1; //index values start at 0, so add 1 for logical reference. eg. January = 0, January = 1
        const year = now.getFullYear(); //self explanatory

        const categoryTotals = await Expense.aggregate([ //in orde to make pie charts use correct data, this needs to be combined...
            {$match: { //query...
                    user_id , //..id
                    month, //..month
                    year //..year ..as previously mentioned in comments
                }},
            {$group: {
                    _id: "$category",
                    total: { $sum: "$amount" }
                }}
        ]);//...these were defined preiously in the mongoose schema

        const actualSpending = categoryTotals.map(item => ({ //changes format so an be used with recharts
            name: item._id,
            value: item.total
        }));

        const totalExpenses = categoryTotals.reduce((sum, e) => sum + e.total, 0); //calculate total expenses to calculate haleht score

        let healthScore = 100;
        if (totalBudget > 0) { //prevents Zero division error
            const Score = (1 - totalExpenses / totalBudget) * 100; //percentage of income not spent
            healthScore = Math.round(Math.min(100, Math.max(0, Score))); //effectively clamp. between 100 and 0);
        }
        const budgetLeft = totalBudget - totalExpenses;

        //data returned to fonrt end in one JSON repnse - requested n MVP
        res.json({
            healthScore,
            takeHome,
            budgetLeft,
            totalBudget,
            actualSpending,
            budgetAllocation
        });

    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});

//export router to be used in app.js
module.exports = router;