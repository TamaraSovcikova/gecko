// client/src/constants/learningContent.ts
// Structured content for the Financial Education Resource Hub.
// To add or update content, edit this file only

export interface LearningTopic {
  id: string;
  category: string;
  title: string;
  summary: string;
  detail: string;
  //TODO REPLACE ONCE STRUCUTRE CONFIRMED
  linkedQuizId: string | null; // maps to QuizApi category ID
  linkedQuizLabel: string | null;
  icon: string; // Bootstrap icon class
}

export const LEARNING_CONTENT: LearningTopic[] = [
  // ------- UNDERSTANDING YOUR PAYSLIP ---------------------------------
  {
    id: "payslip-gross-net",
    category: "Understanding Your Payslip",
    title: "Gross vs Net Pay",
    summary:
      "Your gross pay is what your employer agrees to pay you before any deductions. Your net pay - or take-home pay - is what actually lands in your bank account after tax, National Insurance, and any pension contributions are taken out.",
    detail:
      "When you see a salary advertised as £30,000 a year, that is your gross salary. But you will never see the full £30,000 - the government takes a portion through income tax and National Insurance before it reaches you.\n\nFor a £30,000 salary in 2024/25, you would typically take home around £24,000 after tax and NI, which is roughly £2,000 a month \n\nYour payslip should show each deduction separately so you can see exactly where the money goes. If anything looks wrong - like an unusually high tax deduction - it is worth checking your tax code with HMRC.",
    linkedQuizId: "11", // TODO swap for correct QuizApi ID when confirmed
    linkedQuizLabel: "Test your payslip knowledge",
    icon: "bi-receipt",
  },
  {
    id: "payslip-income-tax",
    category: "Understanding Your Payslip",
    title: "Income Tax",
    summary:
      "Income tax is charged on your earnings above the personal allowance - the amount you can earn tax-free each year. For 2024/25 that is £12,570. Everything above that is taxed in bands, so not all of your income is taxed at the same rate.",
    detail:
      "The UK uses a progressive tax system, which means you only pay each rate on the portion of income that falls within that band - not on your whole salary.\n\n2024/25 tax bands:\n• Personal allowance: £0–£12,570 - 0% (tax free)\n• Basic rate: £12,571–£50,270 - 20%\n• Higher rate: £50,271–£125,140 - 40%\n• Additional rate: over £125,140 - 45%\n\nSo if you earn £30,000, you pay 0% on the first £12,570 and 20% on the remaining £17,430 - a total tax bill of around £3,486, not 20% of £30,000.\n\nYour tax code (usually something like 1257L) tells your employer how much personal allowance to give you. If your code looks wrong, check it at gov.uk/check-income-tax.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your tax knowledge",
    icon: "bi-percent",
  },
  {
    id: "payslip-national-insurance",
    category: "Understanding Your Payslip",
    title: "National Insurance",
    summary:
      "National Insurance (NI) is a separate deduction from income tax. It funds state benefits including the NHS, state pension, and certain welfare payments. You pay it on earnings above a threshold, and the rate is different from income tax.",
    detail:
      "For 2024/25, employees pay National Insurance at 8% on earnings between £12,570 and £50,270, and 2% on earnings above £50,270.\n\nUnlike income tax, NI contributions build up your entitlement to the state pension and certain benefits. You need 35 qualifying years of contributions to receive the full new state pension.\n\nNI shows up as a separate line on your payslip, usually labelled NI or Employee NIC. Your employer also pays a separate NI contribution on your behalf - this does not come out of your pay but it is part of the cost of employing you.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your NI knowledge",
    icon: "bi-shield-check",
  },
  {
    id: "payslip-pension",
    category: "Understanding Your Payslip",
    title: "Pension Contributions",
    summary:
      "If your employer has auto-enrolled you into a workplace pension, a percentage of your salary is automatically saved into a pension pot each month. This comes out before tax in many cases, which means it reduces your taxable income - making it more efficient than saving from your take-home pay.",
    detail:
      "Auto-enrolment applies to most employees aged 22 or over earning at least £10,000 a year. The minimum contribution is 8% of your qualifying earnings - at least 3% from your employer and at least 5% from you.\n\nBecause pension contributions are usually taken from your gross pay (before tax), a 5% contribution costs you less than 5% of your take-home. For a basic rate taxpayer, every £80 you put in is topped up to £100 by the government through tax relief.\n\nYou can opt out of a workplace pension, but it is generally not advisable - you would lose your employer's contribution, which is effectively part of your salary.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your pension knowledge",
    icon: "bi-piggy-bank",
  },

  // ------- BUDGETING BASICS ---------------------------------
  {
    id: "budgeting-50-30-20",
    category: "Budgeting Basics",
    title: "The 50/30/20 Rule",
    summary:
      "The 50/30/20 rule is a simple budgeting framework: spend 50% of your take-home pay on needs, 30% on wants, and save 20%. It is not a strict rule but a useful starting point for building a budget that works without obsessing over every penny.",
    detail:
      "Needs are things you cannot reasonably live without - rent, bills, groceries, transport to work. Wants are things you choose to spend on - eating out, subscriptions, clothing beyond the basics. Savings include an emergency fund, pension top-ups, and any other financial goals.\n\nFor someone taking home £2,000 a month:\n• Needs: up to £1,000\n• Wants: up to £600\n• Savings: at least £400\n\nThe rule is a guide, not a target. If you live in London, 50% for needs might not be realistic. The important thing is to be intentional - know where your money is going rather than wondering where it went.\n\nFinFirst's budget categories let you map your spending to this framework and see at a glance whether you are on track,",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your budgeting knowledge",
    icon: "bi-pie-chart",
  },
  {
    id: "budgeting-fixed-variable",
    category: "Budgeting Basics",
    title: "Fixed vs Variable Expenses",
    summary:
      "Fixed expenses are the same every month - rent, a phone contract, a gym membership. Variable expenses change - food, going out, transport. Knowing the difference helps you understand which parts of your budget you can actually control.",
    detail:
      "Fixed expenses are predictable and usually contractual. You cannot easily reduce them in the short term, so they form the floor of your budget - the minimum you will spend no matter what.\n\nVariable expenses are where most budgeting decisions happen. Groceries, eating out, entertainment, and clothing all vary month to month and are within your control. This is where small changes add up quickly.\n\nA useful exercise: list all your fixed expenses first. Whatever is left after fixed expenses and savings is what you have available for variable spending. This is clearer than trying to cut everything at once.\n\nSome expenses are semi-fixed - subscriptions you could cancel but have not, or a phone bill you could switch to a cheaper plan. These are worth reviewing once a year.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your budgeting knowledge",
    icon: "bi-arrow-left-right",
  },
  {
    id: "budgeting-emergency-fund",
    category: "Budgeting Basics",
    title: "Emergency Funds",
    summary:
      "An emergency fund is money set aside specifically for unexpected expenses - a broken laptop, a medical bill, losing your job. Having one means you do not have to go into debt when something goes wrong. The standard advice is three to six months of essential expenses.",
    detail:
      "For someone just starting out, three to six months of essential expenses sounds like a lot. A more achievable starting target is one month's worth of essential expenses - enough to cover rent and bills if your income stops for a month.\n\nThe key is that this money is separate from your normal savings and is not touched for anything that is not genuinely unexpected. Having it in an easy-access savings account means it is available quickly but not too easy to dip into for non-emergencies.\n\nBuilding an emergency fund before paying off student debt or investing is generally recommended - the peace of mind and financial security it provides affects every other financial decision you make.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your savings knowledge",
    icon: "bi-umbrella",
  },

  // -------- TAX FUNDAMENTALS ---------------------------------
  {
    id: "tax-codes",
    category: "Tax Fundamentals",
    title: "Understanding Tax Codes",
    summary:
      "Your tax code tells your employer how much of your income is tax-free. The most common code is 1257L, which gives you the standard £12,570 personal allowance. If your code is different, it might mean HMRC thinks you owe tax from a previous year or have a benefit that affects your allowance.",
    detail:
      "Tax codes are made up of numbers and letters. The number tells your employer how much tax-free income to give you - multiply by 10 to get the allowance. The letter gives additional information:\n\n• L — you are entitled to the standard personal allowance\n• M or N — you are receiving or transferring part of the Marriage Allowance\n• T — your tax code includes other calculations\n• BR — all income from this source is taxed at basic rate (20%)\n• 0T — no personal allowance, often seen with a new job where HMRC has not yet confirmed your code\n• K — you have income that is not being taxed another way and needs to be recovered\n\nIf you think your tax code is wrong, you can check and update it at gov.uk/check-income-tax. Getting it wrong can mean paying too much or too little tax - and underpayments can be collected the following year.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your tax knowledge",
    icon: "bi-card-text",
  },
  {
    id: "tax-self-assessment",
    category: "Tax Fundamentals",
    title: "Self Assessment Basics",
    summary:
      "Most employees have tax collected automatically through PAYE and never need to fill in a tax return. But if you earn income from other sources - freelancing, renting a room, selling things regularly - you may need to register for Self Assessment with HMRC.",
    detail:
      "You need to complete a Self Assessment tax return if in the last tax year you:\n• Were self-employed and earned more than £1,000\n• Earned more than £100,000 total\n• Received untaxed income over £2,500 (e.g. from renting a property)\n• Had income from abroad\n• Received Child Benefit and you or your partner earned over £60,000\n\nThe tax year runs from 6 April to 5 April the following year. The deadline to file online and pay any tax owed is 31 January following the end of the tax year.\n\nIf you are unsure whether you need to file, HMRC has a tool at gov.uk/check-if-you-need-a-tax-return. Missing the deadline results in an automatic £100 fine even if you do not owe any tax.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your tax knowledge",
    icon: "bi-file-text",
  },

  // -------- SAVING AND FINANCIAL GOALS ---------------------------------
  {
    id: "saving-isas",
    category: "Saving and Financial Goals",
    title: "ISAs — Tax-Free Savings",
    summary:
      "An ISA (Individual Savings Account) lets you save or invest up to £20,000 per tax year without paying tax on the interest or returns. For anyone starting to save, a Cash ISA is the simplest option - it works like a regular savings account but the interest is always tax-free.",
    detail:
      "There are several types of ISA:\n\n• Cash ISA - like a savings account, interest is tax-free. Good for short-term savings and emergency funds.\n• Stocks and Shares ISA - you invest in the stock market. Higher potential returns than cash but the value can go down as well as up. Better for money you will not need for at least five years.\n• Lifetime ISA (LISA) - save up to £4,000 per year and the government adds a 25% bonus. Can only be used to buy your first home or for retirement. Must open before age 40.\n• Junior ISA - for children under 18, managed by a parent or guardian.\n\nYou can have multiple ISAs but your total contributions across all types cannot exceed £20,000 in a single tax year. The £20,000 allowance resets each April.\n\nFor most people starting out, opening a Cash ISA or a Lifetime ISA (if buying a home is a goal) is a sensible first step.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your savings knowledge",
    icon: "bi-bank",
  },
  {
    id: "saving-goals",
    category: "Saving and Financial Goals",
    title: "Short vs Long-Term Saving",
    summary:
      "Not all saving is the same. Money you might need within a year or two should be kept somewhere safe and accessible. Money you will not need for a decade or more can be invested in things that carry more risk but offer higher potential returns over time.",
    detail:
      "Short-term savings (0-3 years): Keep this in an easy-access savings account or Cash ISA. You want it to be safe and available when you need it. Interest rates matter here - shop around for the best rate.\n\nMedium-term savings (3–10 years): You have more flexibility. Fixed-rate savings accounts or a Stocks and Shares ISA with a conservative investment strategy can be appropriate depending on your risk tolerance.\n\nLong-term savings (10+ years): Time is your biggest advantage. Investing in a diversified fund over a long period smooths out short-term market volatility and historically produces returns that outpace cash savings significantly. Workplace pensions and SIPPs (Self-Invested Personal Pensions) are the most tax-efficient options.\n\nA simple rule: the longer your time horizon, the more risk you can afford to take - because you have time to recover from short-term losses.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your savings knowledge",
    icon: "bi-graph-up-arrow",
  },
];

// Group topics by category for the page layout
export const LEARNING_CATEGORIES = [
  "Understanding Your Payslip",
  "Budgeting Basics",
  "Tax Fundamentals",
  "Saving and Financial Goals",
] as const;

export type LearningCategory = (typeof LEARNING_CATEGORIES)[number];
