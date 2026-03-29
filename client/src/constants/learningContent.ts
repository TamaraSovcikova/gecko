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
      "Your gross pay is the salary in your contract. Your net pay is what actually hits your bank account after tax, National Insurance, and pension contributions are removed.",
    detail:
      "When a job advertises a £30,000 salary, that is your gross figure. You will never receive the full amount because the government collects income tax and National Insurance through PAYE (Pay As You Earn) before your employer pays you.\n\nFor a £30,000 salary in 2025/26 you would typically take home around £24,100 after tax and NI - about £2,008 a month. The gap between gross and net surprises most people when they first see a payslip.\n\nYour payslip must show each deduction as a separate line. If the numbers look off — especially if your tax deduction seems high — it is usually worth checking your tax code. You can do this instantly through your Personal Tax Account at gov.uk.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your payslip knowledge",
    icon: "bi-receipt",
  },

  {
    id: "payslip-income-tax",
    category: "Understanding Your Payslip",
    title: "Income Tax",
    summary:
      "Income tax is only charged on earnings above your personal allowance - £12,570 for 2025/26. Above that, tax is applied in bands, so not all of your income is taxed at the same rate.",
    detail:
      "The UK uses a progressive system. As you earn more, each additional pound is taxed at a higher rate - but only the part that falls into that band, not your whole salary.\n\n2025/26 income tax bands (England, Wales and Northern Ireland):\n• Personal allowance: £0 - £12,570 — 0% (tax-free)\n• Basic rate: £12,571 - £50,270 — 20%\n• Higher rate: £50,271 - £125,140 — 40%\n• Additional rate: above £125,140 — 45%\n\nIf you earn £30,000: you pay 0% on the first £12,570, then 20% on the remaining £17,430. That is a tax bill of £3,486 for the year — not 20% of your whole salary.\n\nNote: if you earn over £100,000, your personal allowance starts shrinking. For every £2 you earn above £100,000 you lose £1 of allowance. At £125,140 the allowance disappears entirely, creating an effective 60% marginal rate in that range.\n\nThresholds are frozen until April 2028. As wages rise with inflation, more people gradually move into higher bands — this is called fiscal drag.\n\nScotland has different rates and bands - check gov.uk/scottish-income-tax if that applies to you.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your tax knowledge",
    icon: "bi-percent",
  },

  {
    id: "payslip-national-insurance",
    category: "Understanding Your Payslip",
    title: "National Insurance",
    summary:
      "National Insurance (NI) is a separate deduction that funds the NHS, state pension, and certain benefits. For 2025/26 you pay 8% on earnings between £12,570 and £50,270.",
    detail:
      "National Insurance and income tax are both collected through PAYE, but they are entirely separate with different rates and purposes.\n\n2025/26 employee NI rates:\n• Below £12,570/year — 0%\n• £12,570 - £50,270/year — 8%\n• Above £50,270/year — 2%\n\nOn a £30,000 salary you pay NI on £17,430 (everything above £12,570) at 8%, coming to around £1,394 a year — about £116 a month.\n\nNI contributions build your entitlement to state benefits. You need 35 qualifying years to receive the full new State Pension, which is £221.20 a week for 2025/26. Check your NI record and pension forecast at gov.uk/check-state-pension.\n\nYour employer also pays their own NI separately — 15% on earnings above £96/week for 2025/26. This does not come out of your pay, but it is part of the cost of employing you.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your NI knowledge",
    icon: "bi-shield-check",
  },

  {
    id: "payslip-pension",
    category: "Understanding Your Payslip",
    title: "Pension Contributions",
    summary:
      "If you are auto-enrolled in a workplace pension, a percentage of your salary is automatically saved each month. Because contributions are taken before tax, a £100 pension contribution only costs a basic rate taxpayer £80.",
    detail:
      "Auto-enrolment applies to most employees aged 22 or over earning at least £10,000 a year. Your employer must enrol you automatically - you can opt out, but you lose your employer contributions, which is effectively part of your salary you are turning down.\n\nMinimum contributions for 2025/26:\n• You contribute: at least 5% of qualifying earnings\n• Your employer contributes: at least 3%\n• Total minimum: 8%\n\nQualifying earnings are wages between £6,240 and £50,270 — so not your full salary if you earn outside that range.\n\nThe tax relief matters a lot. Most workplace pensions use arrangements that mean contributions come from pre-tax income. As a basic rate taxpayer, every £80 you put in is topped up to £100 through government tax relief. Higher rate taxpayers can claim additional relief through their tax return.\n\nContributions appear on your payslip, sometimes labelled 'pension', 'AE pension', or with your pension provider's name.",
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
      "Spend 50% of take-home on needs, 30% on wants, and save 20%. It is a rough framework, not a strict rule — but it gives you a quick way to check whether your money is going in the right direction.",
    detail:
      "The 50/30/20 rule is a framework, not a law. The point is to be intentional about where your money goes rather than wondering where it went at the end of the month.\n\nNeeds (50%): Things you cannot reasonably live without — rent or mortgage, council tax, bills, groceries, essential transport, minimum debt repayments.\n\nWants (30%): Things you choose to spend on — eating out, subscriptions, nights out, clothes beyond the basics, holidays.\n\nSavings and debt repayment (20%): Emergency fund, ISA contributions, pension top-ups, paying down credit card or student debt above the minimum.\n\nFor someone taking home £2,000 a month in London: the 50% needs target of £1,000 is often unrealistic because rent alone can eat most of that. That is fine — adjust the ratios to your situation. The important thing is knowing your actual numbers.\n\nUseful starting point: track your spending for one month, then map each transaction to needs, wants, or savings. Most people find a few quick wins that free up money without significantly changing their lifestyle.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your budgeting knowledge",
    icon: "bi-pie-chart",
  },

  {
    id: "budgeting-fixed-variable",
    category: "Budgeting Basics",
    title: "Fixed vs Variable Expenses",
    summary:
      "Fixed expenses are the same every month — rent, a phone contract, insurance. Variable expenses change month to month. The difference matters because variable spending is where you have the most control.",
    detail:
      "Fixed expenses are predictable and usually contractual. You cannot reduce them quickly without significant effort — cancelling a contract, moving, or switching providers.\n\nExamples of fixed expenses:\n• Rent or mortgage\n• Phone and broadband contracts\n• Gym membership\n• Insurance (car, home, contents)\n• Regular subscriptions (streaming, software)\n\nVariable expenses change and are largely within your control. This is where most day-to-day budgeting decisions happen.\n\nExamples of variable expenses:\n• Groceries (amount varies weekly)\n• Eating out and takeaways\n• Transport (fuel, Uber, train fares)\n• Clothing and personal care\n• Entertainment\n\nA useful exercise: list your fixed expenses first. Whatever is left after fixed costs and savings is your actual variable spending budget. This is much clearer than trying to cut everything at once — you immediately see the ceiling you are working within.\n\nSemi-fixed expenses are worth a separate review — subscriptions you could cancel, or a phone plan you could switch to a cheaper tariff. These often feel fixed but are not. Reviewing them once a year can free up surprisingly meaningful amounts.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your budgeting knowledge",
    icon: "bi-arrow-left-right",
  },

  {
    id: "budgeting-emergency-fund",
    category: "Budgeting Basics",
    title: "Emergency Funds",
    summary:
      "An emergency fund is money set aside for unexpected costs — a broken boiler, losing your job, a dental bill. Having one means you do not have to reach for a credit card when something goes wrong.",
    detail:
      "The standard advice is three to six months of essential expenses. If that sounds unreachable, start smaller — one month is a meaningful buffer and a realistic first goal.\n\nWhat counts as an emergency:\n• Unexpected car or home repair\n• Medical or dental bill not covered by the NHS\n• Losing your job or a sudden income gap\n• A family emergency requiring travel\n\nWhat does not count:\n• A sale you want to take advantage of\n• A holiday you did not budget for\n• Replacing something that is not broken\n\nWhere to keep it: a separate easy-access savings account, not mixed with your current account. A Cash ISA means the interest is completely tax-free. As of early 2026, best easy-access Cash ISA rates are around 4.75–5.15% AER — worth comparing providers.\n\nWhy build this before other goals: without an emergency fund, any unexpected cost can knock your whole financial plan off track — pushing you into debt or forcing you to sell investments at the wrong time. It is the foundation that makes everything else more stable.",
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
      "Your tax code tells your employer how much of your income is tax-free. The most common is 1257L — but if yours is different, it is worth understanding why, since a wrong code means overpaying or underpaying tax.",
    detail:
      "Tax codes are set by HMRC and sent to your employer. They appear on your payslip and P60. The number multiplied by 10 gives your tax-free allowance. The letter adds extra information.\n\nCommon 2025/26 codes:\n• 1257L — standard personal allowance of £12,570. Most employees have this.\n• M or N — you are receiving or transferring part of the Marriage Allowance (worth up to £252/year for the recipient).\n• BR — all income from this source taxed at 20%, no personal allowance applied here. Common for second jobs.\n• 0T — no personal allowance. Often appears when you start a new job before HMRC confirms your code — this is called emergency tax.\n• K codes — you owe tax that cannot be collected another way, so it is added to your taxable income. Can look confusing on a payslip but is legitimate.\n• D0 — all income from this source taxed at 40% higher rate.\n\nIf your code looks wrong, do not ignore it. Underpaying tax means HMRC will collect it later — sometimes as a lump sum at the end of the year. Overpaying means you are handing over money you did not need to.\n\nCheck and update your code through your Personal Tax Account at gov.uk, or call HMRC on 0300 200 3300.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your tax knowledge",
    icon: "bi-card-text",
  },

  {
    id: "tax-self-assessment",
    category: "Tax Fundamentals",
    title: "Self Assessment Basics",
    summary:
      "Most employees have tax collected automatically through PAYE and never need to file a return. But if you earn income from other sources — freelancing, renting, investments — you likely need to register for Self Assessment.",
    detail:
      "You need to complete a Self Assessment tax return if, in the last tax year, any of the following applied to you:\n• You were self-employed and earned more than £1,000 (the trading allowance)\n• Your total income exceeded £100,000\n• You received untaxed income over £2,500 — for example from renting a property\n• You had income from abroad\n• You or your partner received Child Benefit and either of you earned over £60,000\n• You want to claim certain reliefs such as Gift Aid on large charitable donations\n\nKey deadlines for the 2024/25 tax year:\n• 5 October 2025 — deadline to register for Self Assessment if it is your first time\n• 31 January 2026 — deadline to file your return online and pay any tax owed\n• 31 July 2026 — second payment on account deadline (if applicable)\n\nMissing the 31 January deadline triggers an automatic £100 fine — even if you owe no tax. Fines increase significantly at 3 and 6 months.\n\nNot sure if you need to file? HMRC has a tool at gov.uk/check-if-you-need-a-tax-return that takes around 5 minutes.",
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
      "An ISA lets you save or invest up to £20,000 a year without paying tax on interest or returns — ever. The allowance is confirmed frozen at £20,000 until at least 2030.",
    detail:
      "ISA stands for Individual Savings Account. Any interest, dividends, or investment gains inside an ISA are completely tax-free — you do not even need to declare them on a tax return.\n\nTypes available in 2025/26:\n• Cash ISA — works like a savings account. Interest is tax-free. As of early 2026, best easy-access rates are around 4.75–5.15% AER. Good for short-term savings and emergency funds.\n• Stocks and Shares ISA — you invest in funds, shares, or bonds. Higher potential returns than cash but value can fall. Best suited to money you will not need for at least 5 years.\n• Lifetime ISA (LISA) — save up to £4,000/year and the government adds a 25% bonus (up to £1,000/year free money). Must be used to buy your first home (property up to £450,000) or accessed from age 60 for retirement. You must open one before you turn 40. Withdrawing for any other reason costs a 25% penalty on the full withdrawal amount — meaning you would actually get back less than you put in.\n• Junior ISA — for under-18s managed by a parent or guardian. Allowance is £9,000/year for 2025/26.\n\nHeads up on upcoming changes: from April 2027 the Cash ISA allowance for under-65s is expected to drop to £12,000 per year (the overall £20,000 limit stays). If cash savings matter to you and you are under 65, it is worth using your full allowance while you can.\n\nSince April 2024 you can hold multiple ISAs of the same type with different providers in the same tax year — you just cannot exceed the overall £20,000 limit.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your savings knowledge",
    icon: "bi-bank",
  },

  {
    id: "saving-goals",
    category: "Saving and Financial Goals",
    title: "Short vs Long-Term Saving",
    summary:
      "Money you might need within two years should be kept safe and accessible. Money you will not need for a decade or more can be invested — taking on more risk in exchange for higher potential returns over time.",
    detail:
      "Short-term savings (0–2 years): Keep this in an easy-access savings account or Cash ISA. You want it safe and available. As of early 2026, the Bank of England base rate is 4.5%, so easy-access accounts are offering decent returns. Shop around — rates vary significantly between providers.\n\nMedium-term savings (2–10 years): You have more flexibility. Fixed-rate savings accounts lock your money in for a set period but offer better rates. A Stocks and Shares ISA with a globally diversified fund is worth considering if you are comfortable with the value going up and down.\n\nLong-term savings (10+ years): Time is your biggest asset. Investing in a diversified fund over a long period smooths out short-term market swings. Global stock markets have historically returned around 7–10% annually over long periods — significantly more than cash savings.\n\nFor retirement, workplace pensions and SIPPs (Self-Invested Personal Pensions) are the most tax-efficient vehicles because contributions get tax relief on the way in and the money grows tax-free inside.\n\nA simple rule: the longer your time horizon, the more investment risk you can afford — because you have time to recover from downturns. Someone who invested in a global index fund in 2009 during the financial crisis and left it alone would have seen it grow substantially over the following decade.",
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
