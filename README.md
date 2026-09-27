# Gecko

**A personal finance app for young adults starting their first job.** Gecko turns a payslip and day-to-day spending into a clear monthly picture: where the money goes, how healthy the budget is, what next month looks like, and the financial concepts behind it all.

GECKO stands for Goals, Earnings, Capital, Knowledge, Outcomes.

## Screenshots

| Home | Dashboard |
|------|-----------|
| ![Home page](screenshots/home.png) | ![Dashboard](screenshots/dashboard.png) |

| Financial health score | Expense logging |
|------------------------|-----------------|
| ![Health score](screenshots/health-score.png) | ![Expenses](screenshots/expenses.png) |

| AI finance tutor | Spend forecasting |
|------------------|-------------------|
| ![AI chat](screenshots/chat.png) | ![Forecast](screenshots/forecast.png) |

| Learning hub | Quizzes |
|--------------|---------|
| ![Learn](screenshots/learn.png) | ![Quiz](screenshots/quiz.png) |

| Student loan tracker | Pension optimizer |
|----------------------|-------------------|
| ![Loans](screenshots/loans.png) | ![Pension](screenshots/pension.png) |

| Receipt scanner | Tax year review |
|-----------------|-----------------|
| ![Receipt scanner](screenshots/scanner.png) | ![Year review](screenshots/year-review.png) |

## What it does

**Budgeting**
- Payslip setup with a UK tax calculator: gross salary to income tax, National Insurance and take-home pay on 2024/25 HMRC thresholds.
- A live dashboard of budget against actual spend that updates in real time as expenses are logged.
- A financial health score from 0 to 100, weighted across spending against income (40%), budget adherence (35%) and plan alignment (25%), with a plain-English breakdown.
- Receipt scanning: a photo of a receipt fills in the expense total through OCR.
- Savings goals, a bills calendar and monthly snapshots feeding a tax-year review.

**Looking ahead**
- Spend forecasting from an ensemble of four models, with per-month warnings when spending is heading over budget.
- A what-if scenario modeller for a pay rise, a spending cut or a lump sum.
- A student loan tracker for every UK plan, and a pension optimizer that shows the cost of missing an employer match.
- A five-question financial readiness check that produces a prioritised action list.

**Learning**
- A concept library, sequential learning paths and inline explanations wherever financial jargon appears.
- Quizzes, XP, levels, streaks and badges.
- An AI finance tutor that answers questions using the user's own numbers.

## Engineering highlights

- **Tool-calling AI agent.** The tutor runs on Groq and can call six live data tools (health score, budget, expenses, forecast, salary benchmark, savings). It runs up to three tool rounds before streaming the answer back over server-sent events.
- **MCP server.** The same data is exposed as a standalone Model Context Protocol server, so any MCP-compatible AI client can query a user's finances directly.
- **Ensemble forecasting.** Linear regression, a seasonal model, a rolling median and the current-month trend are weighted 30/20/30/20. Models with too little data drop out and the weights renormalise, so a new user still gets a sensible forecast.
- **Real-time updates.** Socket.io shares the Express server's port and emits to a per-user room, so only that user's open dashboard refreshes.
- **One identity across two systems.** The Firebase UID is the MongoDB `_id`, so auth and data never need a join. Every API route verifies the Firebase ID token server-side.
- **Anomaly detection and a category classifier.** Analytics flags spending more than two standard deviations from a category's norm. New expenses are categorised by keyword rules for UK merchants, falling back to cosine similarity over the user's own history.
- **Documented API.** OpenAPI 3.0 annotations on every route, with Swagger UI at `/api/docs`.
- **Privacy by design.** Data export and account deletion under GDPR, email verification enforced before data access, and rate limiting and structured logging that redacts tokens.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, Radix UI |
| Backend | Node.js, Express, Socket.io, Mongoose, node-cron, Zod |
| Data and auth | MongoDB Atlas, Firebase Authentication |
| Integrations | Groq (LLM), Adzuna (salary data), OCR.space (receipts), QuizAPI.io, SMTP newsletter |
| Testing | Jest, Supertest, mongodb-memory-server, Vitest, Testing Library |
| Delivery | GitHub Actions CI, Docker; hosted on Cloudflare Pages and Render during the project |

More detail on the design is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Background

Gecko started as a six-person group project at the University of Surrey (2025-26), where I was Scrum Master and backend/tech lead. I have kept building it solo since: the planning tools, the AI agent, the TypeScript migration and the redesigned interface.
