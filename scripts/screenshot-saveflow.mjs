import puppeteer from "puppeteer-core";
const SECRET = process.env.CLERK_SECRET_KEY;
const USER_ID = process.env.CLERK_USER_ID;
const APP = process.env.APP_URL || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const OUT = process.env.OUT_DIR || "screenshots/activation";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page, sel, text) {
  return page.evaluate((sel, text) => {
    const el = [...document.querySelectorAll(sel)].find((n) => n.textContent.trim().includes(text));
    if (el) { el.scrollIntoView({ block: "center" }); el.click(); return true; }
    return false;
  }, sel, text);
}

(async () => {
  const res = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST", headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: USER_ID }),
  });
  const { token } = await res.json();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(`${APP}/sign-in?__clerk_ticket=${encodeURIComponent(token)}`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 45000 }).catch(() => {});
  await page.goto(`${APP}/dashboard/settings`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});

  const billing = (await clickByText(page, "button", "Billing")) || (await clickByText(page, "div,a,li", "Billing"));
  console.log("billing tab:", billing);
  // Wait for the billing panel to finish its /api/business fetch and render the button.
  await page.waitForFunction(
    () => [...document.querySelectorAll("button")].some((b) => b.textContent.includes("Cancel subscription")),
    { timeout: 20000 }
  ).catch(() => console.log("  timed out waiting for Cancel subscription button"));
  await sleep(400);
  const cancel = await clickByText(page, "button", "Cancel subscription");
  console.log("cancel clicked:", cancel);
  await sleep(700);
  await page.screenshot({ path: `${OUT}/08-saveflow-cancel.png` });
  console.log("saved 08-saveflow-cancel.png");
  // also capture the billing tab itself
  await page.keyboard.press("Escape").catch(() => {});
  await sleep(300);
  await page.screenshot({ path: `${OUT}/09-billing-tab.png` });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
