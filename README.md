# Gecko

Gecko is a full-stack personal finance web app aimed at young adults (roughly 20-25). It turns a payslip and day-to-day spending into a clear monthly picture: a budget dashboard, a financial health score, spend forecasting with overspend warnings, receipt scanning, an AI finance assistant, gamified learning (quizzes, XP, levels, streaks, badges), and an opt-in monthly email newsletter.

> **GECKO** stands for **G**oals, **E**arnings, **C**apital, **K**nowledge, **O**utcomes. It was originally built as a university group project by *Team Zoar*; a few internal identifiers (e.g. localStorage key prefixes) still carry the `zoar` namespace.

- **Frontend (Vite dev server):** http://localhost:5173
- **Backend (Express API):** http://localhost:3001
- **API base path:** `/api/v1/*`

---

## Tech stack

**Frontend**
- React 18 + TypeScript
- Vite 5 (dev server + build)
- React Router 6
- Bootstrap 5, `react-icons`
- Recharts (charts), `react-markdown`
- Firebase JS SDK (client-side auth)
- `socket.io-client` (real-time updates)
- Vitest + Testing Library (tests)

**Backend**
- Node.js + Express 4
- MongoDB via Mongoose 8 (MongoDB Atlas)
- Firebase Admin SDK (server-side ID-token verification)
- Socket.io (real-time expense events)
- `node-cron` (scheduled newsletter + monthly snapshot jobs)
- `nodemailer` (newsletter email)
- `multer` (receipt image upload)
- `ml-regression-simple-linear` (spend forecasting)
- `pdfkit` (PDF generation)
- `helmet`, `cors`, `express-validator` (security/validation)
- Jest + Supertest + `mongodb-memory-server` (tests)

**Third-party services / APIs**
- **Firebase Authentication** - user sign-in/sign-up and ID tokens
- **MongoDB Atlas** - primary datastore
- **Groq API** (`openai/gpt-oss-120b`) - in-app AI finance assistant
- **Adzuna Jobs API** - average-salary lookups by job title + location
- **OCR.space API** - receipt scanning / total extraction
- **QuizAPI.io** - dynamic quiz questions (with built-in custom quizzes as fallback)
- **SMTP server** (via nodemailer) - monthly newsletter delivery

---

## Repository layout

```
gecko/
├── package.json            # Root scripts: run both apps, seed, verify
├── requirements.txt        # Human-readable pinned dependency list (source of truth = lockfiles)
├── .gitlab-ci.yml          # CI: lint + build stages
│
├── client/                 # React + TypeScript frontend (Vite)
│   ├── vite.config.ts      # Dev server on :5173, proxies /api -> :3001
│   └── src/
│       ├── App.tsx         # Route table (public + protected routes)
│       ├── MainLayout.tsx  # Shared layout (XP bar, nav)
│       ├── pages/          # Home, Login, Register, Dashboard, Expenses,
│       │                   #   Forecasting, Learn, Quiz, Profile, Settings, etc.
│       ├── components/     # Reusable UI (badges, modals, breakdown panels…)
│       ├── context/        # AuthContext, GamificationContext
│       ├── hooks/          # useSocket, usePageOnboarding, useStreakWarning
│       ├── api/            # API client helpers (auth, forecast, onboarding)
│       └── firebase/       # Client Firebase init + auth helpers
│
└── server/                 # Node + Express backend
    ├── server.js           # Entry point: DB connect, HTTP + Socket.io, cron jobs
    ├── scripts/            # seedData, verifySeedData, clearExpenses, etc.
    └── src/
        ├── app.js          # Express app, middleware, route mounting
        ├── config/         # db (Mongoose), firebase (Admin SDK), multer
        ├── middleware/     # auth (verifies Firebase ID token)
        ├── routes/         # auth, dashboard, expense, payslip, user,
        │                   #   quiz, forecast, snapshot, chat
        ├── controllers/    # expense, payslip, quiz, user
        ├── services/       # forecast, healthScore, dashboardAggregate,
        │                   #   adzunaCalculator, hmrcCalculator, ocr,
        │                   #   newsletter, quiz
        ├── models/         # User, Expense, MonthlyBudget,
        │                   #   MonthlySnapshot, NewsletterSnapshot
        ├── jobs/           # newsletterJob, monthlySnapshotJob (node-cron)
        ├── socket/         # socketHandlers (real-time expense updates)
        └── data/           # customQuizzes (offline quiz content)
```

