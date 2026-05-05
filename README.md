# Zoar

A university project - a full-stack personal finance web application built with Node.js, Express, MongoDB, Firebase, React 18, and TypeScript.

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## Branch Strategy

- Branch off dev for every feature: feature/name or bugfix/name
- Open a PR back into dev
- dev merges into main at sprint close only

---

## Dependency Pinning

- Dependency versions are pinned in `requirements.txt`.
- Reproducible installs are enforced through lockfiles:
	- `package-lock.json`
	- `server/package-lock.json`
	- `client/package-lock.json`

## Seed Data

Seed data now exists for easier local testing of dashboard, budget, expense, and snapshot flows.

1. Ensure `MONGODB_URI` is set in your environment.
2. Run from repository root:

```bash
npm run seed:data
```

3. Run smoke verification from repository root:

```bash
npm run verify:seed
```

Optional overrides:

```bash
SEED_USER_ID=seed-user-002 SEED_USER_EMAIL=demo@example.com SEED_USER_NAME="Demo User" SEED_MONTH=4 SEED_YEAR=2026 npm run seed:data
```

PowerShell overrides (Windows):

```powershell
$env:SEED_USER_ID="seed-user-002"; $env:SEED_USER_EMAIL="demo@example.com"; $env:SEED_USER_NAME="Demo User"; $env:SEED_MONTH="4"; $env:SEED_YEAR="2026"; npm run seed:data
```

PowerShell verification (Windows):

```powershell
npm run verify:seed
```

Optional single-user verification:

```powershell
$env:SEED_USER_ID="seed-user-002"; npm run verify:seed
```

The seed script lives in `server/scripts/seedData.js` and writes:

- 3 users (default)
- 3 monthly budgets
- 24 expenses total (8 per user)
- 3 monthly snapshots
- 3 newsletter snapshots

## Validation Checklist (Definition of Done)

1. Dependency pinning file exists and is up to date:
	- `requirements.txt`
2. Lockfiles exist for reproducible installs:
	- `package-lock.json`
	- `server/package-lock.json`
	- `client/package-lock.json`
3. Seed script runs without error using `MONGODB_URI`:
	- `npm run seed:data`
4. Smoke verification passes:
	- `npm run verify:seed`
5. Database contains seeded data for target user:
	- User + MonthlyBudget + Expenses + MonthlySnapshot + NewsletterSnapshot
6. Re-running seed for same user is idempotent:
	- Data is replaced/updated, not duplicated
7. App login account matches seeded `SEED_USER_ID` (Firebase UID), so seeded records appear in UI.
