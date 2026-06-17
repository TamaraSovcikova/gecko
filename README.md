# Gecko — Personal Finance App for Young Adults

**GECKO** (Goals, Earnings, Capital, Knowledge, Outcomes) is a full-stack personal finance web app that turns a payslip and day-to-day spending into a clear, actionable monthly picture.

Originally built as a 6-person University of Surrey group project (COM2042, 2025–26), the app has since been extended with additional features, a TypeScript migration, and a deployed cloud architecture. I was Scrum Master and Backend/Tech Lead throughout the group phase, and have continued developing the project solo since.

---

## Screenshots

> Run `node docs/take-screenshots.js` (requires Playwright) to regenerate these locally against a running dev server.

| Home | Dashboard |
|------|-----------|
| ![Home page](screenshots/home.png) | ![Dashboard](screenshots/dashboard.png) |

| Financial Health Score | Real-time Expense Logging |
|------------------------|--------------------------|
| ![Health score](screenshots/health-score.png) | ![Expenses](screenshots/expenses.png) |

| AI Finance Assistant (tool-calling) | Spend Forecasting |
|--------------------------------------|-------------------|
| ![AI chat](screenshots/chat.png) | ![Forecast](screenshots/forecast.png) |

| Learning Hub | Gamified Quizzes |
|--------------|-----------------|
| ![Learn](screenshots/learn.png) | ![Quiz](screenshots/quiz.png) |

| Student Loan Tracker | Pension Planner |
|----------------------|-----------------|
| ![Loans](screenshots/loans.png) | ![Pension](screenshots/pension.png) |

| Receipt OCR Scanner | Tax Year Review |
|---------------------|-----------------|
| ![OCR scanner](screenshots/scanner.png) | ![Year review](screenshots/year-review.png) |

---

## Features

### Core (group project, 2025–26)

| Feature | What it does |
|---------|-------------|
| **Payslip setup + HMRC calculator** | Gross annual salary → income tax, NI, and take-home pay using 2024/25 HMRC thresholds. Budget categories allocated here. |
| **Dashboard** | Live pie charts comparing budget vs. actual spend. Financial health score (0–100) weighted across spending-vs-income (40%), budget adherence (35%), and plan alignment (25%). Updates in real time via Socket.io — no page refresh. |
| **Real-time expense logging** | Log expenses by category; dashboard reflects the change instantly via Socket.io. |
| **Spend forecasting** | Ensemble model (linear 30%, seasonal 20%, rolling median 30%, trend 20%) projects month-end spend and raises dismissable per-month warnings. |
| **Receipt OCR scanner** | Upload a photo of a receipt; OCR.space extracts the total and pre-fills the expense form. |
| **AI finance assistant** | Groq-powered chat agent with 6 real-data tool calls (health score, expenses, budget, forecast, salary benchmark, savings). Runs a multi-round agentic loop before streaming the response. |
| **Financial literacy quizzes** | Fetches questions from QuizAPI.io (built-in custom fallback). Awards XP on completion. |
| **Gamification** | XP system, levels, weekly streaks, and badges to increase engagement with financial education. |
| **Profile + salary benchmark** | Adzuna API lookup shows average salary for your job title and UK location as a comparison point. |
| **Learning hub** | Concept articles (payslips, pensions, tax, budgeting), learning paths with sequential unlock, and inline `ConceptLink` tooltips throughout the app. |
| **Monthly newsletter** | Opt-in personalised spending summary delivered via SMTP (nodemailer) on the 1st of each month. The unsubscribe route is the only public endpoint. |
| **Monthly snapshots** | Automatic end-of-month budget snapshot; used by the year-review and history timeline. |
| **Onboarding flow** | Step-by-step `TooltipGuide` for new users, anchored to `data-onboarding` attributes on stable DOM elements. |
| **Account settings + GDPR** | Change password, export data (GDPR Art. 20), delete account (GDPR Art. 17). Terms & Data Policy pages. |

### Extended (added post-group-project)

