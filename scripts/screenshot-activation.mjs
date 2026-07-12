// Headless-Chrome screenshots of the zero-state activation UI (tour, checklist,
// example lead, go-live modal, save-flow). Authenticates via a Clerk sign-in
// token (ticket flow). Requires env: CLERK_SECRET_KEY, CLERK_USER_ID, APP_URL,
// CHROME_PATH, OUT_DIR.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const SECRET = process.env.CLERK_SECRET_KEY;
const USER_ID = process.env.CLERK_USER_ID;
const APP = process.env.APP_URL || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const OUT = process.env.OUT_DIR || "screenshots/activation";

mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mintTicket() {
  const res = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: USER_ID }),
  });
  if (!res.ok) throw new Error(`sign_in_tokens ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.token;
}

async function clickByText(page, tag, text) {
  return page.evaluate(
    (tag, text) => {
      const el = [...document.querySelectorAll(tag)].find((n) => n.textContent.trim().includes(text));
      if (el) { el.click(); return true; }
      return false;
    },
    tag,
    text
  );
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

  console.log("signing in via ticket...");
  await page.goto(`${APP}/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, { waitUntil: "networkidle2", timeout: 60000 });
  try {
    await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 45000 });
  } catch {
    console.log("  did not reach /dashboard, current URL:", page.url());
    await shot(page, "00-signin-debug");
  }
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 20000 }).catch(() => {});
  console.log("on:", page.url());

  // 1-4: guided tour steps (auto-opens ~450ms after load)
  await sleep(1600);
  await shot(page, "01-tour-step1-welcome");
  for (const [i, name] of [[2, "02-tour-step2-checklist"], [3, "03-tour-step3-example"], [4, "04-tour-step4-metrics"]]) {
    const ok = await clickByText(page, "button", "Next");
    await sleep(750);
    if (ok) await shot(page, name);
    else console.log(`  (Next not found for step ${i})`);
  }

  // Finish/dismiss the tour
  await clickByText(page, "button", "Got it");
  await page.evaluate(() => { try { localStorage.setItem("cv_dashboard_tour_done", "1"); } catch {} });
  await sleep(500);

  // 5: full zero-state (checklist + metrics + example lead), no tour overlay
  await shot(page, "05-zerostate-full", true);

  // 6: example lead expanded explainer
  const exOk = await page.evaluate(() => {
    const host = document.getElementById("cv-tour-example");
    const btn = host && host.querySelector("button");
    if (btn) { btn.scrollIntoView({ block: "center" }); btn.click(); return true; }
    return false;
  });
  await sleep(500);
  if (exOk) await shot(page, "06-example-lead"); else console.log("  (example lead not found)");

  // 7: go-live modal
  const glOk = await clickByText(page, "button", "Get your line live");
  await sleep(600);
  if (glOk) await shot(page, "07-golive-modal"); else console.log("  (go-live button not found)");
  await page.keyboard.press("Escape").catch(() => {});
  await clickByText(page, "button", "I'll do this later");
  await sleep(300);

  // 8: save-flow (cancel) modal on settings
  await page.goto(`${APP}/dashboard/settings`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});
  const cancelOk = await clickByText(page, "button", "Cancel subscription");
  await sleep(600);
  if (cancelOk) await shot(page, "08-saveflow-cancel"); else { console.log("  (Cancel subscription not found)"); await shot(page, "08-settings-debug"); }

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("screenshot error:", e);
  process.exit(1);
});
