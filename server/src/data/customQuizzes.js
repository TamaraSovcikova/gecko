// Plain data export - no functions, no logic
// This file contains all hardcoded custom quiz questions

const CUSTOM_QUIZ_MAP = {
  "payslip-gross-net": [
    {
      id: "payslip-1",
      question: "What is gross pay on a payslip?",
      type: "multiple",
      answers: [
        { text: "Pay before deductions", correct: true },
        { text: "Pay after tax", correct: false },
        { text: "The amount after pension", correct: false },
        { text: "Only the taxable income", correct: false },
      ],
    },
    {
      id: "payslip-2",
      question: "Which item is usually deducted from gross pay?",
      type: "multiple",
      answers: [
        { text: "Income tax", correct: true },
        { text: "Holiday pay", correct: false },
        { text: "Overtime bonus", correct: false },
        { text: "Salary sacrifice", correct: false },
      ],
    },
    {
      id: "payslip-3",
      question: "What is net pay?",
      type: "multiple",
      answers: [
        { text: "Take-home pay after deductions", correct: true },
        { text: "Total earnings before deductions", correct: false },
        { text: "Employer pension contribution", correct: false },
        { text: "Gross salary plus benefits", correct: false },
      ],
    },
    {
      id: "payslip-4",
      question: "Which section of the payslip shows your tax code?",
      type: "multiple",
      answers: [
        { text: "Personal details section", correct: false },
        { text: "Tax information section", correct: true },
        { text: "Net pay section", correct: false },
        { text: "Company contributions section", correct: false },
      ],
    },
    {
      id: "payslip-5",
      question: "Why is a payslip useful?",
      type: "multiple",
      answers: [
        { text: "Shows earnings and deductions", correct: true },
        { text: "Tracks only overtime hours", correct: false },
        { text: "Displays annual pension growth", correct: false },
        { text: "Calculates next year's salary", correct: false },
      ],
    },
  ],

  "payslip-income-tax": [
    {
      id: "tax-1",
      question: "What is the UK personal allowance for 2025/26?",
      type: "multiple",
      answers: [
        { text: "£12,570", correct: true },
        { text: "£10,000", correct: false },
        { text: "£20,000", correct: false },
        { text: "£15,240", correct: false },
      ],
    },
    {
      id: "tax-2",
      question: "Which band is the first £12,570 taxed at?",
      type: "multiple",
      answers: [
        { text: "0%", correct: true },
        { text: "20%", correct: false },
        { text: "40%", correct: false },
        { text: "45%", correct: false },
      ],
    },
    {
      id: "tax-3",
      question: "Above which income does the higher rate start?",
      type: "multiple",
      answers: [
        { text: "£50,270", correct: true },
        { text: "£45,000", correct: false },
        { text: "£33,333", correct: false },
        { text: "£60,000", correct: false },
      ],
    },
    {
      id: "tax-4",
      question: "What does a tax code tell your employer?",
      type: "multiple",
      answers: [
        { text: "How much tax-free income to allow", correct: true },
        { text: "Your NI contribution rate", correct: false },
        { text: "Your pension contribution", correct: false },
        { text: "Your student loan bracket", correct: false },
      ],
    },
    {
      id: "tax-5",
      question: "If you earn £30,000, what rate applies to most of the remaining income?",
      type: "multiple",
      answers: [
        { text: "20%", correct: true },
        { text: "40%", correct: false },
        { text: "0%", correct: false },
        { text: "45%", correct: false },
      ],
    },
  ],

  "payslip-national-insurance": [
    {
      id: "ni-1",
      question: "What rate applies to employee NI between £12,570 and £50,270?",
      type: "multiple",
      answers: [
        { text: "8%", correct: true },
        { text: "0%", correct: false },
        { text: "2%", correct: false },
        { text: "12%", correct: false },
      ],
    },
    {
      id: "ni-2",
      question: "What does NI contribute towards?",
      type: "multiple",
      answers: [
        { text: "State Pension and NHS funding", correct: true },
        { text: "Company bonuses", correct: false },
        { text: "Private savings", correct: false },
        { text: "Student loans", correct: false },
      ],
    },
    {
      id: "ni-3",
      question: "Which of these is NOT taken from employee NI?",
      type: "multiple",
      answers: [
        { text: "Employer NI contribution", correct: true },
        { text: "Personal NI contributions", correct: false },
        { text: "NI used for State Pension", correct: false },
        { text: "NI used for health funding", correct: false },
      ],
    },
    {
      id: "ni-4",
      question: "At what point does NI rate drop to 2%?",
      type: "multiple",
      answers: [
        { text: "Above £50,270", correct: true },
        { text: "Below £12,570", correct: false },
        { text: "Above £100,000", correct: false },
        { text: "Above £75,000", correct: false },
      ],
    },
    {
      id: "ni-5",
      question: "Why is NI separate from income tax?",
      type: "multiple",
      answers: [
        { text: "It funds benefits and pensions", correct: true },
        { text: "It is a type of savings account", correct: false },
        { text: "It goes into your salary", correct: false },
        { text: "It is charged only to employers", correct: false },
      ],
    },
  ],

  "payslip-pension": [
    {
      id: "pension-1",
      question: "What tax benefit does a basic-rate taxpayer get from pension contributions?",
      type: "multiple",
      answers: [
        { text: "The government tops up contributions by 25%", correct: true },
        { text: "They pay no NI on pension contributions", correct: false },
        { text: "They receive an extra employer payment", correct: false },
        { text: "Pension contributions are deducted after tax", correct: false },
      ],
    },
    {
      id: "pension-2",
      question: "What is auto-enrolment?",
      type: "multiple",
      answers: [
        { text: "An employer must sign eligible workers up to a pension scheme", correct: true },
        { text: "You choose your pension provider each year", correct: false },
        { text: "Only self-employed people can join", correct: false },
        { text: "It applies only to workplace savings accounts", correct: false },
      ],
    },
    {
      id: "pension-3",
      question: "What is the minimum employer pension contribution?",
      type: "multiple",
      answers: [
        { text: "3% of qualifying earnings", correct: true },
        { text: "5% of gross salary", correct: false },
        { text: "10% of total pay", correct: false },
        { text: "8% of net pay", correct: false },
      ],
    },
    {
      id: "pension-4",
      question: "Why might someone keep contributions in their pension?",
      type: "multiple",
      answers: [
        { text: "For long-term growth and tax relief", correct: true },
        { text: "To spend the money immediately", correct: false },
        { text: "So it is counted as salary", correct: false },
        { text: "To avoid paying NI", correct: false },
      ],
    },
    {
      id: "pension-5",
      question: "Which amount is often shown on a payslip pension line?",
      type: "multiple",
      answers: [
        { text: "Your contribution before tax relief", correct: true },
        { text: "Your net take-home pension pay", correct: false },
        { text: "The total pension pot value", correct: false },
        { text: "Your employer's full annual contribution", correct: false },
      ],
    },
  ],

  "budgeting-50-30-20": [
    {
      id: "rule-1",
      question: "What does the 50/30/20 rule allocate 20% to?",
      type: "multiple",
      answers: [
        { text: "Savings and debt repayment", correct: true },
        { text: "Needs", correct: false },
        { text: "Wants", correct: false },
        { text: "Taxes", correct: false },
      ],
    },
    {
      id: "rule-2",
      question: "Which category includes rent and utilities?",
      type: "multiple",
      answers: [
        { text: "Needs", correct: true },
        { text: "Wants", correct: false },
        { text: "Savings", correct: false },
        { text: "Investments", correct: false },
      ],
    },
    {
      id: "rule-3",
      question: "What is the main purpose of the rule?",
      type: "multiple",
      answers: [
        { text: "Help you split take-home pay intentionally", correct: true },
        { text: "Force all spending to 30%", correct: false },
        { text: "Maximize credit card use", correct: false },
        { text: "Avoid saving entirely", correct: false },
      ],
    },
    {
      id: "rule-4",
      question: "Which category is eating out generally placed in?",
      type: "multiple",
      answers: [
        { text: "Wants", correct: true },
        { text: "Needs", correct: false },
        { text: "Savings", correct: false },
        { text: "Bills", correct: false },
      ],
    },
    {
      id: "rule-5",
      question: "If rent is more than 50% of take-home pay, what should you do?",
      type: "multiple",
      answers: [
        { text: "Adjust the rule to your situation", correct: true },
        { text: "Never change your budget", correct: false },
        { text: "Spend more on wants", correct: false },
        { text: "Ignore your income", correct: false },
      ],
    },
  ],

  "budgeting-fixed-variable": [
    {
      id: "fv-1",
      question: "Which expense is usually fixed?",
      type: "multiple",
      answers: [
        { text: "Rent", correct: true },
        { text: "Groceries", correct: false },
        { text: "Takeaways", correct: false },
        { text: "Entertainment", correct: false },
      ],
    },
    {
      id: "fv-2",
      question: "Which expense is usually variable?",
      type: "multiple",
      answers: [
        { text: "Groceries", correct: true },
        { text: "Mortgage payment", correct: false },
        { text: "Phone contract", correct: false },
        { text: "Insurance premium", correct: false },
      ],
    },
    {
      id: "fv-3",
      question: "Why is it useful to separate fixed and variable costs?",
      type: "multiple",
      answers: [
        { text: "To identify where budgets can change", correct: true },
        { text: "To ignore all spending", correct: false },
        { text: "To increase fixed bills", correct: false },
        { text: "To spend more on wants", correct: false },
      ],
    },
    {
      id: "fv-4",
      question: "What is a good first step when budgeting?",
      type: "multiple",
      answers: [
        { text: "List fixed expenses first", correct: true },
        { text: "Delete all savings goals", correct: false },
        { text: "Buy a new car", correct: false },
        { text: "Ignore bills", correct: false },
      ],
    },
    {
      id: "fv-5",
      question: "Which kind of expense can often be reduced quickly?",
      type: "multiple",
      answers: [
        { text: "Variable expenses", correct: true },
        { text: "Fixed expenses", correct: false },
        { text: "Taxes", correct: false },
        { text: "Rent", correct: false },
      ],
    },
  ],

  "budgeting-emergency-fund": [
    {
      id: "ef-1",
      question: "What is the main purpose of an emergency fund?",
      type: "multiple",
      answers: [
        { text: "Cover unexpected costs", correct: true },
        { text: "Pay for holidays", correct: false },
        { text: "Fund luxury purchases", correct: false },
        { text: "Increase regular bills", correct: false },
      ],
    },
    {
      id: "ef-2",
      question: "Where should emergency savings usually be kept?",
      type: "multiple",
      answers: [
        { text: "Easy-access savings", correct: true },
        { text: "Invested in volatile stocks", correct: false },
        { text: "Hidden in a wallet", correct: false },
        { text: "In a retirement account", correct: false },
      ],
    },
    {
      id: "ef-3",
      question: "How much should you start with if full targets feel too large?",
      type: "multiple",
      answers: [
        { text: "A small buffer like £500", correct: true },
        { text: "Your whole salary", correct: false },
        { text: "No savings at all", correct: false },
        { text: "Only investments", correct: false },
      ],
    },
    {
      id: "ef-4",
      question: "Which of these counts as an emergency?",
      type: "multiple",
      answers: [
        { text: "A broken boiler", correct: true },
        { text: "A planned holiday", correct: false },
        { text: "A sale purchase", correct: false },
        { text: "A birthday gift", correct: false },
      ],
    },
    {
      id: "ef-5",
      question: "Why is an emergency fund helpful?",
      type: "multiple",
      answers: [
        { text: "It prevents debt when costs surprise you", correct: true },
        { text: "It pays for daily coffee", correct: false },
        { text: "It boosts your credit score instantly", correct: false },
        { text: "It avoids all taxes", correct: false },
      ],
    },
  ],

  "tax-codes": [
    {
      id: "tc-1",
      question: "What does 1257L mean on a tax code?",
      type: "multiple",
      answers: [
        { text: "£12,570 tax-free allowance", correct: true },
        { text: "A 12.57% tax rate", correct: false },
        { text: "A special pension code", correct: false },
        { text: "A student loan code", correct: false },
      ],
    },
    {
      id: "tc-2",
      question: "Which letter in a tax code shows Marriage Allowance?",
      type: "multiple",
      answers: [
        { text: "M or N", correct: true },
        { text: "L", correct: false },
        { text: "K", correct: false },
        { text: "BR", correct: false },
      ],
    },
    {
      id: "tc-3",
      question: "What does a 0T code usually indicate?",
      type: "multiple",
      answers: [
        { text: "No personal allowance set", correct: true },
        { text: "Tax-free income increased", correct: false },
        { text: "NI exempt status", correct: false },
        { text: "Self Assessment requirement", correct: false },
      ],
    },
    {
      id: "tc-4",
      question: "What could happen if your tax code is wrong?",
      type: "multiple",
      answers: [
        { text: "You could overpay or underpay tax", correct: true },
        { text: "Your employer pays more pension", correct: false },
        { text: "You get a higher salary", correct: false },
        { text: "Your mortgage rate changes", correct: false },
      ],
    },
    {
      id: "tc-5",
      question: "Who sends your tax code to your employer?",
      type: "multiple",
      answers: [
        { text: "HMRC", correct: true },
        { text: "Your bank", correct: false },
        { text: "Your pension provider", correct: false },
        { text: "Your mortgage lender", correct: false },
      ],
    },
  ],

  "tax-self-assessment": [
    {
      id: "sa-1",
      question: "Who usually needs to file Self Assessment?",
      type: "multiple",
      answers: [
        { text: "Freelancers and other untaxed income earners", correct: true },
        { text: "Most PAYE employees only", correct: false },
        { text: "Only pensioners", correct: false },
        { text: "Only company directors", correct: false },
      ],
    },
    {
      id: "sa-2",
      question: "When is a UK Self Assessment return due online?",
      type: "multiple",
      answers: [
        { text: "31 January", correct: true },
        { text: "5 April", correct: false },
        { text: "30 June", correct: false },
        { text: "31 December", correct: false },
      ],
    },
    {
      id: "sa-3",
      question: "What income threshold triggers the need to file if self-employed?",
      type: "multiple",
      answers: [
        { text: "More than £1,000", correct: true },
        { text: "More than £10,000", correct: false },
        { text: "More than £100,000", correct: false },
        { text: "Any amount", correct: false },
      ],
    },
    {
      id: "sa-4",
      question: "Which tax year deadline is for the second payment on account?",
      type: "multiple",
      answers: [
        { text: "31 July", correct: true },
        { text: "31 January", correct: false },
        { text: "5 April", correct: false },
        { text: "30 September", correct: false },
      ],
    },
    {
      id: "sa-5",
      question: "What is an example of untaxed income?",
      type: "multiple",
      answers: [
        { text: "Rental income", correct: true },
        { text: "Salary paid through PAYE", correct: false },
        { text: "Tax-free charity donations", correct: false },
        { text: "Child Benefit", correct: false },
      ],
    },
  ],

  "saving-isas": [
    {
      id: "isa-1",
      question: "What is the annual ISA allowance for 2025/26?",
      type: "multiple",
      answers: [
        { text: "£20,000", correct: true },
        { text: "£10,000", correct: false },
        { text: "£30,000", correct: false },
        { text: "£5,000", correct: false },
      ],
    },
    {
      id: "isa-2",
      question: "Which ISA type offers a government bonus for first-time home buyers?",
      type: "multiple",
      answers: [
        { text: "Lifetime ISA", correct: true },
        { text: "Cash ISA", correct: false },
        { text: "Stocks and Shares ISA", correct: false },
        { text: "Junior ISA", correct: false },
      ],
    },
    {
      id: "isa-3",
      question: "What is a key benefit of ISA interest?",
      type: "multiple",
      answers: [
        { text: "It is tax-free", correct: true },
        { text: "It is guaranteed higher than inflation", correct: false },
        { text: "It counts as taxable income", correct: false },
        { text: "It is only for pension savings", correct: false },
      ],
    },
    {
      id: "isa-4",
      question: "How much can you save in a Lifetime ISA each year?",
      type: "multiple",
      answers: [
        { text: "£4,000", correct: true },
        { text: "£20,000", correct: false },
        { text: "£10,000", correct: false },
        { text: "£1,000", correct: false },
      ],
    },
    {
      id: "isa-5",
      question: "What happens if you withdraw from a Lifetime ISA for the wrong reason?",
      type: "multiple",
      answers: [
        { text: "You pay a 25% penalty", correct: true },
        { text: "You receive a bonus", correct: false },
        { text: "The money stays tax-free", correct: false },
        { text: "The government tops it up", correct: false },
      ],
    },
  ],

  "saving-goals": [
    {
      id: "goals-1",
      question: "What is short-term saving best used for?",
      type: "multiple",
      answers: [
        { text: "Goals within two years", correct: true },
        { text: "Retirement in 30 years", correct: false },
        { text: "Daily coffee", correct: false },
        { text: "Long-term growth only", correct: false },
      ],
    },
    {
      id: "goals-2",
      question: "Where should long-term savings usually be held?",
      type: "multiple",
      answers: [
        { text: "Investments or pensions", correct: true },
        { text: "Under the mattress", correct: false },
        { text: "A current account", correct: false },
        { text: "A business account", correct: false },
      ],
    },
    {
      id: "goals-3",
      question: "What is a key difference between short- and long-term savings?",
      type: "multiple",
      answers: [
        { text: "How soon you will need the money", correct: true },
        { text: "Only the account type used", correct: false },
        { text: "The amount of tax paid", correct: false },
        { text: "Whether it is insured", correct: false },
      ],
    },
    {
      id: "goals-4",
      question: "Which outcome is a good sign for a saving goal?",
      type: "multiple",
      answers: [
        { text: "You have a plan and timeline", correct: true },
        { text: "You spend all the money now", correct: false },
        { text: "You ignore the goal", correct: false },
        { text: "You borrow more funds", correct: false },
      ],
    },
    {
      id: "goals-5",
      question: "What should you do before deciding where to save?",
      type: "multiple",
      answers: [
        { text: "Match the savings vehicle to the timeframe", correct: true },
        { text: "Pick the highest interest rate always", correct: false },
        { text: "Use only cash accounts", correct: false },
        { text: "Ignore risk entirely", correct: false },
      ],
    },
  ],
};

const DEFAULT_CUSTOM_TOPIC = "payslip-gross-net";

// Precomputed list of custom topic keys for efficient random selection
const CUSTOM_TOPICS_LIST = Object.keys(CUSTOM_QUIZ_MAP);

module.exports = {
  CUSTOM_QUIZ_MAP,
  DEFAULT_CUSTOM_TOPIC,
  CUSTOM_TOPICS_LIST,
};
