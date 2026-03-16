// routes/dashboard.js - provide data for frontend
//aim to collect all 'expenses' and return data

const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense"); //import Expense model
const authMiddleware = require("../middleware/auth"); //import middleware - this verifies token before (!!) the route runs - if not authenticated, can't use


// GET api/v1/dashboard
//this is protect - reuires valid firebase token
//authMiddleware should be here I have removed it for front end testing purposes...
router.get('/', async (req, res) => {
    try {
        const user_id = "test-user";
        //const user_id = req.user.uid; //auth middleware attaches uid to request object
        const now = new Date(); //current date to filter expense objects
        const month = now.getMonth() + 1; //index values start at 0, so have to add 1. eg. January = 0, January = 1
        const year = now.getFullYear(); //self explanatory
        const expenses = await Expense.find({ // queries user's expenes which match...
            user_id, //...id
            month,  //...month
            year    //...year
        }); //...these were defined preiously in the mongoose schema

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0); //calculate total expenses to calculate haleht score

        let healthScore = 100; //without any payslip data to go off. healthScore is 100 by default - mentioned in MVP tasks
        let takeHome = 0; //..test values here if still no payslip..
        let budgetLeft = takeHome - totalExpenses;

        if (takeHome > 0) { //prevents Zero division error
            const Score = (1 - totalExpenses / takeHome) * 100; //percentage of income not spent
            healthScore = Math.round(
                Math.min(100, Math.max(0, Score)) //effectively clamp. between 100 and 0
            );
        }

        //data returned to fonrt end in one JSON repnse - requested n MVP
        res.json({
            healthScore,
            takeHome,
            budgetLeft,
            expenses
        });

    } catch(error) {
        //if there is an error, returns generic error message.
        res.status(500).json({ error: error.message });
    }
});

//export router to be used in app.js
module.exports = router;
//this is basic, I am learning stuff as I go