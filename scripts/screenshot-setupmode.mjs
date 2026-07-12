// Screenshots the Model B "Setup mode" dashboard + the go-live stub transition.
// Auth via Clerk sign-in token (ticket flow).
// Env: CLERK_SECRET_KEY, CLERK_USER_ID, APP_URL, CHROME_PATH, OUT_DIR.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const SECRET = process.env.CLERK_SECRET_KEY;
const USER_ID = process.env.CLERK_USER_ID;
const APP = process.env.APP_URL || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const OUT = process.env.OUT_DIR || "screenshots/setupmode";

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

async function clickByText(page, tag, text) {
  return page.evaluate((tag, text) => {
    const el = [...document.querySelectorAll(tag)].find((n) => n.textContent.trim().includes(text));
    if (el) { el.click(); return true; }
    return false;
  }, tag, text);
}

async function shot(page, name, full = false) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log(`  saved ${name}.png`);
}

(async () => {
  const token = await mintTicket();
  console.log("minted sign-in token");
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto(`${APP}/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, { waitUntil: "networkidle2", timeout: 60000 });
  try {
    await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 45000 });
  } catch {
    console.log("  did not reach /dashboard, URL:", page.url());
    await shot(page, "00-signin-debug");
  }
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 20000 }).catch(() => {});
  console.log("on:", page.url());
  await sleep(800);

  // 1: setup-mode dashboard (amber pill + "Add payment & go live" checklist CTA)
  await shot(page, "01-setup-mode", true);

  // 2: click the go-live stub, wait for the refresh to land, re-shoot
  const ok = await clickByText(page, "button", "Add payment");
  console.log("  clicked go-live:", ok);
  await sleep(2500);
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});
  await shot(page, "02-after-golive", true);

  await browser.close();
  console.log("done");
})().catch((e) => { console.error("screenshot error:", e); process.exit(1); });
