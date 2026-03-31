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
      "Your gross pay is the salary in your contract. Your net pay is what actually lands in your bank account, after income tax, National Insurance, and pension contributions are taken out. For most people on £30,000, the difference is roughly £6,000 a year.",
    detail:
      "When a job advertises a £30,000 salary, that is your gross figure. You will never receive the full amount because the government collects income tax and National Insurance through PAYE (Pay As You Earn) before your employer pays you. This is called being taxed at source, meaning the deductions happen before the money ever reaches you.\n\nHere is what a typical monthly payslip looks like on a £30,000 salary in 2025/26:\n\u2022 Gross pay: £2,500\n\u2022 Income tax: -£290\n\u2022 National Insurance: -£116\n\u2022 Pension contribution (5%): -£86\n\u2022 Net pay (what you actually receive): approximately £2,008\n\nThat is nearly £500 a month, or around £6,000 a year, that never touches your bank account. This surprises a lot of people when they see their first payslip.\n\nYour payslip is a legal document and must show every deduction as a separate line. If a figure looks wrong, especially your tax deduction, the most likely cause is an incorrect tax code. You can check yours instantly through your Personal Tax Account at gov.uk. It takes about two minutes and could be worth hundreds of pounds if your code is wrong.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your payslip knowledge",
    icon: "bi-receipt",
  },

  {
    id: "payslip-income-tax",
    category: "Understanding Your Payslip",
    title: "Income Tax",
    summary:
      "You only pay income tax on earnings above £12,570. Above that, tax is charged in bands, so not all of your salary gets taxed at the same rate. Earning £30,000 does not mean paying 20% on all of it.",
    detail:
      "The UK uses a progressive tax system. That means as you earn more, each additional pound can be taxed at a higher rate. But crucially, only the pounds that fall into that band are taxed at that rate, not your entire salary.\n\n2025/26 income tax bands (England, Wales and Northern Ireland):\n\u2022 Personal allowance: £0 to £12,570, taxed at 0% (completely tax-free)\n\u2022 Basic rate: £12,571 to £50,270, taxed at 20%\n\u2022 Higher rate: £50,271 to £125,140, taxed at 40%\n\u2022 Additional rate: above £125,140, taxed at 45%\n\nA worked example on a £30,000 salary:\n\u2022 The first £12,570 is tax-free\n\u2022 The remaining £17,430 is taxed at 20%, giving a tax bill of £3,486 for the year\n\u2022 That works out to £290.50 per month in income tax\n\nThis is very different from paying 20% on the full £30,000, which would be £6,000. The banded system means you always keep more of each pound than the headline rate suggests.\n\nSomething to be aware of if you earn over £100,000: your personal allowance starts shrinking. For every £2 you earn above £100,000, you lose £1 of your tax-free allowance. By the time you earn £125,140, the allowance is gone entirely. This creates an effective 60% marginal tax rate in that range, which is one reason some higher earners increase their pension contributions to bring their taxable income back below £100,000.\n\nThresholds are frozen until April 2028. As wages rise with inflation, more people gradually drift into higher tax bands without getting a pay rise in real terms. This is known as fiscal drag and it is why your take-home pay can feel like it is shrinking even when your gross salary goes up.\n\nScotland has its own income tax rates and bands, which differ from the rest of the UK. Check gov.uk/scottish-income-tax if that applies to you.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your tax knowledge",
    icon: "bi-percent",
  },

  {
    id: "payslip-national-insurance",
    category: "Understanding Your Payslip",
    title: "National Insurance",
    summary:
      "National Insurance is a separate deduction that funds the NHS and your future State Pension. It is not the same as income tax. For 2025/26 you pay 8% on earnings between £12,570 and £50,270, which works out to around £116 a month on a £30,000 salary.",
    detail:
      "National Insurance (NI) and income tax are both taken through PAYE, but they are entirely separate things with different rates, different purposes, and different rules. A common mistake is assuming they work the same way. They do not.\n\n2025/26 employee NI rates:\n\u2022 Below £12,570 per year: 0%\n\u2022 £12,570 to £50,270 per year: 8%\n\u2022 Above £50,270 per year: 2%\n\nOn a £30,000 salary, you pay NI on £17,430 (everything above £12,570) at 8%, coming to around £1,394 a year, which is about £116 a month.\n\nWhy does NI exist? Your contributions build your entitlement to certain state benefits, most importantly the State Pension. You need 35 qualifying years of NI contributions to receive the full new State Pension, which is £230.25 a week in 2025/26. Even part-time workers and lower earners can build up qualifying years, so it is worth knowing where you stand. You can check your NI record and get a State Pension forecast at gov.uk/check-state-pension.\n\nIf you have gaps in your NI record, for example from time spent abroad or out of work, you can sometimes pay voluntary contributions to fill them. Given that each qualifying year is worth roughly £6.58 a week in extra pension income for the rest of your life, filling gaps can be excellent value.\n\nYour employer also pays their own NI contribution on your behalf at 15% on earnings above £96 per week in 2025/26. This does not come out of your pay and does not appear on your payslip, but it is part of the total cost of employing you.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your NI knowledge",
    icon: "bi-shield-check",
  },

  {
    id: "payslip-pension",
    category: "Understanding Your Payslip",
    title: "Pension Contributions",
    summary:
      "If you are enrolled in a workplace pension, a slice of your salary goes in automatically each month. Because contributions come out before tax, a £100 pension contribution only actually costs you £80 as a basic rate taxpayer. Your employer also adds their own contribution on top.",
    detail:
      "Auto-enrolment applies to most employees aged 22 or over earning at least £10,000 a year. Your employer must enrol you automatically. You can opt out, but doing so means giving up your employer contributions, which is essentially part of your total pay package that you would be handing back.\n\nMinimum contributions for 2025/26:\n\u2022 You contribute: at least 5% of qualifying earnings\n\u2022 Your employer contributes: at least 3%\n\u2022 Total going into your pension: at least 8%\n\nQualifying earnings are wages between £6,240 and £50,270, so the percentages apply to that slice of your pay rather than your full salary.\n\nThe tax relief makes a real difference. For a basic rate (20%) taxpayer, every £80 you contribute is topped up to £100 by the government. That is an instant 25% return before your pension has invested a single penny. Higher rate taxpayers can claim even more relief through their Self Assessment tax return.\n\nWhy starting early matters so much: the longer your money is invested, the harder compound growth works for you. Compound growth means you earn returns not just on the money you put in, but on the returns themselves, year after year. Here is what that looks like in practice:\n\u2022 If you invest £200 a month from age 22 and stop at 32 (10 years of contributions), at 7% annual growth you could end up with more at retirement than someone who invests £200 a month from age 32 all the way to 65 (33 years of contributions).\n\nThat is the power of starting early. The first decade does more work than three decades later on.\n\nContributions appear on your payslip, sometimes labelled as pension, AE pension, or with your pension provider's name. If you are unsure which pension scheme your employer uses, your HR or payroll team can tell you, and you can usually access your pension account online to see its current value and how it is invested.",
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
      "A simple starting framework: put 50% of your take-home pay towards needs, 30% towards things you want, and 20% into savings or debt repayment. The ratios are flexible. What matters is knowing where your money is actually going each month.",
    detail:
      "The 50/30/20 rule is a framework, not a law. The point is to be intentional about where your money goes rather than wondering where it went at the end of the month.\n\nNeeds (50%): Things you cannot reasonably live without. Rent or mortgage, council tax, utility bills, groceries, essential transport, and minimum debt repayments all count here.\n\nWants (30%): Things you choose to spend on but could live without. Eating out, streaming subscriptions, nights out, new clothes beyond the basics, and holidays fall into this category.\n\nSavings and debt repayment (20%): Building your emergency fund, contributing to an ISA, topping up your pension, or paying down credit card or loan debt faster than the minimum.\n\nFor someone taking home £2,000 a month in London, the 50% needs target of £1,000 is often unrealistic because rent alone can take most of that. That is fine. Adjust the ratios to your situation. The framework is a starting point for a conversation with yourself, not a rigid target.\n\nA useful exercise when you are just starting out: track every transaction for one month without changing anything. Categorise each one as a need, want, or saving. Most people are surprised by what they find. Common discoveries are daily coffee running to £50 a month, subscription services nobody remembers signing up for, and takeaways that cost more than a weekly food shop. Small changes in the wants category often free up meaningful amounts without significantly affecting quality of life.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your budgeting knowledge",
    icon: "bi-pie-chart",
  },

  {
    id: "budgeting-fixed-variable",
    category: "Budgeting Basics",
    title: "Fixed vs Variable Expenses",
    summary:
      "Fixed expenses are the same every month, like rent, your phone contract, or insurance. Variable expenses change and are largely in your control, like groceries, takeaways, or transport. The difference matters because variable spending is where you have the most room to adjust.",
    detail:
      "Understanding the difference between fixed and variable expenses changes how you approach budgeting. Instead of trying to cut everything at once, you can quickly identify where you actually have flexibility.\n\nFixed expenses are predictable and usually contractual. You cannot reduce them quickly without significant effort such as cancelling a contract, moving home, or switching providers.\n\nCommon fixed expenses:\n\u2022 Rent or mortgage payments\n\u2022 Phone and broadband contracts\n\u2022 Gym membership\n\u2022 Car insurance, home insurance, or contents insurance\n\u2022 Regular subscriptions like streaming services or software\n\nVariable expenses change month to month and are largely within your control. This is where most day-to-day budgeting decisions happen.\n\nCommon variable expenses:\n\u2022 Groceries (the amount varies week to week)\n\u2022 Eating out and takeaways\n\u2022 Transport including fuel, taxis, and train fares\n\u2022 Clothing and personal care products\n\u2022 Entertainment and social spending\n\nA practical approach: list all your fixed expenses first and subtract them from your take-home pay. What remains is the real budget you have to work with for variable spending and savings. This is much more useful than vague intentions to spend less, because you can immediately see the ceiling you are working within.\n\nIt is also worth doing an annual review of expenses that feel fixed but are not. Phone contracts, broadband, car insurance, and streaming services can often be switched to cheaper alternatives. Many people treat these as immovable when in reality a couple of hours of comparison shopping can free up £50 to £100 a month.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your budgeting knowledge",
    icon: "bi-arrow-left-right",
  },

  {
    id: "budgeting-emergency-fund",
    category: "Budgeting Basics",
    title: "Emergency Funds",
    summary:
      "An emergency fund is money set aside for the unexpected: a broken boiler, a dental bill, or losing your job. Having one means you do not have to reach for a credit card when life goes sideways. Start with one month of essential expenses. Build from there.",
    detail:
      "The standard advice is to save three to six months of essential expenses. If that sounds unreachable right now, start much smaller. Even £500 provides a meaningful buffer against the most common financial shocks, like an unexpected car repair or a dental bill.\n\nWhat genuinely counts as an emergency:\n\u2022 Unexpected home or car repair\n\u2022 A medical or dental bill not covered by the NHS\n\u2022 Losing your job or a sudden gap in income\n\u2022 A family emergency that requires travel at short notice\n\nWhat does not count:\n\u2022 A sale you want to take advantage of\n\u2022 A holiday you did not plan for\n\u2022 Replacing something that still works\n\nWhere to keep it: a separate easy-access savings account, kept away from your everyday current account. The psychological separation matters. When your emergency fund is mixed in with money you spend day to day, it tends to disappear gradually without ever feeling like a genuine emergency was involved.\n\nA Cash ISA is worth considering for your emergency fund because any interest you earn is completely tax-free. As of March 2026, the best easy-access Cash ISA rates are around 4.66 to 4.68% AER. It is worth comparing a few providers before opening one, as rates vary significantly.\n\nWhy build this before investing or aggressively paying down debt: without an emergency fund, any unexpected cost forces a difficult choice. You either go into debt (often high-interest credit card debt), or you have to sell investments at a potentially bad time, or you fall behind on other financial goals. The emergency fund is what keeps the rest of your plan on track when life does not go as planned. It is the foundation everything else sits on.",
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
      "Your tax code tells your employer how much of your income to leave tax-free. The most common is 1257L. If yours looks different, it is worth checking why, because a wrong tax code means overpaying or underpaying without realising it.",
    detail:
      "Tax codes are set by HMRC and sent directly to your employer. They appear on your payslip and on your P60 at the end of each tax year. The number in the code, multiplied by 10, tells you your total tax-free income for that source of pay. The letter gives your employer additional instructions about how to apply the code.\n\nCommon 2025/26 codes and what they mean:\n\u2022 1257L: the standard code for most employees. It means your personal allowance is £12,570 and your employer leaves that amount tax-free.\n\u2022 M or N: you are receiving or transferring part of the Marriage Allowance, worth up to £252 per year for the person receiving it.\n\u2022 BR: all income from this particular job or pension is taxed at 20% with no personal allowance applied. This is common for second jobs where your allowance is already used by your main employer.\n\u2022 0T: no personal allowance at all. This often appears when you start a new job before HMRC has confirmed your correct code. It is sometimes called emergency tax and means you are likely overpaying until it is corrected.\n\u2022 K codes: you owe tax that cannot be collected another way, so it gets added to your taxable income instead. This can look alarming on a payslip but is a legitimate mechanism HMRC uses.\n\u2022 D0: all income from this source is taxed at 40%, usually because your personal allowance and basic rate band are already used up elsewhere.\n\nIf your code looks wrong, do not ignore it. Underpaying tax because of a wrong code means HMRC will collect the difference later, sometimes as a lump sum demand at the end of the year. Overpaying means you have been handing over money you were never supposed to. HMRC does not always catch and correct these automatically, so it is on you to check.\n\nYou can check your tax code, update your details, and claim any refunds owed through your Personal Tax Account at gov.uk. It is free to use and only takes a few minutes to set up. Alternatively, you can call HMRC directly on 0300 200 3300.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your tax knowledge",
    icon: "bi-card-text",
  },

  {
    id: "tax-self-assessment",
    category: "Tax Fundamentals",
    title: "Self Assessment Basics",
    summary:
      "Most employees have tax handled automatically through PAYE and never need to file a return. But if you earn money from freelancing, renting a property, or other sources, you will likely need to register for Self Assessment and file a return by 31 January each year.",
    detail:
      "Self Assessment is the system HMRC uses to collect tax on income that cannot be handled automatically through PAYE. If all your income comes from one employer, you probably never need to think about it. But the moment you earn income from other sources, it becomes your responsibility to declare it.\n\nYou need to complete a Self Assessment return if, in the last tax year, any of the following applied:\n\u2022 You were self-employed and earned more than £1,000 (this is known as the trading allowance)\n\u2022 Your total income from all sources exceeded £100,000\n\u2022 You received untaxed income of more than £2,500, for example from renting out a property\n\u2022 You had income from abroad\n\u2022 You or your partner received Child Benefit and either of you earned over £60,000\n\u2022 You want to claim tax reliefs not handled through your code, such as Gift Aid on large charitable donations or additional pension contribution relief\n\nKey deadlines for the 2025/26 tax year:\n\u2022 5 October 2026: deadline to register for Self Assessment for the first time\n\u2022 31 January 2027: deadline to file your return online and pay any tax owed\n\u2022 31 July 2027: second payment on account deadline (this applies if your tax bill exceeds a certain threshold)\n\nThe penalties for missing deadlines are automatic and apply even if you owe no tax at all. A late return triggers a £100 fine immediately. After 3 months, daily fines of £10 begin stacking up. After 6 months, a further 5% penalty is added on top of any tax owed. These add up fast and HMRC has very little discretion to waive them without a good reason.\n\nIf you are not sure whether you need to file, HMRC has a short checker tool at gov.uk/check-if-you-need-a-tax-return that takes about 5 minutes. It is worth using rather than guessing, because filing a return when you did not need to is far less painful than being chased for one you should have filed.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your tax knowledge",
    icon: "bi-file-text",
  },

  // -------- SAVING AND FINANCIAL GOALS ---------------------------------
  {
    id: "saving-isas",
    category: "Saving and Financial Goals",
    title: "ISAs: Tax-Free Savings",
    summary:
      "An ISA lets you save or invest up to £20,000 a year without paying any tax on the interest or returns. Ever. There are different types for different goals, including one with a government bonus if you are saving for your first home.",
    detail:
      "ISA stands for Individual Savings Account. Any interest, dividends, or investment growth inside an ISA is completely tax-free. You do not pay tax on it now, and you do not need to declare it on a tax return in the future either. Once money is inside an ISA, it stays sheltered from tax indefinitely.\n\nTypes available in 2025/26:\n\u2022 Cash ISA: works like a standard savings account but interest is tax-free. As of March 2026, the best easy-access Cash ISA rates are around 4.66 to 4.68% AER. Good for short-term savings and emergency funds where you might need the money quickly.\n\u2022 Stocks and Shares ISA: you invest in funds, shares, or bonds. The potential returns over the long term are higher than cash, but the value can fall as well as rise. Best suited for money you will not need for at least five years, giving you time to ride out market dips.\n\u2022 Lifetime ISA (LISA): you can save up to £4,000 per year, and the government adds a 25% bonus on top, up to £1,000 per year of free money. The money must be used to buy your first home (on a property worth up to £450,000) or accessed from age 60 for retirement. You must open one before you turn 40. If you withdraw for any other reason, the penalty is 25% of the full withdrawal amount, which means you would actually get back less than you originally put in.\n\u2022 Junior ISA: for under-18s, managed by a parent or guardian. The allowance is £9,000 per year for 2025/26.\n\nA heads-up on upcoming changes: from April 2027, the Cash ISA allowance for people under 65 is expected to drop to £12,000 per year. The overall £20,000 annual ISA limit stays the same, but the portion you can hold in cash will be restricted. If you are under 65 and rely on cash savings, it is worth making use of your full allowance while you still can.\n\nSince April 2024, you can hold multiple ISAs of the same type with different providers in the same tax year. You just cannot exceed the overall £20,000 annual limit across all of them combined.",
    linkedQuizId: "11",
    linkedQuizLabel: "Test your savings knowledge",
    icon: "bi-bank",
  },

  {
    id: "saving-goals",
    category: "Saving and Financial Goals",
    title: "Short vs Long-Term Saving",
    summary:
      "Money you might need in the next two years should stay somewhere safe and easy to access. Money you will not need for a decade or more can be invested, where it has the potential to grow significantly more than it would sitting in a savings account.",
    detail:
      "The key principle is matching where you keep your money to when you will need it. Keeping long-term money in a savings account is one of the most common and costly financial mistakes people make when they are starting out.\n\nShort-term savings (0 to 2 years): Keep this in an easy-access savings account or Cash ISA. You want it safe and available at short notice. As of March 2026, the Bank of England base rate is 3.75%, so easy-access accounts are offering reasonable returns. Shop around because rates vary significantly between providers and loyalty rarely pays.\n\nMedium-term savings (2 to 10 years): You have more flexibility here. Fixed-rate savings accounts lock your money away for a set period, typically one to five years, but tend to offer better rates in return. A Stocks and Shares ISA with a globally diversified fund is worth considering if you are comfortable with the value fluctuating in the short term.\n\nLong-term savings (10 or more years): Time is your most powerful asset. This is where compound growth really works in your favour. Compound growth means you earn returns not just on the money you originally put in, but on the returns you have already accumulated. It starts slowly and then accelerates significantly.\n\nA simple example of compound growth at 7% annual return:\n\u2022 £1,000 invested today becomes around £1,967 after 10 years\n\u2022 After 20 years it becomes around £3,870\n\u2022 After 30 years it becomes around £7,612\n\nThe money more than doubles in the second decade compared to the first, and nearly doubles again in the third. This is why starting even small amounts early beats waiting until you can invest larger amounts later.\n\nGlobal stock markets have historically returned around 7 to 10% annually over long periods, significantly outpacing cash savings. Markets do fall as well as rise, but the key protection against bad timing is staying invested for long enough that short-term dips become irrelevant.\n\nFor retirement specifically, workplace pensions and SIPPs (Self-Invested Personal Pensions) are the most tax-efficient vehicles available. Contributions receive tax relief on the way in, and growth inside the pension is sheltered from tax. This combination is very hard to beat with any other savings vehicle.",
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