| Feature | What it does |
|---------|-------------|
| **Student loan tracker** | Monthly repayment, full payoff projection, and pension gap for Plan 1/2/4/5 and postgrad loans. Uses 2024/25 HMRC thresholds. |
| **Pension optimizer** | Projects retirement pot, identifies monthly contribution gap to target, shows compound growth curve. |
| **Financial readiness check** | 5-question diagnostic (score 0–100) with a prioritised action list; persisted to user profile. |
| **Tax year review** | Annual summary across the UK tax year (Apr 6 – Apr 5) with year-offset navigation. |
| **What-if scenario modeller** | Shows how a pay rise, expense cut, or lump-sum saving would shift your health score. |
| **Savings goals** | Create goals with target amounts and dates; tracks progress and projects months to target with virtual fields. |
| **Bills tracker** | Recurring bill management with due-date alerts. |
| **Planning sidebar** | Surfaces loan tracker, pension gap, and readiness check status without leaving the dashboard. |
| **MCP server** | `server/mcp/gecko-mcp.js` exposes Gecko data as an MCP tool server (stdio transport). |

---

## Tech stack

### Frontend
- **React 18 + TypeScript** — migrated from JavaScript during development
- **Vite 5** — dev server on `:5173`, proxies `/api` → backend in development
- **React Router 6** — protected routes via `ProtectedRoute` wrapper
- **Tailwind CSS v3** — custom design tokens (`purple-*`, `gold`, `shadow-nav/button/pop`)
- **Recharts** — pie charts, area charts, budget vs. spend comparisons
- **Framer Motion** — page and component transitions
- **Radix UI + CVA** — accessible primitives; Button, Card, Input, Badge, Progress, Alert
- **Socket.io-client** — real-time dashboard updates
- **Firebase JS SDK** — client-side auth + Google OAuth

### Backend
- **Node.js + Express 4** on port `:3001`
- **MongoDB Atlas** via **Mongoose 8** — Firebase UID is `_id` on `User` documents
- **Firebase Admin SDK** — verifies every incoming ID token; all `/api/v1/*` routes protected
- **Socket.io** — shares HTTP server port; expense controllers emit update events
- **node-cron** — newsletter and snapshot jobs start at server boot
- **nodemailer** — SMTP newsletter delivery
- **multer** — receipt image upload
- **tsx** — TypeScript server entry point

### External APIs
| Service | Purpose |
|---------|---------|
| Firebase Authentication | User sign-in, Google OAuth, ID token verification |
| MongoDB Atlas | Primary datastore |
| Groq (`llama-3.3-70b-versatile`) | Tool-calling AI finance agent |
| Adzuna Jobs API | Average salary lookups by job title + UK location |
| OCR.space | Receipt total extraction |
| QuizAPI.io | Dynamic financial literacy questions |
| SMTP | Monthly newsletter |

### Testing
- **Jest + Supertest + `mongodb-memory-server`** — server unit and integration tests
- **Vitest + Testing Library** — client unit tests

### Deployment
- **Cloudflare Pages** — client (auto-deploy from `main`)
- **Render** — server (Free tier; `render.yaml` committed to repo)
- **Docker** — `Dockerfile` at repo root for self-hosted / local prod testing

---

## Repository layout

