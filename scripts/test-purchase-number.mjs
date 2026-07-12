// Drives a REAL Twilio purchase via the ChooseNumber UI: sign in -> search area
// code -> click "Get this number" on the first result -> wait for the dashboard
// to advance. Env: CLERK_SECRET_KEY, CLERK_USER_ID, APP_URL, CHROME_PATH, OUT_DIR, AREA_CODE.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const SECRET = process.env.CLERK_SECRET_KEY;
const USER_ID = process.env.CLERK_USER_ID;
const APP = process.env.APP_URL || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const OUT = process.env.OUT_DIR || "screenshots/purchase";
const AREA = process.env.AREA_CODE || "737";

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
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1000"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
  await page.goto(`${APP}/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 45000 }).catch(() => {});
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});
  await sleep(800);

  // Search.
  await page.evaluate((area) => {
    const input = document.querySelector('input[placeholder*="Area code"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, area);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Search")?.click();
  }, AREA);
  await sleep(3500);
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 10000 }).catch(() => {});

  // Grab the first offered number (for logging), then buy it.
  const firstNum = await page.evaluate(() => {
    const el = document.querySelector('.font-cv-mono');
    return el ? el.textContent.trim() : null;
  });
  console.log("buying first result:", firstNum);
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Get this number");
    if (b) { b.click(); return true; }
    return false;
  });
  console.log("clicked Get this number:", clicked);

  // Wait for the number to attach: the ChooseNumber card disappears (dashboard advances).
  try {
    await page.waitForFunction(() => !document.body.textContent.includes("Choose your live number"), { timeout: 30000 });
    console.log("dashboard advanced (number attached)");
  } catch {
    console.log("still on ChooseNumber after buy");
  }
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 10000 }).catch(() => {});
  await sleep(1000);
  await page.screenshot({ path: `${OUT}/01-after-purchase.png`, fullPage: true });
  console.log("saved 01-after-purchase.png");
  await browser.close();
})().catch((e) => { console.error("error:", e); process.exit(1); });
