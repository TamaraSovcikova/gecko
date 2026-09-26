# Gecko - Feature Master Plan

Prioritised list of features to implement to maximise CV impact. Ordered by bang-for-buck: how impressive it is on a CV vs. how long it takes to build.

---

## Tier 1 - High impact, moderate effort (do these first)

### 1. GitHub Actions CI/CD pipeline

**Why it's impressive:** Shows you understand the full delivery lifecycle, not just writing code. Automated deploy on push to `main` is table stakes for any engineering role.

**What to build:**
- `.github/workflows/ci.yml`: lint + test on every PR (both `server` and `client`)
- `.github/workflows/deploy.yml`: on merge to `main`, trigger Cloudflare Pages build and Render deploy via their respective deploy hooks
- Status badge in README

**Effort:** 1-2 days. The hardest part is setting up secrets; the workflow YAML itself is straightforward.

**CV line:** "Set up GitHub Actions CI/CD pipeline: automated lint, Jest/Vitest test runs on every PR, and deploy-on-merge to Cloudflare Pages and Render."

---

### 2. Expand test coverage to 80%+

**Why it's impressive:** Almost every job description asks for it. Right now there are 6 unit tests and 4 integration suites - enough to show you know testing exists, but not enough to claim strong coverage.

**What to build:**
- Client: Vitest tests for `ukTaxCalc.ts`, `studentLoan.ts`, `forecastService`, `healthScoreService`
- Server: unit tests for `forecastService.js`, `healthScoreService.js`, `hmrcCalculator.js`, `newsletterService.js`
- Integration: one test per new feature (loans, pension, readiness check, savings goals)
- Add a coverage report step to CI (Jest `--coverage`, Vitest `--coverage`)

**Effort:** 3-5 days.

**CV line:** "Achieved 80%+ test coverage across backend services and client utilities; integrated coverage reporting into CI."

---

### 3. OpenAPI / Swagger documentation

**Why it's impressive:** Shows you write production-quality APIs and care about developer experience. Interviewers from API-heavy companies will notice.

**What to build:**
- `swagger-jsdoc` + `swagger-ui-express` on the server
- Annotate all 30+ routes with `@openapi` JSDoc comments
- Expose `/api/docs` endpoint (publicly accessible, no auth)
- Link in README

**Effort:** 2-3 days.

**CV line:** "Documented 30+ REST endpoints with OpenAPI 3.0 annotations; interactive Swagger UI accessible at `/api/docs`."

---

### 4. Progressive Web App (PWA)

**Why it's impressive:** Turns the app into something users can install on their phone. Strong for fintech roles where mobile adoption matters.

**What to build:**
- `vite-plugin-pwa` - generates service worker and web manifest
- Offline fallback page
- Add `manifest.webmanifest` with icons (reuse existing gecko logo)
- Install prompt handling

**Effort:** 1 day.

**CV line:** "Implemented PWA with offline support using Workbox service worker and a Vite PWA plugin; installable on iOS and Android."

---

### 5. Rate limiting + security hardening

**Why it's impressive:** Fintech apps handling financial data need to show security awareness. This is a gap right now.

**What to build:**
- `express-rate-limit` on auth routes (5 attempts / 15 min)
- `helmet` is already included - verify all headers are set correctly
- Input sanitisation with `express-validator` (already pulled in - check all routes use it)
- CORS whitelist (only allow the CF Pages domain)
- Add a security section to README

**Effort:** 1 day.

**CV line:** "Hardened API security: rate limiting on auth endpoints, CORS whitelist, CSP headers via Helmet, and input validation on all POST routes."

---

## Tier 2 - Significant impact, higher effort (do once Tier 1 is done)

### 6. Data export to CSV/PDF

**Why it's impressive:** Real user value; shows you can build end-to-end features rather than just dashboards.

**What to build:**
- `GET /api/v1/expenses/export?format=csv` and `?format=pdf`
- CSV: use Node's built-in string building or `json2csv`
- PDF: use `pdfkit` (already a dependency) to render a formatted financial summary
- Export button in the Expenses and Year Review pages

**Effort:** 2 days.

**CV line:** "Built data export feature generating formatted PDF financial summaries and CSV expense logs via pdfkit and a streaming Express endpoint."

---

### 7. Open Banking API integration (mock or sandbox)

