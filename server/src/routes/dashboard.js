// routes/dashboard.js - provide data for frontend
//aim to collect all 'expenses' and return data

const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense"); //import Expense model
const Payslip = require("../models/MonthlyBudget"); //import MonthlyBudget (this if fro payslip)
const User = require("../models/User"); //import User model to get job title and location
const authMiddleware = require("../middleware/auth"); //import middleware - this verifies token before (!!) the route runs - if not authenticated, can't use
const { getAverageSalary } = require("../services/adzunaCalculator"); //import Adzuna service
const { computeHealthScoreBreakdown } = require("../services/healthScoreService");

// Helper function to generate tips based on budget and health data
const generateBudgetTips = (totalBudget, healthScore, budgetAllocation, totalExpenses) => {
  const tips = [];

  // Tips based on health score
  if (healthScore < 40) {
    tips.push({
      type: "spending-high",
      title: "High spending detected",
      description: `Your health score is ${healthScore}%. Review your spending patterns and identify areas to cut back.`,
      priority: "high",
    });
  } else if (healthScore >= 80) {
    tips.push({
      type: "spending-good",
      title: "Excellent spending patterns",
      description: `Your health score is ${healthScore}%. You're managing your budget well!`,
      priority: "low",
    });
  }

  // Tips based on budget allocation
  if (budgetAllocation && budgetAllocation.length > 0 && totalBudget > 0) {
    // Find if any category is getting overspent
    const overallocatedCategory = budgetAllocation.find((cat) => {
      const monthlySpend = (totalExpenses * (cat.value / totalBudget)) || 0;
      return monthlySpend > cat.value * 1.2; // 20% over allocated
    });

    if (overallocatedCategory) {
      tips.push({
        type: "category-overspend",
        title: `Overspending in ${overallocatedCategory.name}`,
        description: `Your ${overallocatedCategory.name} category is exceeding its allocated budget. Consider adjusting your spending or allocation.`,
        priority: "high",
      });
    }
  }

  // Tip for well-balanced categories
  if (budgetAllocation && budgetAllocation.length > 2) {
    tips.push({
      type: "balanced-budget",
      title: "Well-diversified budget",
      description: `You have ${budgetAllocation.length} budget categories. Good financial planning!`,
      priority: "low",
    });
  }

  return tips;
};

// Helper function to generate tips based on salary and budget data
const generateAdzunaTips = (grossSalary, averageSalary, totalBudget, healthScore) => {
  const tips = [];

  if (!averageSalary || !grossSalary) {
    return tips;
  }

  const salaryDifference = grossSalary - averageSalary;
  const salaryPercentage = (salaryDifference / averageSalary) * 100;

  // Tips based on salary comparison
  if (salaryPercentage < -15) {
    tips.push({
      type: "salary-low",
      title: "Consider salary negotiation",
      description: `Your salary is ${Math.abs(salaryPercentage).toFixed(1)}% below market average for your role. Consider discussing a raise with your employer.`,
      priority: "high",
    });
  } else if (salaryPercentage > 15) {
    tips.push({
      type: "salary-high",
      title: "Strong salary position",
      description: `You're earning ${salaryPercentage.toFixed(1)}% above the market average. Great work!`,
      priority: "low",
    });
  }

  // Tips based on budget allocation vs salary
  const monthlyTakeHome = grossSalary / 12;
  if (totalBudget > 0) {
    const budgetRatio = (totalBudget / monthlyTakeHome) * 100;

    if (budgetRatio > 100) {
      tips.push({
        type: "over-budget",
        title: "Budget exceeds take-home pay",
        description: `Your allocated budget (${budgetRatio.toFixed(0)}%) exceeds your monthly take-home pay. Consider adjusting your allocations.`,
        priority: "high",
      });
    } else if (budgetRatio < 50 && healthScore > 80) {
      tips.push({
        type: "under-budget",
        title: "Opportunity to save more",
        description: `You're only allocating ${budgetRatio.toFixed(0)}% of your take-home pay. Consider increasing savings or investments.`,
        priority: "medium",
      });
    }
  }

  return tips;
};

// GET api/v1/dashboard
//this should be protected - reuires valid firebase token
//remove authmiddleware
router.get('/', async (req, res) => {
    try {
        //originally implemented for expnses model so may not have actually been my respnsbility...
        const now = new Date(); //current date to filter expense objects
        const month = now.getMonth() + 1; //index values start at 0, so add 1 for logical reference. eg. January = 0, January = 1
        const year = now.getFullYear(); //self explanatory

        const user_id = req.user.uid;     
        const payslip = await Payslip.findOne({ userId: user_id }).sort({ createdAt: -1 }); 
        const takeHome = payslip?.takeHomePay || 0;                                                                                         //if no data, dfaults zero as fallback
        const budgetAllocation = (payslip?.categories || []).map(category => ({name: category.name, value: category.budget})); //converts to format that recharts requires
        const totalBudget = (payslip?.categories || []).reduce((sum, category) => sum + category.budget, 0);                    //adds all categories for total budget
        // expenses individually
        const expenses = await Expense.find({ userId: user_id, month, year })
          .sort({ date: -1, createdAt: -1 });

        const categoryTotals = await Expense.aggregate([ //in orde to make pie charts use correct data, this needs to be combined...
            {$match: { //query...
                    userId: user_id , //..id
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

        const currentUser = await User.findById(user_id);
        const healthBreakdown = computeHealthScoreBreakdown({
          takeHome,
          totalBudget,
          totalExpenses,
          budgetAllocation,
          actualSpending,
        });
        const healthScore = healthBreakdown.healthScore;
        const budgetLeft = totalBudget - totalExpenses;

        //Generate budget-based tips (always)
        let adzunaTips = generateBudgetTips(totalBudget, healthScore, budgetAllocation, totalExpenses);

        //Fetch Adzuna salary comparison and add those tips too
        let averageSalary = null;
        let grossSalary = payslip?.grossSalary || 0;
        
        try {
          const user = currentUser;
          console.log(`Dashboard: User found - jobTitle: ${user?.payslipData?.jobTitle}, location: ${user?.payslipData?.location}`);
          
          if (user?.payslipData?.jobTitle && user?.payslipData?.location) {
            console.log(`Dashboard: Fetching Adzuna data for ${user.payslipData.jobTitle} in ${user.payslipData.location}`);
            averageSalary = await getAverageSalary(
              user.payslipData.jobTitle,
              user.payslipData.location
            );
            console.log(`Dashboard: Adzuna returned average salary: £${averageSalary}`);
            
            // Add Adzuna tips to the existing budget tips
            if (averageSalary) {
              const adzunaSalaryTips = generateAdzunaTips(grossSalary, averageSalary, totalBudget, healthScore);
              adzunaTips = [...adzunaTips, ...adzunaSalaryTips];
            }
          } else {
            console.log(`Dashboard: No jobTitle or location set for user`);
          }
        } catch (err) {
          console.error("Dashboard: Error fetching Adzuna data:", err);
          // Continue without Adzuna data
        }

        //data returned to fonrt end in one JSON repnse - requested n MVP
        res.json({
            healthScore,
            takeHome,
            budgetLeft,
            totalBudget,
            actualSpending,
            budgetAllocation,
            healthBreakdown,
            averageSalary,
            adzunaTips,
            expenses
        });

    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});

//export router to be used in app.js
module.exports = router;