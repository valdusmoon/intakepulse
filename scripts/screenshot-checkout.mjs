// Verifies the go-live CTA creates a real Stripe Checkout session and hands off.
// Signs in via Clerk ticket, calls /api/stripe/checkout from the page context,
// then navigates to the returned Stripe URL and screenshots it.
// Env: CLERK_SECRET_KEY, CLERK_USER_ID, STRIPE_SECRET_KEY, APP_URL, CHROME_PATH, OUT_DIR.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const SECRET = process.env.CLERK_SECRET_KEY;
const USER_ID = process.env.CLERK_USER_ID;
const STRIPE = process.env.STRIPE_SECRET_KEY;
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

(async () => {
  const token = await mintTicket();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(`${APP}/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 45000 }).catch(() => {});
  await sleep(800);

  // Call the checkout route from the authenticated page context.
  const result = await page.evaluate(async () => {
    const r = await fetch("/api/stripe/checkout", { method: "POST" });
    let j = {};
    try { j = await r.json(); } catch {}
    return { status: r.status, url: j.url, error: j.error };
  });
  console.log("checkout route:", JSON.stringify(result));

  if (!result.url || !result.url.includes("checkout.stripe.com")) {
    console.error("NO valid Stripe URL returned");
    await browser.close();
    process.exit(2);
  }

  // Pull the session id from the URL and confirm details via the Stripe API.
  const m = result.url.match(/cs_test_[A-Za-z0-9]+/) || result.url.match(/cs_live_[A-Za-z0-9]+/);
  if (m && STRIPE) {
    const sid = m[0].split("#")[0];
    const sres = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sid}?expand[]=line_items`, {
      headers: { Authorization: `Bearer ${STRIPE}` },
    });
    const s = await sres.json();
    console.log("session:", JSON.stringify({
      id: s.id, mode: s.mode, status: s.status,
      amount_total: s.amount_total, currency: s.currency,
      trial: s.subscription_data?.trial_period_days,
      line0: s.line_items?.data?.[0] && {
        desc: s.line_items.data[0].description,
        amount: s.line_items.data[0].amount_total,
        price: s.line_items.data[0].price?.id,
        recurring: s.line_items.data[0].price?.recurring,
      },
      metadata: s.metadata,
    }, null, 2));
  }

  // Navigate to the hosted page and screenshot it.
  await page.goto(result.url, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/01-stripe-checkout.png`, fullPage: true });
  console.log("saved 01-stripe-checkout.png; final URL:", page.url());

  await browser.close();
})().catch((e) => { console.error("error:", e); process.exit(1); });
