// Screenshots the "Choose your live number" provisioning step with a live Twilio
// search (no purchase). Env: CLERK_SECRET_KEY, CLERK_USER_ID, APP_URL, CHROME_PATH, OUT_DIR.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const SECRET = process.env.CLERK_SECRET_KEY;
const USER_ID = process.env.CLERK_USER_ID;
const APP = process.env.APP_URL || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const OUT = process.env.OUT_DIR || "screenshots/choosenumber";
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
  await page.screenshot({ path: `${OUT}/01-choose-number.png`, fullPage: true });
  console.log("saved 01-choose-number.png");

  // Type the area code and search.
  const typed = await page.evaluate((area) => {
    const input = document.querySelector('input[placeholder*="Area code"]');
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, area);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }, AREA);
  console.log("typed area code:", typed);
  await sleep(300);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((n) => n.textContent.trim() === "Search");
    if (b) b.click();
  });
  await sleep(3500); // live Twilio search
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 10000 }).catch(() => {});
  await page.screenshot({ path: `${OUT}/02-search-results.png`, fullPage: true });
  console.log("saved 02-search-results.png");

  await browser.close();
})().catch((e) => { console.error("error:", e); process.exit(1); });
