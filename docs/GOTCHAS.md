# Project Gotchas

Traps, invariants, and non-obvious behaviour. Read before touching a subsystem.

## UI / Tailwind

- **Design tokens:** purples are `purple-50/100/.../700`, gold is `gold` (custom), shadows are `shadow-nav/button/pop/md/lg`. See `client/tailwind.config.js`.
- **UI components** live in `client/src/components/ui/`: Button (CVA), Card, Input, Badge, Skeleton, Progress, Alert. Import via `../../components/ui/button` etc.
- **`cn()` utility:** `client/src/lib/utils.ts` — always use for conditional Tailwind class merging.
- **ConceptLink** renders an inline dotted-underline purple term linking to `/learn/concepts/:slug` with hover tooltip. Import from `client/src/components/ConceptLink.tsx`. Use wherever financial jargon appears.

## Auth / Data model

- **Firebase UID is the Mongo `_id`** on the `User` document. Never add a separate `userId` field.
- **All `/api/v1/*` routes require** `Authorization: Bearer <Firebase-ID-token>` (middleware in `server/src/middleware/auth.js`). Single public route: `GET /api/v1/user/newsletter/unsubscribe`.
- **`localStorage` keys are namespaced `zoar.*` / `zoar:*`** (historical team name). `Profile/index.tsx` clears storage by that prefix on logout. Rename in lockstep if you change keys.

## Server behaviour

- **Server keeps running without Mongo.** `db.js` warns and continues so Firebase auth still works. Surfaces as quiet 5xx on data routes if `MONGODB_URI` is missing.
- **Socket.io shares the HTTP server port** (3001). The Express app holds `io` via `app.set('io', io)`; expense controllers emit from there.
- **Cron jobs start at server boot:** newsletter scheduler in `server.js`, monthly snapshot job side-effect-imported from `app.js`.
- **`render.yaml` must NOT hardcode `PORT`.** Render injects its own port at runtime; hardcoding `PORT=3001` breaks the proxy and returns HTTP 000.

## Features with subtle invariants

- **Forecast warning dismissals are per-month**, stored on `User.forecastWarningState`. Reset when `monthKey` rolls over.
- **Ensemble forecast** in `forecastService.js`: weights are linear 30%, seasonal 20%, rolling median 30%, current trend 20%. Nulls excluded and weights renormalized.
- **Recurring detection** in `recurringService.js`: CV < 0.15 on amounts AND day SD < 5. Minimum 2 consecutive months.
- **Chat history** stored in `ChatSession` (max 40 messages). SSE streaming at `POST /api/v1/chat/stream`. Groq model defaults to `llama-3.1-8b-instant` (override via `GROQ_MODEL` env).
- **Chat agent uses tool-calling:** `server/src/routes/chat.js` runs a multi-round agentic loop (max 3 rounds). Model is `llama-3.3-70b-versatile`. Tool call SSE events: `{ tool: "get_health_score" }`; client shows "Checking your..." indicator.
- **SavingsGoal virtuals:** `progressPct`, `remainingAmount`, `monthsToTarget` — set `toJSON/toObject: { virtuals: true }` when reading.
- **Receipt OCR `/api/v1/expenses/scan`** uses `multer.single('image')` — field name matters.
- **Budget preset rounding:** always `Math.floor` each intermediate slice; last category = `base - sum_of_others`. Never `Math.round` all slices — they can sum past the total due to float accumulation.
- **Expense form defaults:** date = today (`new Date().toISOString().slice(0, 10)`). Enter key submits when amount + category filled. Note hidden behind FileText icon toggle.
- **Onboarding element targeting:** steps use `[data-onboarding="<step-id>"]` selector. Attribute must be on an element always in the DOM (not inside collapsed panels). `TooltipGuide.tsx` tracks via `getBoundingClientRect` + rAF.
- **Forecast warning dismissals** are per-month via `User.forecastWarningState.monthKey`.

## Shared libs

- **UK tax calculator:** `client/src/lib/ukTaxCalc.ts` exports `estimateUKTakeHome(grossAnnual)` and `fmt(n)`. Single source of truth for UK tax rates.
- **Student loan lib is duplicated:** `client/src/lib/studentLoan.ts` (ESM/TS) and `server/src/lib/studentLoan.js` (CJS) must stay in sync. 2024/25 HMRC thresholds. Plan 1/4: 1% interest; Plan 2/postgrad: 7.3%; Plan 5: 4%.

## Financial profile

- **Profile data** (studentLoan, pensionSettings, readinessCheck) stored on User, persisted via `PATCH /api/v1/user/financial-profile`. Dot-notation partial updates — any field subset works.
- **Dashboard journey strip** reads `profile.studentLoan/pensionSettings/readinessCheck` from existing profile fetch. Renders only when: readiness check incomplete OR loan configured OR pension gap exists.
- **Readiness check** at `/check` — 5 questions, score 0-100. Score and answers persisted. No permanent sidebar link; discovered via dashboard CTA only.
- **Year review** at `/year-review` uses `GET /api/v1/snapshots`, filters by UK tax year (Apr 6 - Apr 5), supports year-offset nav.
- **Learning paths progress** uses `zoar.pathProgress.{userId}.{pathSlug}` localStorage key (JSON array of completed moduleIds). Modules unlock sequentially.

## API types

- **`client/src/types/api.ts`** has canonical TS interfaces for all API response shapes. Import from there rather than inlining local types.

## MCP

- **MCP server is standalone:** `server/mcp/gecko-mcp.js` uses `@modelcontextprotocol/sdk` via stdio. Run with `MONGODB_URI=... GECKO_USER_ID=... node server/mcp/gecko-mcp.js`. Does not share the Express HTTP server.

## Known inert bugs

- **`retrieveDashboardData` in `dashboard.js`:** used `user_id` (undefined) instead of `userId` in the Expense aggregate. Only used by the old chat route (now replaced by the agent). Bug is inert but the function still exists.