```
gecko/
├── client/                     # React + TypeScript frontend (Vite)
│   ├── public/_redirects       # SPA routing for Cloudflare Pages
│   └── src/
│       ├── App.tsx             # Route table (20 routes)
│       ├── MainLayout.tsx      # Shared layout — XP bar, sidebar
│       ├── pages/              # Dashboard, Expenses, Forecast, Learn,
│       │                       #   Quiz, Profile, Loans, Pension, Savings,
│       │                       #   Bills, Scenarios, ReadinessCheck, YearReview…
│       ├── components/         # Button, Card, ConceptLink, TooltipGuide…
│       ├── context/            # AuthContext, GamificationContext
│       ├── hooks/              # useSocket, usePageOnboarding, useStreakWarning
│       ├── api/                # Typed fetch helpers
│       ├── lib/                # ukTaxCalc.ts, studentLoan.ts, utils.ts
│       └── types/api.ts        # Canonical API response interfaces
│
└── server/
    ├── server.js               # Entry: DB connect, HTTP + Socket.io, cron
    ├── mcp/gecko-mcp.js        # MCP tool server (stdio)
    ├── scripts/                # seedData, previewNewsletter, clearExpenses…
    └── src/
        ├── app.js              # Express, middleware, route mounting
        ├── routes/             # auth, dashboard, expense, payslip, user,
        │                       #   quiz, forecast, snapshot, chat
        ├── controllers/        # expense, payslip, quiz, user
        ├── services/           # forecast, healthScore, dashboardAggregate,
        │                       #   adzunaCalculator, hmrcCalculator, ocr,
        │                       #   newsletter, quiz
        ├── models/             # User, Expense, MonthlyBudget,
        │                       #   MonthlySnapshot, NewsletterSnapshot
        ├── jobs/               # newsletterJob, monthlySnapshotJob
        ├── middleware/auth.js  # Firebase ID token verification
        └── config/             # db, firebase, multer
```

---

## Key architectural decisions

- **Firebase UID = MongoDB `_id`** — single identity across both systems; no join table needed.
- **Single port for HTTP + Socket.io** — `io` attached to the Express server; controllers reach it via `app.get('io')`.
- **Ensemble forecasting** — four models with renormalized weights; null months excluded so sparse data degrades gracefully.
- **Shared UK tax calculator** — `client/src/lib/ukTaxCalc.ts` is the sole source of HMRC logic; the server CJS mirror (`server/src/lib/studentLoan.js`) stays in sync manually.
- **Agentic chat loop** — chat route runs up to 3 tool-call rounds before streaming so the model can chain lookups without client round-trips.
- **`data-onboarding` anchors** — onboarding steps target elements via CSS attribute selectors on always-present DOM nodes; `TooltipGuide` tracks position via `getBoundingClientRect` + rAF.

---

## Running locally

### Prerequisites

- Node.js 20+
- MongoDB connection string (Atlas or local)
- Firebase project with Authentication enabled + service account
- API keys for optional integrations (Groq, Adzuna, OCR.space, QuizAPI, SMTP)

### Install

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### Environment variables

**`server/.env`**
```bash
PORT=3001
CLIENT_URL=http://localhost:5173
MONGODB_URI=<atlas-connection-string>

FIREBASE_PROJECT_ID=<project-id>
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

GROQ_API_KEY=<groq-key>
ADZUNA_APP_ID=<id>
ADZUNA_APP_KEY=<key>
OCR_SPACE_API_KEY=<key>
QUIZ_API_KEY=<key>

SMTP_HOST=<host>
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASS=<pass>
NEWSLETTER_FROM_EMAIL=<from>
```

**`client/.env`**
```bash
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=<key>
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<id>
VITE_FIREBASE_APP_ID=<app-id>
```

### Run

```bash
npm run dev      # starts both frontend (:5173) and backend (:3001)
npm run server   # backend only
npm run client   # frontend only
```

### Seed data

```bash
npm run seed:data     # 3 users, budgets, expenses, snapshots
npm run verify:seed   # smoke-test the seed data
```

---

## Testing

```bash
npm run test --prefix server   # Jest unit + integration
npm run test --prefix client   # Vitest unit
npm run lint --prefix server
npm run lint --prefix client
```

---

## Deployment

### Cloudflare Pages (client)
1. Connect repo → Pages dashboard
2. Root dir: `client` | Build: `npm ci && npm run build` | Output: `dist`
3. Add `VITE_API_URL` (your Render URL) + all `VITE_FIREBASE_*` env vars

### Render (server)
1. Connect repo — Render reads `render.yaml` automatically
2. Add all `server/.env` vars in the Render dashboard (Environment tab)

### Docker
```bash
docker build -t gecko-server .
docker run -p 3001:3001 --env-file server/.env gecko-server
```

---

## A note on naming

Internal localStorage/sessionStorage keys use the `zoar.*` / `zoar:*` prefix — carried over from the original team name. These are implementation details only; the `Profile/index.tsx` logout handler clears storage by this prefix.
