// End-to-end smoke test against a running stack:  pnpm e2e
//   BASE_URL=http://localhost:3010  ADMIN_EMAIL=...  ADMIN_PASSWORD=...  pnpm e2e
// Needs a seeded database (pnpm db:seed) and Chromium (npx playwright install chromium).
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3010";
const ADMIN = { email: process.env.ADMIN_EMAIL ?? "admin@xadboom.local", password: process.env.ADMIN_PASSWORD ?? "change-me-now" };

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
};

const browser = await chromium.launch();
const errors = [];
const watch = (page) => {
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => r.status() >= 500 && errors.push(`${r.status()} ${r.url()}`));
};

// ── public storefront ──
{
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  watch(page);
  for (const path of ["/", "/catalog", "/designers", "/contact", "/product/lumen-void-lounge-chair"]) {
    const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
    check(`GET ${path}`, res?.status() === 200);
  }
  const res = await page.goto(BASE + "/product/does-not-exist");
  check("unknown product is a 404", res?.status() === 404);

  // anonymous visitors cannot reach the admin
  await page.goto(BASE + "/admin/pieces", { waitUntil: "networkidle" });
  check("admin requires sign-in", new URL(page.url()).pathname === "/login");

  // reserve -> checkout (guest) -> order page
  await page.goto(BASE + "/product/primary-form-low-table", { waitUntil: "networkidle" });
  await page.click('button:has-text("ACQUIRE PIECE")');
  await page.waitForSelector('[role="dialog"]');
  check("bag opens with a 15-minute lock", /LOCK ACTIVE/i.test(await page.textContent('[role="dialog"]')));
  await page.click('a:has-text("Proceed to allocation checkout")');
  await page.waitForSelector("#name");
  await page.fill("#name", "Smoke Test");
  await page.fill("#email", `smoke${Date.now()}@example.com`);
  await page.fill("#country", "Switzerland");
  await page.fill("#city", "Zurich");
  await page.fill("#address", "Test street 1");
  await Promise.all([page.waitForURL(/\/order\/XB-DISPATCH-/), page.click('button[type="submit"]')]);
  check("order page shown after checkout", /Allocation received|Acquisition/i.test(await page.textContent("main")));
  await ctx.close();
}

// ── admin ──
{
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', ADMIN.email);
  await page.fill('input[name="password"]', ADMIN.password);
  await Promise.all([page.waitForURL(/\/admin/), page.click('button[type="submit"]')]);
  for (const path of ["/admin", "/admin/pieces", "/admin/pieces/new", "/admin/orders", "/admin/inquiries", "/admin/designers", "/admin/categories", "/admin/users", "/admin/settings"]) {
    const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
    check(`admin ${path}`, res?.status() === 200);
  }
  await ctx.close();
}

await browser.close();
check("no browser errors or 5xx responses", errors.length === 0, errors.join(" | "));
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