**Why it's impressive:** A significant differentiator for fintech roles. Even a sandbox integration demonstrates understanding of the domain.

**What to build:**
- Integrate with Plaid sandbox or Truelayer sandbox (free dev accounts)
- Fetch mock bank transactions and auto-categorise them as expenses
- Show a "connected account" indicator on the dashboard
- Fall back gracefully if not connected

**Effort:** 3-5 days.

**CV line:** "Integrated Plaid/Truelayer sandbox API for automatic transaction import and expense auto-categorisation."

---

### 8. Advanced analytics page

**Why it's impressive:** Shows data visualisation depth beyond pie charts.

**What to build:**
- Month-over-month spend trend (area chart, 12-month view)
- Category breakdown over time (stacked bar)
- Net savings rate chart (income minus spend, monthly)
- "Spending anomaly" detection - flag months where a category spikes more than 2 standard deviations
- D3.js for the anomaly chart (shows JS data viz competency beyond Recharts)

**Effort:** 3-4 days.

**CV line:** "Built an analytics dashboard with month-over-month trend analysis, category breakdown charts, and statistical anomaly detection for unusual spend spikes."

---

### 9. Email verification + account security improvements

**Why it's impressive:** Production-grade auth is expected for any app handling financial data.

**What to build:**
- Firebase email verification on register (already supported by Firebase SDK - just not enforced)
- Block login until email is verified
- "Resend verification email" button
- Login activity log (last 5 login timestamps stored on User model)

**Effort:** 1-2 days.

---

### 10. Accessibility audit + WCAG 2.1 AA compliance

**Why it's impressive:** Required for public-sector and regulated-industry roles; shows awareness beyond functionality.

**What to build:**
- Run `axe-core` against all major pages (can be done via a Vitest/Playwright test)
- Fix any contrast failures (Tailwind color token audit)
- Add `aria-label` to icon-only buttons
- Keyboard-navigable modals and dropdowns (Radix UI handles most of this - verify)
- Document compliance in README

**Effort:** 2 days.

---

## Tier 3 - Impressive but complex (longer-term)

### 11. WebSocket-backed collaborative budgeting

Allow a partner or flatmate to share a budget, with live updates when either person logs an expense. Requires:
- Shared budget model (many-to-many users)
- Socket.io rooms per shared budget
- Invite link system

**Effort:** 1 week+. Significant architectural change.

---

### 12. Machine learning spend classifier

Replace manual expense categorisation with an ML model that categorises expenses by description.

- Train a text classifier on a public dataset (e.g., UK bank statement descriptions)
- Deploy as a serverless function (Cloudflare Worker) that the expense form calls
- Fall back to manual if confidence < threshold

**Effort:** 1 week. Requires ML knowledge.

---

### 13. Internationalisation (i18n)

Support for multiple currencies and non-UK tax systems.

- `react-i18next` for UI strings
- Currency conversion via Open Exchange Rates API
- Alternative tax calculator for Republic of Ireland (similar PAYE system)

**Effort:** 3-5 days for i18n scaffolding; much more for actual translations.

---

## Implementation order recommendation

If you want to maximise CV impact in the shortest time:

```
Week 1:  GitHub Actions CI/CD (#1) + Security hardening (#5)
Week 2:  OpenAPI docs (#3) + PWA (#4)
Week 3:  Expand test coverage (#2)
Week 4:  Data export PDF/CSV (#6)
Month 2: Advanced analytics (#8) + Open Banking sandbox (#7)
```

At the end of Week 2 you can already add "CI/CD pipeline, OpenAPI docs, PWA, and security hardening" to the CV. These are all visible, linkable, and quick to verify.

---

## Features that are already impressive (don't undersell)

These are already in the app and worth highlighting - don't assume they're ordinary:

- **Tool-calling AI agent** - multi-round agentic loop, not just a chatbot
- **Ensemble forecasting** - four-model weighted average, not naive linear regression
- **MCP server** - ahead of the curve; most candidates have never built one
- **HMRC tax calculator** - legally accurate for 2024/25, not an approximation
- **Student loan projections** - Plan 1/2/4/5/postgrad, compound interest, pension gap
- **Socket.io real-time dashboard** - sub-5-second latency, room-scoped events
- **Receipt OCR → expense pre-fill** - end-to-end pipeline, not just an API call
