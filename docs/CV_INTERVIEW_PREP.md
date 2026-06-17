# Gecko — CV Section & Interview Prep

This document contains ready-to-use CV bullet points, talking points for technical interviews, and supporting evidence from the project report.

---

## CV Bullet Points (pick 3–5)

These are ordered from most impactful to most detail-heavy. Mix and match based on the role.

---

### Option A — Project lead + full-stack focus (recommended for software engineering roles)

> **GECKO Personal Finance App** | React 18 · TypeScript · Node.js · MongoDB · Firebase · Socket.io · Groq LLM
>
> - Led a 6-person Agile team as Scrum Master and Backend Tech Lead across 6 sprints; owned sprint planning, backlog refinement, QA rotation, and merge governance for a web app targeting 35% of young adults who report daily financial stress (Santander UK research cited in project brief).
> - Architected and delivered the real-time expense dashboard (Socket.io), HMRC tax calculator (2024/25 thresholds), ensemble spend forecasting (4-model weighted average), and receipt OCR pipeline (OCR.space API), coordinating cross-branch merges and resolving integration bugs post-merge.
> - Built a tool-calling AI finance assistant using Groq (`llama-3.3-70b-versatile`) with a multi-round agentic loop over 6 live data endpoints (health score, budget, expenses, forecast, salary benchmark, savings); extended post-project with a student loan tracker, pension optimizer, and MCP server for AI integrations.
> - Integrated 7 external APIs (Firebase, MongoDB Atlas, Groq, Adzuna, OCR.space, QuizAPI.io, SMTP), enforced Firebase JWT authentication on all routes, and deployed the app to Cloudflare Pages (client) and Render (server) with a committed `render.yaml` and SPA `_redirects` config.
> - Wrote the team's Testing Framework (unit, integration, and UAT approach), produced the UAT Test Manual used for inter-team testing, and fixed failing integration test suites post-merge, using Jest + `mongodb-memory-server` and Vitest + Testing Library.

---

### Option B — Concise (one-liner per bullet, good for space-constrained CVs)

> **GECKO Personal Finance App** | Surrey COM2042 · 2025–26 · React/TypeScript · Node.js · MongoDB
>
> - Scrum Master and Backend Lead in a 6-person team; managed sprint cycles, backlog ownership, and QA rotation across the full project lifecycle.
> - Delivered real-time expense tracking (Socket.io), HMRC tax calculation, ensemble spend forecasting, receipt OCR, and an Adzuna salary-benchmark integration end-to-end.
> - Built a Groq-powered AI finance agent with tool-calling over live user data; extended post-project with student loan, pension, and financial readiness modules.
> - Deployed to Cloudflare Pages + Render with Firebase JWT auth on all API routes; 6 unit and 4 integration test suites using Jest and Vitest.

---

### Option C — Leadership-heavy (for PM or team-lead roles)

> **GECKO Personal Finance App** | Scrum Master · Backend Lead · QA Lead (Rotation II)
>
> - Directed a 6-person cross-functional team through 6 Agile sprints as Scrum Master and technical lead; defined the MVP scope, authored the MVP Definition Document, and ran sprint ceremonies, preventing scope creep on a fixed-timeline university module.
> - Authored the team's Testing Framework and UAT Test Manual, ran inter-team peer-testing (evaluated 2 external teams' codebases), and oversaw QA across two testing rotation cycles.
> - Presented GECKO to industry judges at the Surrey Green Tech Jam demo; one of 6 finalist teams selected to present from the cohort.
> - Identified and resolved 4 critical post-merge bugs in auth, payslip, real-time, and forecasting subsystems, maintaining a stable `dev` branch throughout the group phase.

---

## Stats & evidence to use in interviews

Pull these numbers when asked "tell me about a time you…" questions.

