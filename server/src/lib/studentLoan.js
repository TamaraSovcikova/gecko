// UK student loan repayment calculator - 2024/25 HMRC thresholds
// Mirror of client/src/lib/studentLoan.ts (shared logic, CJS for server)

const LOAN_PLANS = {
  plan1: {
    label: "Plan 1",
    description: "Started uni before 2012 (England, Wales, NI)",
    threshold: 24990,
    rate: 0.09,
    writeOffYears: 25,
    interestNote: "RPI or 1%, whichever is lower",
    defaultInterestRate: 0.01,
  },
  plan2: {
    label: "Plan 2",
    description: "Started uni 2012-2023 (England and Wales)",
    threshold: 27295,
    rate: 0.09,
    writeOffYears: 30,
    interestNote: "RPI + up to 3% (income-dependent, capped at 7.3%)",
    defaultInterestRate: 0.073,
  },
  plan4: {
    label: "Plan 4",
    description: "Scotland",
    threshold: 31395,
    rate: 0.09,
    writeOffYears: 30,
    interestNote: "RPI or 1%, whichever is lower",
    defaultInterestRate: 0.01,
  },
  plan5: {
    label: "Plan 5",
    description: "Started uni from 2023 (England and Wales)",
    threshold: 25000,
    rate: 0.09,
    writeOffYears: 40,
    interestNote: "RPI only (capped at 7.3%)",
    defaultInterestRate: 0.04,
  },
  postgrad: {
    label: "Postgraduate Loan",
    description: "Masters or PhD loan",
    threshold: 21000,
    rate: 0.06,
    writeOffYears: 30,
    interestNote: "RPI + 3%",
    defaultInterestRate: 0.073,
  },
};

function monthlyRepayment(grossAnnual, plan) {
  if (plan === "none") return 0;
  const p = LOAN_PLANS[plan];
  if (!p || grossAnnual <= p.threshold) return 0;
  return ((grossAnnual - p.threshold) / 12) * p.rate;
}

function projectLoan(grossAnnual, plan, balance) {
  const monthly = monthlyRepayment(grossAnnual, plan);
  const annual = monthly * 12;

  if (plan === "none" || !balance || balance <= 0) {
    return {
      monthlyRepayment: monthly,
      annualRepayment: annual,
      yearsToPayOff: null,
      totalRepaid: 0,
      willWriteOff: false,
      writeOffBalance: null,
    };
  }

  const p = LOAN_PLANS[plan];
  const rate = p.defaultInterestRate;
  let remaining = balance;
  let totalPaid = 0;
  let years = 0;

  while (remaining > 0 && years < p.writeOffYears) {
    remaining = remaining * (1 + rate) - annual;
    if (remaining < 0) {
      totalPaid += annual + remaining;
      remaining = 0;
    } else {
      totalPaid += annual;
    }
    years++;
  }

  const willWriteOff = remaining > 0;
  return {
    monthlyRepayment: monthly,
    annualRepayment: annual,
    yearsToPayOff: willWriteOff ? null : years,
    totalRepaid: Math.round(totalPaid),
    willWriteOff,
    writeOffBalance: willWriteOff ? Math.round(remaining) : null,
  };
}

module.exports = { LOAN_PLANS, monthlyRepayment, projectLoan };
