// Drives a full real Stripe test checkout: sign in -> click "Add payment & go
// live" -> fill test card 4242 on the hosted page -> submit -> land back on the
// dashboard. The webhook (running via `stripe listen`) then updates the business.
// Env: CLERK_SECRET_KEY, CLERK_USER_ID, APP_URL, CHROME_PATH, OUT_DIR.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const SECRET = process.env.CLERK_SECRET_KEY;
const USER_ID = process.env.CLERK_USER_ID;
const APP = process.env.APP_URL || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const OUT = process.env.OUT_DIR || "screenshots/checkout";

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mintTicket() {
  const res = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: USER_ID }),
  });
  if (!res.ok) throw new Error(`sign_in_tokens ${res.status}: ${await res.text()}`);
  return (await res.json()).token;
}

async function typeInto(page, selectors, value) {
  for (const sel of selectors) {
    const el = await page.$(sel);
    if (el) { await el.click({ clickCount: 3 }).catch(() => {}); await el.type(value, { delay: 40 }); return true; }
  }
  console.log("  (no field for", selectors[0], ")");
  return false;
}

(async () => {
  const token = await mintTicket();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  await page.goto(`${APP}/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 45000 }).catch(() => {});
  await sleep(800);

  // Click the go-live CTA (full navigation to Stripe).
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((n) => n.textContent.includes("Add payment"));
    if (b) { b.click(); return true; }
    return false;
  });
  console.log("clicked CTA:", clicked);
  await page.waitForFunction(() => location.host.includes("checkout.stripe.com"), { timeout: 30000 });
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 20000 }).catch(() => {});
  await sleep(1500);
  console.log("on stripe:", page.url().slice(0, 60));

  // Fill the card. On checkout.stripe.com these are native inputs (no iframe).
  await typeInto(page, ['input[name="cardNumber"]', "#cardNumber"], "4242424242424242");
  await typeInto(page, ['input[name="cardExpiry"]', "#cardExpiry"], "12 / 34");
  await typeInto(page, ['input[name="cardCvc"]', "#cardCvc"], "123");
  await typeInto(page, ['input[name="billingName"]', "#billingName"], "Jordan Blake");
  await typeInto(page, ['input[name="billingPostalCode"]', "#billingPostalCode"], "78701");
  // Uncheck "Save my information for faster checkout" (Link) — otherwise Stripe
  // requires a phone + OTP we can't automate.
  await page.evaluate(() => {
    [...document.querySelectorAll('input[type="checkbox"]')].filter((c) => c.checked).forEach((c) => c.click());
  });
  await sleep(700);
  await page.screenshot({ path: `${OUT}/02-card-filled.png` });

  // Submit.
  const submitted = await page.evaluate(() => {
    const b = document.querySelector('button[type="submit"], .SubmitButton');
    if (b) { b.click(); return true; }
    return false;
  });
  console.log("submitted:", submitted);

  // Wait to land back on the app dashboard.
  try {
    await page.waitForFunction(() => location.host.includes("localhost") && location.pathname.startsWith("/dashboard"), { timeout: 60000 });
    console.log("redirected back to:", page.url());
  } catch {
    console.log("did NOT redirect back; still on:", page.url().slice(0, 80));
    await page.screenshot({ path: `${OUT}/03-stuck.png`, fullPage: true });
  }
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 }).catch(() => {});
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/04-after-payment.png`, fullPage: true });
  console.log("done");
  await browser.close();
})().catch((e) => { console.error("error:", e); process.exit(1); });
