# Gecko — Architecture

> This document explains how Gecko is built, how its key features work, and the reasoning behind each major decision.
> Written for two audiences: someone with no technical background can read the plain-English sections and understand what the system does. A software engineer can read the technical sections and see exactly how it works.

---

## Table of contents

1. [What Gecko is](#what-gecko-is)
2. [System overview](#system-overview)
3. [The Forecast Engine](#the-forecast-engine)
4. [The AI Agent](#the-ai-agent)
5. [Student Loan Calculator](#student-loan-calculator)
6. [MCP Server](#mcp-server)
7. [Security model](#security-model)
8. [Data architecture](#data-architecture)
9. [Tech stack decisions](#tech-stack-decisions)
10. [Deployment](#deployment)
11. [Running locally](#running-locally)

---

## What Gecko is

Most young adults start their first job without knowing how to read their own payslip. They do not know what National Insurance is, why the tax figure looks wrong, or how much of their salary they will actually take home. This is not laziness — it is a gap in what schools teach.

Gecko is a personal finance web application built specifically for that moment: the first payslip, the first month of rent, the first attempt at a budget. The app connects a payslip to a budget, logs expenses against that budget, forecasts next month's spending before it happens, and teaches the user the concepts behind the numbers as they go.

### What makes it different from other budgeting apps

Four features go beyond the standard budgeting toolkit:

**Student Loan Tracker** — Repayments come out of a UK graduate's payslip automatically, like tax. Most people do not know how much they are paying, and many do not know if they will ever clear the balance or have it written off. The tracker calculates the exact monthly deduction from salary, projects the total repaid over 30-40 years, and tells the user whether they will clear the balance or have it written off — which is intentional policy for lower-earning graduates, not a failure.

**Pension Optimizer** — UK employers are legally required to contribute to an employee's pension (auto-enrolment). Many employees leave free employer contributions unclaimed by contributing less than the match threshold. The optimizer shows the 40-year compound growth difference between different contribution levels at 6% annual investment growth.

**Financial Readiness Check** — A 5-question diagnostic that produces a prioritized list of what to do first: enrol in the pension, understand the loan, open a Cash ISA, build an emergency fund. Designed so a user who knows nothing about personal finance leaves with a concrete next step.

**Tax Year Review** — A UK-specific annual summary aligned to the tax year (6 April to 5 April), not the calendar year. Shows total income, total expenses, top spending categories, and XP earned over the year, with navigation between tax years.

---

## System overview

```
                                     ┌─────────────────────────────────────┐
                                     │            USER'S BROWSER            │
                                     │                                      │
                                     │  React 18 + TypeScript + Vite        │
                                     │  Tailwind CSS, Framer Motion         │
                                     │  Firebase Auth (client SDK)          │
                                     │                                      │
                                     │  Key pages:                          │
                                     │    /dashboard   /forecast            │
                                     │    /loans       /pension             │
                                     │    /check       /year-review         │
                                     │    /learn       /savings             │
                                     └──────────────┬──────────────────────┘
                                                    │  HTTPS + JWT
                                                    │  (every request carries
                                                    │   a Firebase ID token)
                                     ┌──────────────▼──────────────────────┐
                                     │           EXPRESS SERVER             │
                                     │         Node.js + TypeScript         │
                                     │                                      │
                                     │  Auth middleware verifies JWT        │
                                     │  All routes under /api/v1/*          │
                                     │                                      │
                                     │  ┌────────────────────────────┐     │
                                     │  │       Services layer        │     │
                                     │  │  forecastService.js  ───── │──── │──▶ ml-regression
                                     │  │  healthScoreService.js      │     │
                                     │  │  adzunaCalculator.js ────── │──── │──▶ Adzuna API
                                     │  │  ocrService.js ──────────── │──── │──▶ OCR.space API
                                     │  │  newsletterService.js ───── │──── │──▶ SMTP
                                     │  └────────────────────────────┘     │
                                     └──────────────┬──────────────────────┘
                            ┌──────────────────────┼──────────────────────┐
                            │                      │                      │
               ┌────────────▼────────┐  ┌──────────▼──────┐  ┌──────────▼──────┐
               │   MongoDB Atlas     │  │  Firebase Auth   │  │   Groq API      │
               │                    │  │                  │  │                 │
               │  Users             │  │  Identity &      │  │  LLM inference  │
               │  Expenses          │  │  JWT issuance    │  │  (llama-3.1)    │
               │  MonthlyBudget     │  │  (Google-managed)│  │                 │
               │  MonthlySnapshot   │  └──────────────────┘  └─────────────────┘
               │  ChatSession       │
               │  SavingsGoal       │
               └────────────────────┘
```

### How a request travels through the system

Here is what happens when a user loads their dashboard:

1. The browser sends `GET /api/v1/dashboard` with a `Authorization: Bearer <token>` header.
2. The auth middleware on the server calls Firebase Admin SDK to verify the JWT. This is a cryptographic check using Google's published public keys — the server does not store sessions or passwords.
3. The middleware attaches the verified user ID to the request object.
4. The dashboard route handler fetches from MongoDB: the user's latest `MonthlyBudget` document (their payslip allocation), and all `Expense` documents for the current month.
5. The `healthScoreService` computes a 0–100 score from those figures.
6. The Adzuna API is called with the user's job title and location to fetch a market salary comparison.
7. All results are returned as a single JSON response. The client does one request and gets everything it needs.

---

## The Forecast Engine

### Plain English

The forecast engine tries to answer: "If I keep spending the way I have been, how much will I spend in each category next month?"

It does this by looking at your expense history — the same way a person would: if you spend roughly the same on food every month, it predicts roughly the same next month. If your spending has been rising, it expects it to continue rising. If last January you spent a lot on heating, it factors that in for next January.

The system then merges these different perspectives into a single prediction, and flags you if any category is heading toward your budget limit.

### Technical implementation

The forecast runs as a four-component **ensemble model**. Each component captures a different signal in the data:

| Component | Weight | What it captures |
|---|---|---|
| Simple linear regression | 30% | The overall trend — spending rising or falling over time |
| Seasonal prediction | 20% | Cyclical patterns — January heating, December gifts |
| Rolling 3-month median | 30% | Recent behaviour, resistant to one-off outliers |
| Current month pace | 20% | Real-time signal — spend-to-date ÷ days elapsed × days in month |

```
finalForecast = Σ (weight_i / totalWeight) × component_i
             where totalWeight = sum of weights for non-null components
```

Weights are **renormalized** when components return `null` (e.g. a new user has no seasonal history). This prevents the absence of one signal from biasing the result toward zero.

**Why median instead of mean for the rolling component?**
The rolling component uses `median(last 3 months)` rather than `mean(last 3 months)`. If a user had a £400 concert ticket in February, that outlier would inflate the March food prediction if averaged. The median is unaffected by a single extreme value, producing a more realistic baseline.

**Salary bounding**
If the ensemble forecasts a total spend across all categories that exceeds the user's gross salary, all forecasts are scaled proportionally downward. This prevents the model from predicting financially impossible outcomes.

**Anomaly detection**
For each category, the system computes the z-score of current month spending against the historical series:

```
z = (currentSpend - mean(history)) / stdDev(history)
```

If `|z| > 2.0` (two standard deviations from the mean), the category is flagged as anomalous. Requires at least 4 months of history to avoid false positives on limited data.

**Recurring expense detection** (`recurringService.js`)
A subscription or standing order is identified when both of the following hold across at least 2 consecutive months:
- **Amount stability**: coefficient of variation (CV = stdDev / mean) < 0.15 (amounts vary less than 15%)
- **Day-of-month stability**: standard deviation of the day the expense occurs < 5 days

This correctly identifies a monthly gym payment (same amount, same day) while ignoring irregular grocery shops (variable amount, any day).

**Confidence scoring**
Each category's prediction comes with a confidence score (10–99):

```
confidence = max(10, min(99, 100 - (stdDev(history) / mean(history)) × 100))
```

High variability → low confidence. Low variability → high confidence. Displayed in the UI as a percentage so users know whether to take the prediction seriously.

---

## The AI Agent

### Plain English

The chat assistant is not just a chatbot that knows general financial facts. It has access to tools — the same way a financial advisor would pull up your statements before giving advice. When you ask "why is my health score low?", it does not guess. It calls a tool to fetch your actual health score breakdown, sees which factor is dragging it down, then explains exactly what that means for your specific numbers.

### What changed: from data-dump to tool-calling agent

**Before (naive approach):** All financial data was collected upfront and injected into a system prompt before every request. The AI received your full budget, all spending categories, and health score regardless of what you asked. This was wasteful (tokens), inflexible (the data was stale by message time), and produced generic answers because the AI could not ask for more detail.

**After (tool-calling agent):** The AI starts with a minimal system prompt explaining its role and the tools available. When a question is data-specific, it calls the relevant tool. Only the data that matters to that question is fetched.

### Available tools

| Tool | What it fetches | Example question that triggers it |
|---|---|---|
| `get_budget_overview` | Take-home pay, total budget, budget remaining | "How much have I spent this month?" |
| `get_expense_breakdown` | Spending by category for a given month | "Where did my money go in March?" |
| `get_forecast` | Next month projections, confidence, warnings | "Will I overspend on rent this month?" |
| `get_health_score` | Score breakdown by factor with explanations | "Why is my health score only 52?" |
| `get_loan_summary` | Loan plan, monthly repayments, projection | "How much is my student loan costing me?" |
| `get_savings_goals` | All goals with progress and target dates | "Am I on track with my savings?" |

### The agentic loop

```
User message
     │
     ▼
┌─────────────────────────────────────────────┐
│  Round 1: Groq call with tools defined      │
│  model decides whether to use tools         │
└──────────────┬──────────────────────────────┘
               │
      ┌────────▼────────┐
      │  finish_reason  │
      └────────┬────────┘
               │
    ┌──────────▼──────────┐    ┌────────────────────────────────┐
    │  "tool_calls"        │    │  "stop" (no tools needed)      │
    │  AI wants real data  │    │  AI can answer from knowledge  │
    └──────────┬──────────┘    └──────────────┬─────────────────┘
               │                               │
               ▼                               │
┌─────────────────────────────────┐            │
│  Execute tool calls             │            │
│  Query MongoDB for user's data  │            │
│  Return structured JSON         │            │
└──────────────┬──────────────────┘            │
               │                               │
               ▼                               │
┌─────────────────────────────────┐            │
│  Feed results back to Groq      │            │
│  messages: [                    │            │
│    ...,                         │            │
│    { role: "assistant",         │            │
│      tool_calls: [...] },       │            │
│    { role: "tool",              │            │
│      content: "{real data}" }   │            │
│  ]                              │            │
└──────────────┬──────────────────┘            │
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│  Round 2 (or direct): Groq streaming call               │
│  AI generates response based on real user data          │
│  Tokens streamed to client via Server-Sent Events       │
└─────────────────────────────────────────────────────────┘
```

Maximum 3 tool-call rounds per message to prevent runaway loops. The client displays a "Checking your data..." indicator while tools resolve, so the user knows the AI is fetching their real numbers.

### SSE streaming

Responses stream as Server-Sent Events (SSE) rather than returning a completed string. This means the first word of the reply appears on screen within milliseconds, rather than the user waiting for the full response. The stream carries three event types:

```
data: {"tool": "get_health_score"}     → client shows "Checking your data..."
data: {"token": "Your "}               → client appends to message
data: {"done": true}                   → client ends streaming
```

---

## Student Loan Calculator

### Plain English

Student loan repayments in the UK are not like other debt. You do not choose to make a payment — it comes out of your payslip automatically, the same way tax does. You only repay a percentage of what you earn *above* a threshold. If you earn below the threshold, you pay nothing. After 30 or 40 years (depending on your plan), any remaining balance is written off.

This means many graduates will never fully clear their loan, and that is intentional policy. The calculator is honest about this: it will tell you whether you are on track to clear your balance or whether it will be written off.

### UK loan plan types

| Plan | Who it covers | Threshold (2024/25) | Rate | Write-off |
|---|---|---|---|---|
| Plan 1 | Started uni before 2012 | £24,990/yr | 9% above threshold | 25 years |
| Plan 2 | Started uni 2012–2023 (England/Wales) | £27,295/yr | 9% above threshold | 30 years |
| Plan 4 | Scotland | £31,395/yr | 9% above threshold | 30 years |
| Plan 5 | Started uni from 2023 (England/Wales) | £25,000/yr | 9% above threshold | 40 years |
| Postgrad | Masters or PhD loan | £21,000/yr | 6% above threshold | 30 years |
| None | No loan | — | — | — |

### Monthly repayment calculation

```typescript
function monthlyRepayment(grossAnnual: number, plan: LoanPlan): number {
  const config = LOAN_PLANS[plan];
  const repayableIncome = Math.max(0, grossAnnual - config.threshold);
  return Math.round((repayableIncome * config.rate) / 12 * 100) / 100;
}
```

### 30/40-year projection

The projection model simulates each year at the current salary (no salary growth assumed, to give a conservative estimate):

1. Apply annual repayment against balance
2. Apply plan interest rate to remaining balance
3. If balance reaches zero, record years to payoff
4. If write-off year is reached before balance clears, flag as write-off and record the remaining balance

This tells the user: "At your salary, you will repay £X in total, and £Y will be written off after Z years."

---

## MCP Server

### Plain English

MCP (Model Context Protocol) is an open standard that lets AI assistants plug into external tools and data sources. Think of it like a universal adapter: any AI that supports MCP can connect to a Gecko data source and query your finances directly.

Gecko ships a standalone MCP server. Any MCP-compatible client can connect to it, and those tools can then answer questions about your real financial data: "how much did I spend on food last month?" "what's my pension gap?" "when will I clear my student loan?"

### Available tools

| Tool name | Description |
|---|---|
| `gecko_budget_overview` | Take-home pay, budget total, budget used, budget left this month |
| `gecko_expense_breakdown` | Spending grouped by category for a given month (defaults to current) |
| `gecko_forecast` | Ensemble forecast for next month with confidence scores and overspend warnings |
| `gecko_health_score` | Financial health score (0–100) with factor-by-factor breakdown |
| `gecko_loan_summary` | Student loan plan, monthly repayment, 30/40-year projection |
| `gecko_savings_goals` | All savings goals with current progress, target, and completion status |

### How to connect

The MCP server runs as a stdio process (standard input/output) — this is the most compatible mode for MCP clients.

```bash
# Set environment variables
export MONGODB_URI="your-mongodb-connection-string"
export GECKO_USER_ID="your-firebase-uid"

# Start the server
node server/mcp/gecko-mcp.js
```

**Connecting a client:**
Add to the client's MCP config:
```json
{
  "mcpServers": {
    "gecko": {
      "command": "node",
      "args": ["path/to/gecko/server/mcp/gecko-mcp.js"],
      "env": {
        "MONGODB_URI": "your-connection-string",
        "GECKO_USER_ID": "your-firebase-uid"
      }
    }
  }
}
```

Once connected, the client can answer questions like:
> "How much did I spend last month by category?"
> "Is my pension contribution maximizing the employer match?"
> "What's my financial health score and what's dragging it down?"

---

## Security model

### Authentication flow

```
Browser                    Firebase                   Gecko Server
   │                           │                           │
   │── signIn(email, pass) ──▶│                           │
   │◀─ ID token (JWT) ─────────│                           │
   │                           │                           │
   │── GET /api/v1/dashboard ────────────────────────────▶│
   │   Authorization: Bearer <JWT>                         │
   │                           │                           │
   │                           │◀─ verifyIdToken(JWT) ────│
   │                           │── uid + claims ─────────▶│
   │                           │                           │
   │◀────────────────────────── dashboard data ───────────│
```

**What the JWT verification does:** Firebase ID tokens are JSON Web Tokens signed with Google's private RSA key (RS256). The Firebase Admin SDK on the server downloads Google's current public keys at startup, caches them, and uses them to verify the token's cryptographic signature. This means:
- The server never stores passwords
- The server never issues tokens — Google does
- A tampered or forged token is rejected because the signature check fails
- Tokens expire after 1 hour; the Firebase client SDK auto-refreshes

### Why every request carries the token

There are no server-side sessions. Every HTTP request carries the JWT in the `Authorization` header. The middleware extracts the user ID from the verified token. This makes the server **stateless** — any instance can handle any request because there is nothing to look up in a session store.

### Rate limiting

`express-rate-limit` applies limits at two tiers:
- **General API routes**: 100 requests per 15 minutes per IP
- **Forecast endpoint**: tighter limit because it runs the ML compute path and calls `Expense.aggregate()`

### Input validation

Request bodies are validated with **Zod schemas** before reaching any handler. Zod rejects unexpected fields (strips extra keys), type-coerces where safe, and returns structured error messages. This prevents injection via malformed JSON payloads.

---

## Data architecture

### Document structure

```
User (_id = Firebase UID)
├── email, displayName, avatarChoice
├── payslipData { grossSalary, jobTitle, location }
├── xp, level, weeklyStreak
├── studentLoan { plan, balance, startYear }
├── pensionSettings { employerMatchPct, employeeContributionPct }
├── readinessCheck { completedAt, score, priorities[], answers{} }
├── forecastWarningState { monthKey, dismissedWarningIds[] }
├── pathProgress { pathSlug: [completedModuleIds] }
└── newsletterOptIn, seenSnapshotPopupKeys[]

Expense (_id, userId, amount, category, date, month, year, note, source)

MonthlyBudget (_id, userId, grossSalary, takeHomePay, categories[])
  └── categories: [{ name, budget }]

MonthlySnapshot (_id, userId, monthKey, grossSalary, takeHomePay,
                  totalExpenses, savings, xpEarned, categories{})

ChatSession (_id, userId, messages[{ role, content, createdAt }])

SavingsGoal (_id, userId, name, targetAmount, currentAmount,
              targetDate, category, contributions[], isCompleted)
```

### Why Firebase UID is the MongoDB `_id`

MongoDB normally assigns a random `ObjectId` to each document as its `_id`. For the `User` document, the Firebase UID (a string like `"xK7mP3qR..."`) is used as `_id` instead.

This means all other documents can reference the user with `userId: req.user.uid` and queries never need a join or lookup — the same identifier works across both systems. There is no risk of creating two separate user identities that need to be reconciled.

### Virtual fields

Mongoose **virtuals** are fields that are computed on-the-fly and never stored in the database:

```javascript
UserSchema.virtual("xpLevel").get(function () {
  return Math.floor(this.xp / 100) + 1;  // every 100 XP = 1 level
});
```

`SavingsGoal` uses virtuals for `progressPct`, `remainingAmount`, and `monthsToTarget` — computed from `currentAmount` and `targetAmount` without storing derived values. Virtuals are included in JSON output via `{ toJSON: { virtuals: true } }`.

### Monthly snapshots

The `monthlySnapshotJob` (cron, runs at 23:50 on the last day of each month) aggregates each user's data into a `MonthlySnapshot` document. This is the source of truth for the Tax Year Review: historical data is captured at month-end and remains accurate even if expenses are later edited.

---

## Tech stack decisions

### Why Express and not Hono or Fastify?

Express 4 was chosen because:
1. The team had prior exposure to it and the constraint was time-to-working-feature, not raw performance
2. The ecosystem of compatible middleware (cors, helmet, express-rate-limit, multer) is mature
3. MongoDB/Mongoose pairs naturally with Express-style async route handlers

In a future production version, Hono would be a strong candidate for the Cloudflare Workers deployment because it runs natively on the Workers runtime.

### Why Server-Sent Events and not WebSockets for chat streaming?

SSE is **unidirectional** (server → client only). For chat, the client sends one request and the server streams the response back — that is exactly what SSE is designed for.

WebSockets are bidirectional and designed for two-way real-time communication (like the expense Socket.io events, where a logged expense triggers a real-time update on the dashboard). Using WebSockets for something that is naturally request-response would add unnecessary complexity.

SSE also works over standard HTTP/1.1, requires no protocol upgrade, and is handled natively by the browser's `fetch` + `ReadableStream` API — which is what `groqChat.tsx` uses.

### Why MongoDB and not PostgreSQL?

The user's financial profile is **document-shaped**: the `pensionSettings`, `studentLoan`, and `readinessCheck` fields were all added to the `User` document incrementally without needing schema migrations. MongoDB's document model means adding a new nested field to the schema is a code change only — existing documents simply do not have the field yet.

If the project were to add cross-user analytics (aggregate reports across all users), a relational model would be worth reconsidering.

### Why Groq and not OpenAI?

Groq runs open-weight models (Llama 3.1) on custom inference hardware (LPUs — Language Processing Units) that produce responses significantly faster than GPU-based inference. For a chat interface where streaming latency matters, Groq's `llama-3.1-8b-instant` model produces tokens quickly enough that the experience feels responsive.

The API is OpenAI-compatible, meaning the tool-calling syntax, message format, and streaming protocol are identical — the only difference is the base URL.

---

## Deployment

### Client: Cloudflare Workers (static asset serving)

The React + TypeScript frontend is built by Vite into a static bundle (`dist/`). Cloudflare Workers can serve static assets from the edge — the user's browser fetches the app from whichever Cloudflare datacenter is nearest to them globally, rather than from a single origin server.

```
Build command:   npm run build --prefix client
Output:          client/dist/
Deploy command:  npx wrangler deploy
Config:          wrangler.toml
```

All API calls proxy to the Render server via the `VITE_API_URL` environment variable set at build time.

### Server: Render (web service)

The Express server runs on Render's free tier. Configuration in `render.yaml` sets:
- Root directory: `server/`
- Build: `npm install`
- Start: `npm start` (which runs `tsx server.js` — TypeScript-aware execution)

**Free tier cold starts:** Render's free tier sleeps the server after 15 minutes of inactivity. The first request after sleep triggers a ~30-second cold start. For a demo or portfolio project this is acceptable. A production deployment would use Render's Starter plan ($7/month) to keep the server warm.

### Environment variables

All secrets are passed via environment variables. Never committed to git. Full list:

```bash
# Server (.env)
MONGODB_URI                # MongoDB Atlas connection string
FIREBASE_PROJECT_ID        # Firebase project identifier
FIREBASE_CLIENT_EMAIL      # Service account email
FIREBASE_PRIVATE_KEY       # Service account private key (multiline, quote in .env)
GROQ_API_KEY               # Groq inference API key
ADZUNA_APP_ID              # Adzuna jobs API app ID
ADZUNA_APP_KEY             # Adzuna jobs API key
OCR_SPACE_API_KEY          # OCR.space receipt scanning key
QUIZ_API_KEY               # QuizAPI.io key (optional, falls back to built-in)
SMTP_HOST / SMTP_PORT      # SMTP relay for newsletter
SMTP_USER / SMTP_PASS
NEWSLETTER_FROM_EMAIL
CLIENT_URL                 # Used for CORS origin and unsubscribe links

# Client (.env.development and build-time)
VITE_API_URL               # Server URL (http://localhost:3001 in dev)
VITE_FIREBASE_API_KEY      # Firebase client config (public by design)
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

> Note: Firebase client config values (`VITE_FIREBASE_*`) are designed to be public. They identify the Firebase project but do not grant access — that is controlled by Firebase Security Rules and the Admin SDK on the server.

---

## Running locally

```bash
# 1. Install all dependencies
npm install
npm install --prefix server
npm install --prefix client

# 2. Set up environment variables
cp server/.env.example server/.env   # then fill in values
cp client/.env.example client/.env.development

# 3. Start everything (dev server + API server concurrently)
npm run dev

# 4. (Optional) Seed example data
npm run seed:data --prefix server
npm run verify:seed --prefix server

# 5. Run tests
npm test --prefix server   # Jest (unit + integration with in-memory MongoDB)
npm test --prefix client   # Vitest + Testing Library

# 6. Start the MCP server (optional, requires MONGODB_URI + GECKO_USER_ID)
MONGODB_URI="..." GECKO_USER_ID="..." node server/mcp/gecko-mcp.js
```

**Ports:**
- Client dev server: `http://localhost:5173`
- API server: `http://localhost:3001`
- Vite proxies `/api` → `:3001` in development

---

*Last updated: 2026-06-15*