---

## Architecture overview

- **Auth.** Firebase handles sign-in/sign-up in the browser. The frontend sends the Firebase ID token in the `Authorization` header on every request. The backend `auth` middleware verifies it with the Firebase Admin SDK and attaches the user. The **Firebase UID is used as the MongoDB `_id`** on the `User` document.
- **API.** All feature routes are mounted under `/api/v1/*` in `server/src/app.js` and are protected by the auth middleware (except `/api/v1/auth/...` register and the public newsletter unsubscribe link). In development, Vite proxies `/api` to the backend on port 3001.
- **Real-time.** Socket.io shares the HTTP server port. Creating/updating/deleting expenses emits events so the dashboard updates live.
- **Scheduled jobs.** On startup the server starts cron jobs for the monthly newsletter and monthly snapshot rollups.
- **Forecasting.** `forecastService` uses simple linear regression over spending to project month-end totals and raise overspend warnings (which users can dismiss per month).
- **Health score.** `healthScoreService` produces a 0-100 score weighted across spending-vs-income (40%), budget adherence (35%), and plan alignment (25%).

### Main API routes

| Area | Mount | Notable endpoints |
|------|-------|-------------------|
| Auth | `/api/v1/auth` | `POST /register` |
| Dashboard | `/api/v1/dashboard` | aggregated budget, health score, tips |
| Expenses | `/api/v1/expenses` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /scan` (receipt OCR) |
| Payslip | `/api/v1/payslip` | `POST /`, `GET /`, `PUT /` |
| User | `/api/v1/user` | `/profile`, `/export-data`, `/job-search`, `/location-search`, `/newsletter/*` |
| Quiz | `/api/v1/quiz` | `GET /`, `GET /test`, `POST /complete`, `GET /gamification`, `POST /badge/seen` |
| Forecast | `/api/v1/forecast` | `GET /`, `POST /dismiss` |
| Snapshots | `/api/v1/snapshots` | monthly snapshot history |
| Chat | `/api/v1/chat` | `POST /` (Groq AI finance assistant) |

---

## Prerequisites

- **Node.js 20+** (CI uses `node:20`)
- A **MongoDB** connection string (MongoDB Atlas or local)
- A **Firebase** project (Authentication enabled) with a service-account credential
- API keys for the optional integrations you want to enable (Groq, Adzuna, OCR.space, QuizAPI, SMTP)

> The backend will start without MongoDB, but database-backed features won't work (`db.js` logs a warning and continues so Firebase auth and non-DB routes still respond).

---

## Setup

Clone the repo, then install dependencies for all three packages (root, server, client):

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### Environment variables

Create the following `.env` files (all are git-ignored).

**`server/.env`**

```bash
# Core
PORT=3001
CLIENT_URL=http://localhost:5173
MONGODB_URI=<your MongoDB connection string>

# Firebase Admin SDK (service account)
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_CLIENT_EMAIL=<service-account-email>
# Single-line string; literal \n are converted to newlines at runtime
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI assistant (Groq)
GROQ_API_KEY=<groq-key>

# Salary lookups (Adzuna)
ADZUNA_APP_ID=<adzuna-app-id>
ADZUNA_APP_KEY=<adzuna-app-key>

# Receipt scanning (OCR.space)
OCR_SPACE_API_KEY=<ocr-space-key>

# Quizzes (QuizAPI.io) - falls back to built-in quizzes if unset
QUIZ_API_KEY=<quizapi-key>

# Newsletter email (nodemailer / SMTP)
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-pass>
NEWSLETTER_FROM_EMAIL=<from-address>          # defaults to SMTP_USER
API_URL=http://localhost:3001                  # used to build unsubscribe links

# Newsletter scheduler (optional)
NEWSLETTER_SCHEDULER_ENABLED=true
NEWSLETTER_CRON=<cron expression>
NEWSLETTER_TIMEZONE=Europe/London
```

**`client/.env`**

```bash
# Backend base URL used by the frontend
VITE_API_URL=http://localhost:3001

# Firebase client config
VITE_FIREBASE_API_KEY=<api-key>
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
VITE_FIREBASE_APP_ID=<app-id>

# Optional flags
# VITE_DISABLE_FORECAST=true
```

---

## Running the app

From the repository root, run both the backend and frontend together:

```bash
npm run dev
```

This uses `concurrently` to start:
- the backend (`nodemon server.js`) on **http://localhost:3001**
- the frontend (Vite) on **http://localhost:5173**

To run them individually:

```bash
npm run server   # backend only
npm run client   # frontend only
```

Open **http://localhost:5173** in your browser. New users are routed through payslip setup / onboarding; returning users land on the dashboard.

---

## Seed data

Seed data makes it easy to test the dashboard, budget, expense, and snapshot flows locally. Ensure `MONGODB_URI` is set, then from the repository root:

```bash
npm run seed:data       # seeds users, budgets, expenses, snapshots
npm run verify:seed     # smoke-test that the seed data is present
```

The seed script (`server/scripts/seedData.js`) writes (by default): 3 users, 3 monthly budgets, 24 expenses (8 per user), 3 monthly snapshots, and 3 newsletter snapshots. Re-running for the same user is idempotent (data is replaced, not duplicated).

Optional overrides (bash):

```bash
SEED_USER_ID=seed-user-002 SEED_USER_EMAIL=demo@example.com \
SEED_USER_NAME="Demo User" SEED_MONTH=4 SEED_YEAR=2026 npm run seed:data
```

PowerShell:

```powershell
$env:SEED_USER_ID="seed-user-002"; $env:SEED_USER_EMAIL="demo@example.com"; `
$env:SEED_USER_NAME="Demo User"; $env:SEED_MONTH="4"; $env:SEED_YEAR="2026"; npm run seed:data
```

> To see seeded records in the UI, log in with a Firebase account whose UID matches the seeded `SEED_USER_ID`.

Other helper scripts in `server/scripts/`: `clearExpenses.js`, `clearSnapshots.js`, `getUser.js`, `previewNewsletter.js`.

---

## Testing & linting

**Backend (Jest + Supertest, `mongodb-memory-server`):**

```bash
npm run test --prefix server
npm run lint --prefix server
```

**Frontend (Vitest + Testing Library):**

```bash
npm run test --prefix client          # single run
npm run test:watch --prefix client    # watch mode
npm run lint --prefix client
```

---

## Build

Production build of the frontend:

```bash
npm run build --prefix client     # outputs to client/dist
npm run preview --prefix client   # preview the production build
```

The backend runs in production with:

```bash
npm start --prefix server         # node server.js
```

---

## Dependency pinning

Exact versions are pinned across the three packages. The authoritative source of truth for reproducible installs is the lockfiles:

- `package-lock.json` (root)
- `server/package-lock.json`
- `client/package-lock.json`

`requirements.txt` is a human-readable mirror of those pinned versions.

---

## CI/CD

`.gitlab-ci.yml` defines two stages on a `node:20` image:

1. **lint** - installs deps and runs ESLint for both `server` and `client` (`allow_failure: true`)
2. **build** - builds the client (runs only if lint passes)

There is no deploy stage (the original GitLab environment lacked the runner/SSH permissions for it).

---

## Branch strategy

- Branch off `dev` for every change: `feature/<name>` or `bugfix/<name>`
- Open a PR back into `dev`
- `dev` merges into `main` at sprint close only
