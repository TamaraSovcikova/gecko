// This function is needed to perform the calculation 
// To convert the gross salary into: 
// - The tax needed to be paid, 
// - NI needed to be paid, 
// - The final take home salary. 

function calculatePayslip(grossSalary) {

    // For the 2025/26 tax year, personal allowance is £12,570

    const personalAllowance = 12570;
    taxableIncome = grossSalary - personalAllowance;

    if (taxableIncome < 0) {
        taxableIncome = 0;
    }

    // Income tax needed to be paid for the basic rate
    const taxPaid = taxableIncome * 0.20;

    // NI neede to be paid
    const niThreshold = 12570;

    if (grossSalary > niThreshold) {
        niPaid = (grossSalary - niThreshold) * 0.08;
    }

    // The final take home pay
    const takeHomePay = grossSalary - taxPaid - niPaid;

    return {
        taxPaid,
        niPaid,
        takeHomePay
    };
}

module.exports = calculatePayslip;