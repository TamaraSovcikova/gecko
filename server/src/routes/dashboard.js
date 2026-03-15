const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const authMiddleware = require("../middleware/auth");

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;  //I do not actually know how to log in to this little web app. I am unsure if there are any testing crednetials
                                      //as such, in order to test this, I'm just checking if it doesn't work and it seems right
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const expenses = await Expense.find({
            userId,
            month,
            year
        });

        /*
        Do not have paylsip backend yet (14.53)? so have no information to calculate backend. Also, how do we want the health score to be calculated
        */
        let healthScore = 100; //without any payslip data to go off. healthScore is 100 by default - mentioned in MVP tasks

        res.json({
            healthScore,
            takeHome,
            budgetLeft,
            expenses
        });

    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

//as far as I can go for time being - no payslipn data.
//this is basic, I am learning stuff as I go