| Claim | Evidence |
|-------|---------|
| 6-person team | ICR: "Aaliyah, Rhea, Tamara, Tom, Yasmine, Zoe" |
| 6 Agile sprints | Jira SCRUM ticket numbers reach SCRUM-349+ across sprint history |
| 40+ Jira tickets owned | ICR sections 1–6 list 40+ tickets by ID (SCRUM-118, 132, 152, 156, 157, 165, 184-187, 197, 201, 203, 205-208, 213, 214-220, 244-245, 248, 253, 259, 268, 278, 282, 285, 288, 306, 349…) |
| 7 external API integrations | Firebase, MongoDB Atlas, Groq, Adzuna, OCR.space, QuizAPI.io, SMTP |
| Business problem context | 35% of young adults experience daily financial stress (Santander UK); 45% never engaged with existing platforms |
| Presenter at judges | Project report confirms presentation at Surrey demo event |
| HMRC accuracy | Uses 2024/25 income tax bands and NI thresholds from HMRC; compared against gov.uk tax calculator |
| Real-time latency target | UAT pass criteria: updates within 5 seconds, no missed events |
| Forecast ensemble | 4 models: linear regression (30%), seasonal (20%), rolling median (30%), current trend (20%) |
| Health score algorithm | Weighted formula: spending vs. income (40%), budget adherence (35%), plan alignment (25%) |
| Test suites | 6 unit test files, 4 integration test suites using `mongodb-memory-server` |

---

## Technical interview Q&A

### "Walk me through the architecture."

> The app is a React 18 + TypeScript SPA on the frontend, served by Vite in dev and Cloudflare Pages in production. The backend is Express 4 on Node.js, using MongoDB Atlas as the primary store. Firebase handles authentication — the client SDK signs users in and gets a JWT; every API request sends that token in an Authorization header, and the Express auth middleware verifies it with the Firebase Admin SDK. Because Firebase issues the UID, we use it as the MongoDB `_id` on the User document — one identity, two systems, no join.
>
> Real-time updates use Socket.io sharing the Express HTTP server port. When an expense is saved, the controller calls `io.to(userId).emit('budgetUpdate')` and the dashboard React hook re-fetches. The chat route is different — it runs a multi-round agentic loop with Groq, calling up to 3 rounds of tool calls before it opens an SSE stream back to the client.

### "Why Socket.io instead of polling?"

> The UAT pass criterion was updates within 5 seconds with no duplicates. Polling at 5s would mean up to 5s lag regardless of when the expense lands, plus N×connections instead of one persistent socket per user. Socket.io also supports rooms (`io.to(userId)`) so only the relevant user's session gets the event. The trade-off is that the server is stateful — a problem at scale, which is why the long-term plan includes a Redis pub-sub adapter.

### "How does the forecasting model work?"

> It's an ensemble of four independent projections: simple linear regression over the monthly totals, a seasonal model that uses the same calendar month from prior years, a rolling median over the last 3 months, and a current-month trend extrapolation. The four results are averaged with weights (30/20/30/20), but any null prediction is excluded and the remaining weights are renormalized. That way if a user only has 2 months of data, we still get a meaningful forecast rather than a garbage output.

### "Tell me about a technical challenge you solved."

> The trickiest issue was post-merge auth. After merging Rhea's account-settings feature cluster (5 branches) into `dev`, the Firebase ID token verification started silently returning 503 on some routes. The root cause was that the auth middleware imported `admin` from `../../config/firebase`, but the integration tests were mocking `firebase-admin` directly — the real module was being partially initialised. I rewrote the mocks to stub `../../src/config/firebase` instead of the package itself, and added a null-guard in the middleware (`if (!admin) return res.status(503)...`). This fixed both the tests and the intermittent production symptom.

### "How did you manage the team?"

> I ran two-week sprints using Jira — epics per feature, sub-tasks per layer (backend, frontend, tests, docs). Before each sprint I did a dependency mapping to avoid two people blocking each other: for example, the quiz gamification feature depended on the quiz API being stable, so I marked quiz as a prerequisite and scheduled it one sprint ahead. I also owned merge governance — no direct pushes to `dev`, all merges via PR, and I ran the merge myself for complex feature pairs to handle conflicts. When conflicts did appear (especially in `app.js` route mounting), I resolved them and notified the affected developer rather than silently breaking their tests.

---

## Features to highlight per role type

| Role | Lead with |
|------|-----------|
| Full-stack engineer | Real-time Socket.io, ensemble forecasting, MCP server, agentic AI loop |
| Backend engineer | HMRC calculator, Firebase JWT auth middleware, MongoDB aggregation pipeline, cron jobs |
| Frontend engineer | TypeScript migration, Recharts dashboards, React context, Tailwind design system |
| Product/PM role | Scrum Master experience, UAT ownership, feature prioritisation, scope management |
| Fintech role | HMRC accuracy, student loan Plan 1/2/4/5, pension optimizer, Adzuna salary benchmark |
| AI/ML role | Groq tool-calling agent, multi-round agentic loop, ensemble forecast, MCP server |
