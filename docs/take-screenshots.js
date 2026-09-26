/**
 * Screenshot automation for Gecko README.
 *
 * Prerequisites:
 *   npm install -g playwright
 *   npx playwright install chromium
 *
 * Usage (with dev server running on :5173):
 *   node docs/take-screenshots.js
 *
 * Outputs screenshots/ at the repo root.
 * You will need to be logged in as a seeded user OR update EMAIL/PASSWORD below.
 */

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL = "http://localhost:5173";
const OUT_DIR = path.join(__dirname, "..", "screenshots");

// Update these to a valid test account (seed data user or real account)
const EMAIL = "seed@example.com";
const PASSWORD = "password123";

const VIEWPORT = { width: 1280, height: 800 };

async function shot(page, name) {
  const filePath = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  // ── Public pages ────────────────────────────────────────────────────────────
  console.log("\nPublic pages");
  await page.goto(`${BASE_URL}/`);
  await page.waitForLoadState("networkidle");
  await shot(page, "home");

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");
  await shot(page, "login");

  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState("networkidle");
  await shot(page, "register");

  // ── Log in ───────────────────────────────────────────────────────────────────
  console.log("\nLogging in...");
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  const emailInput = page.getByPlaceholder(/email/i).first();
  const passwordInput = page.getByPlaceholder(/password/i).first();
  if (await emailInput.isVisible()) {
    await emailInput.fill(EMAIL);
    await passwordInput.fill(PASSWORD);
    const submitBtn = page.getByRole("button", { name: /sign in|log in/i });
    await submitBtn.click();
    await page.waitForURL(/\/(dashboard|payslip)/, { timeout: 15000 });
    console.log("  ✓ logged in");
  } else {
    console.warn("  ! could not find login form - skipping authenticated pages");
    await browser.close();
    return;
  }

  // ── Authenticated pages ───────────────────────────────────────────────────────
  console.log("\nAuthenticated pages");

  const AUTH_PAGES = [
    { path: "/dashboard", name: "dashboard", waitFor: ".recharts-wrapper, [class*='pie']", delay: 2000 },
    { path: "/expenses", name: "expenses", delay: 1500 },
    { path: "/forecast", name: "forecast", delay: 2000 },
    { path: "/learn", name: "learn", delay: 1000 },
    { path: "/quiz", name: "quiz", delay: 1500 },
    { path: "/profile", name: "profile", delay: 1000 },
    { path: "/loans", name: "loans", delay: 1000 },
    { path: "/pension", name: "pension", delay: 1000 },
    { path: "/savings", name: "savings", delay: 1000 },
    { path: "/bills", name: "bills", delay: 1000 },
    { path: "/scenarios", name: "scenarios", delay: 1000 },
    { path: "/check", name: "readiness-check", delay: 1000 },
    { path: "/year-review", name: "year-review", delay: 2000 },
    { path: "/settings", name: "settings", delay: 1000 },
  ];

  for (const { path: pagePath, name, waitFor, delay } of AUTH_PAGES) {
    try {
      await page.goto(`${BASE_URL}${pagePath}`);
      await page.waitForLoadState("networkidle");
      if (waitFor) {
        await page.waitForSelector(waitFor, { timeout: 5000 }).catch(() => {});
      }
      if (delay) await page.waitForTimeout(delay);
      await shot(page, name);
    } catch (err) {
      console.warn(`  ! failed ${name}: ${err.message}`);
    }
  }

  // ── Dashboard sub-features ────────────────────────────────────────────────────
  console.log("\nDashboard sub-features");

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Health score panel
  const healthBtn = page.getByText(/health score|score breakdown/i).first();
  if (await healthBtn.isVisible()) {
    await healthBtn.click();
    await page.waitForTimeout(1000);
    await shot(page, "health-score");
  }

  // Chat panel
  const chatBtn = page.getByText(/ask gecko|ai assistant|chat/i).first();
  if (await chatBtn.isVisible()) {
    await chatBtn.click();
    await page.waitForTimeout(500);
    await shot(page, "chat");
  }

  // Scanner
  await page.goto(`${BASE_URL}/expenses`);
  await page.waitForLoadState("networkidle");
  const scanBtn = page.getByText(/scan receipt|ocr/i).first();
  if (await scanBtn.isVisible()) {
    await scanBtn.click();
    await page.waitForTimeout(500);
    await shot(page, "scanner");
  }

  await browser.close();
  console.log(`\nDone - screenshots saved to screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
