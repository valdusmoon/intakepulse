/**
 * Manual conversion/lifecycle email + CAN-SPAM test harness.
 *
 * Sends every lifecycle email to a target inbox (default moonvaldus@gmail.com),
 * then exercises the suppression + unsubscribe-token logic WITHOUT emailing any
 * non-owner address (Resend's shared sender only delivers to the account owner).
 *
 *   npx tsx scripts/test-conversion-emails.ts [targetEmail]
 *
 * Prints a real unsubscribe token for the target so the caller can drive the
 * HTTP /api/unsubscribe + /api/capture suppression check over the dev server.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import {
  sendWelcomeEmail,
  sendTrialReminderEmail,
  sendActivationNudgeEmail,
  sendWinbackEmail,
  sendMonthlyRoiRecapEmail,
  sendDunningEmail,
  sendReceiptEmail,
} from "../src/lib/email/notifications";
import { emailClient } from "../src/lib/email/email-client";
import { isEmailSuppressed, suppressEmail, getSuppressedSet } from "../src/lib/db/queries/emailSuppressions";
import { signUnsubscribeToken, verifyUnsubscribeToken, unsubscribeUrl } from "../src/lib/email/unsubscribe";
import { db } from "../src/lib/db/index";
import { emailSuppressions } from "../src/lib/db/schema/emailSuppressions";

const TARGET = (process.argv[2] || "moonvaldus@gmail.com").trim().toLowerCase();
const APP = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const NAME = "Val Moon";
const BIZ = "Blue Star Restoration";
const stats = { total: 42, converted: 7, estimatedRevenue: 1_860_000 }; // $18,600

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ FAIL: ${label}`);
  }
}

async function main() {
  console.log(`\n=== Lifecycle email sends -> ${TARGET} ===`);
  await sendWelcomeEmail({ ownerName: NAME, ownerEmail: TARGET, businessName: BIZ, dashboardUrl: `${APP}/dashboard` });
  console.log("  sent: welcome (transactional)");
  await sendTrialReminderEmail({ ownerEmail: TARGET, ownerName: NAME, businessName: BIZ, stage: "trial_day13", billingUrl: `${APP}/dashboard/settings`, stats });
  console.log("  sent: trial-reminder day13 (transactional)");
  await sendActivationNudgeEmail({ ownerEmail: TARGET, ownerName: NAME, businessName: BIZ, stage: "activation_day3", dashboardUrl: `${APP}/dashboard` });
  console.log("  sent: activation-nudge day3 (transactional)");
  await sendDunningEmail({ ownerEmail: TARGET, ownerName: NAME, businessName: BIZ, billingUrl: `${APP}/dashboard/settings` });
  console.log("  sent: dunning (transactional)");
  await sendReceiptEmail({ ownerEmail: TARGET, ownerName: NAME, businessName: BIZ, amountCents: 7900, periodEnd: new Date(Date.now() + 30 * 864e5), billingUrl: `${APP}/dashboard/settings` });
  console.log("  sent: receipt (transactional)");
  await sendWinbackEmail({ ownerEmail: TARGET, ownerName: NAME, businessName: BIZ, reactivateUrl: `${APP}/dashboard/settings`, stats });
  console.log("  sent: winback (MARKETING - should carry footer + List-Unsubscribe)");
  await sendMonthlyRoiRecapEmail({ ownerEmail: TARGET, ownerName: NAME, businessName: BIZ, monthLabel: "June 2026", dashboardUrl: `${APP}/dashboard`, stats: { total: 42, missedCalls: 15, converted: 7, estimatedRevenue: 1_860_000 } });
  console.log("  sent: monthly-roi-recap (MARKETING - should carry footer + List-Unsubscribe)");

  console.log(`\n=== Suppression logic (throwaway address, no real send) ===`);
  const fake = "suppress-check@callverted-test.invalid";
  await db.delete(emailSuppressions).where(eq(emailSuppressions.email, fake));
  check("throwaway starts unsuppressed", (await isEmailSuppressed(fake)) === false);
  await suppressEmail(fake, "manual");
  check("suppressEmail records it", (await isEmailSuppressed(fake)) === true);
  check("suppressEmail is idempotent (no throw on repeat)", await (async () => { await suppressEmail(fake, "manual"); return true; })());
  const set = await getSuppressedSet([fake, "someone-else@callverted-test.invalid"]);
  check("getSuppressedSet returns only the suppressed one", set.has(fake) && set.size === 1);
  // Suppressed -> sendMarketing must short-circuit BEFORE hitting Resend (safe, no real email).
  const res = (await emailClient.sendMarketing({ to: fake, subject: "should be skipped", html: "<p>x</p>" })) as { suppressed?: boolean };
  check("sendMarketing skips a suppressed recipient", res?.suppressed === true);
  await db.delete(emailSuppressions).where(eq(emailSuppressions.email, fake));
  check("throwaway cleaned up", (await isEmailSuppressed(fake)) === false);

  console.log(`\n=== Unsubscribe token round-trip ===`);
  const token = signUnsubscribeToken(TARGET);
  check("verify(sign(email)) === email", verifyUnsubscribeToken(token) === TARGET);
  check("tampered token rejected", verifyUnsubscribeToken(token.slice(0, -3) + "zzz") === null);
  check("garbage token rejected", verifyUnsubscribeToken("not-a-token") === null);
  check("empty token rejected", verifyUnsubscribeToken("") === null);

  console.log(`\n=== HTTP test inputs (for the dev-server capture/unsubscribe check) ===`);
  console.log(`MOONVALDUS_TOKEN=${token}`);
  console.log(`UNSUB_URL=${unsubscribeUrl(TARGET)}`);

  console.log(`\n=== Result: ${pass} passed, ${fail} failed ===\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("harness error:", e);
  process.exit(1);
});
