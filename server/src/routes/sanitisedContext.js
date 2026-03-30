//adds method to 'sanitise context'

async function retrieveSanitisedContext(dashboardData) {
    const {takeHome, totalBudget, actualSpending, budgetLeft, healthScore} = dashboardData;
    const monthlySpending = actualSpending.reduce((sum, c) => sum + c.value, 0); //under assumption that actual spending is mroe than zero
    let topSpendingCategory = "None";
    if (actualSpending.length > 0) {
        topSpendingCategory = actualSpending.reduce((max, curr) => curr.value > max.value ? curr : max).name;
    }

    return {
        monthlyIncome: takeHome,
        monthlyBudget: totalBudget,
        monthlySpending,
        budgetLeft,
        savings: budgetLeft,
        healthScore,
        topSpendingCategory,
        currency: "GBP"
    };
}

module.exports = { retrieveSanitisedContext };