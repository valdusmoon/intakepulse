/**
 * Live-model E2E harness for the intake capture contract (dev-plan Session 11, Step 8b).
 * Covers everything testable without a real phone call:
 *   A. Real gpt-4o transcript classification (extractIntakeFromTranscript) on realistic
 *      team-answered-call transcripts — does the NEW contact_kind schema behave with the
 *      actual model, not just mocks?
 *   B. Full downstream pipeline into the LOCAL dev DB (captureHumanCallLead): message
 *      stored unscored with the caller's words as notes; job scored with the transcript
 *      as signalText so the critical-signal floor fires. All created rows are deleted.
 *   C. Real gpt-4o-mini web valve (classifyWebIntake) on realistic "Something else" texts.
 * NOT covered here (needs a real call): Twilio audio → recording webhook → Whisper — all
 * unchanged code, live in prod since 2026-07-18.
 *
 * Run: npx tsx scripts/test-intake-contract.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}${detail !== undefined ? ` — got: ${JSON.stringify(detail)}` : ""}`);
  }
}

async function main() {
  // Imports deferred until after dotenv: the openai/db clients read env at module load.
  const { extractIntakeFromTranscript } = await import("../src/lib/leads/extract-from-transcript");
  const { captureHumanCallLead } = await import("../src/lib/leads/capture-human-call");
  const { classifyWebIntake } = await import("../src/lib/leads/web-intake");
  const { getAllBusinesses } = await import("../src/lib/db/queries/businesses");
  const { getVerticalConfig } = await import("../src/lib/db/queries/verticalConfigs");
  const { withCustomServiceOptions } = await import("../src/lib/verticals/customOptions");
  const { createCall } = await import("../src/lib/db/queries/calls");
  const { getLeadById } = await import("../src/lib/db/queries/leads");

  const businesses = await getAllBusinesses();
  const business = businesses.find((b) => b.vertical) ?? businesses[0];
  if (!business) throw new Error("No business in dev DB — seed one first.");
  const verticalConfig = await getVerticalConfig(business.vertical);
  if (!verticalConfig) throw new Error(`No vertical config for '${business.vertical}' — run seed-verticals.`);
  const questions = withCustomServiceOptions(verticalConfig.questions, business.customServiceOptions);
  console.log(`Using dev business "${business.businessName}" (${business.vertical})\n`);

  // ── Phase A: real-model transcript classification ─────────────────────────────
  console.log("Phase A — gpt-4o transcript classification (real model)\n");

  const billingTranscript =
    "Employee: Blue Star Restoration, this is Mike. " +
    "Caller: Hi, this is Dana Whitfield. I have a question about my invoice from last week — I think I was double charged. Can someone from the office call me back at 555-0142? " +
    "Employee: Sure thing, I'll pass that to the office and they'll call you back today.";
  const billing = await extractIntakeFromTranscript(billingTranscript, questions);
  console.log(`  billing → contactKind=${billing.contactKind} kind=${billing.messageKind} msg="${billing.messageForTeam}"`);
  check("billing call classifies as message", billing.contactKind === "message", billing.contactKind);
  check("billing messageKind is billing", billing.messageKind === "billing", billing.messageKind);
  check("message_for_team captured (unscrubbed ask)", !!billing.messageForTeam && /invoice|charge/i.test(billing.messageForTeam));
  check("billing call extracted no job fields", Object.keys(billing.extraction.answers).length === 0, billing.extraction.answers);

  const jobTranscript =
    "Employee: Blue Star Restoration, this is Mike. " +
    "Caller: My water heater just burst and the basement is actively flooding right now. I need someone out immediately. I'm in 33618. " +
    "Employee: Okay, that's an emergency — we'll get a crew heading your way. What's your name? Caller: Sarah Bell.";
  const job = await extractIntakeFromTranscript(jobTranscript, questions);
  console.log(`  job → contactKind=${job.contactKind} answers=${JSON.stringify(job.extraction.answers)} zip=${job.extraction.zipCode} name=${job.callerName}`);
  check("emergency call classifies as job", job.contactKind === "job", job.contactKind);
  check("job call extracted structured fields", Object.keys(job.extraction.answers).length > 0, job.extraction.answers);
  check("ZIP extracted from transcript", job.extraction.zipCode === "33618", job.extraction.zipCode);
  check("caller name captured", !!job.callerName && /sarah/i.test(job.callerName), job.callerName);

  const shopperTranscript =
    "Employee: Blue Star Restoration, this is Mike. " +
    "Caller: Hey, quick question — how much do you guys charge for mold remediation? I'm just calling around getting quotes. " +
    "Employee: It depends on the scope, the office can walk you through it. Caller: Okay, no rush, thanks.";
  const shopper = await extractIntakeFromTranscript(shopperTranscript, questions);
  console.log(`  price-shopper → contactKind=${shopper.contactKind} kind=${shopper.messageKind} service="${shopper.serviceRequested}"`);
  check("price-shopper (no actual problem) is a message, not a job", shopper.contactKind === "message", shopper.contactKind);

  const spamTranscript =
    "Employee: Blue Star Restoration, this is Mike. " +
    "Caller: Hi, this is Jake with RankBoost SEO. I'd love to speak with the owner about getting you to the top of Google — takes two minutes. " +
    "Employee: Not interested, thanks. Take us off your list.";
  const spam = await extractIntakeFromTranscript(spamTranscript, questions);
  console.log(`  solicitation → contactKind=${spam.contactKind}`);
  check("solicitation classifies as junk (no lead row)", spam.contactKind === "junk", spam.contactKind);

  const existingTranscript =
    "Employee: Blue Star Restoration, this is Mike. " +
    "Caller: Hi, you guys did the water damage repair in my kitchen last month. When is the crew coming back to finish the baseboards? " +
    "Employee: Let me check the schedule and have someone call you back.";
  const existing = await extractIntakeFromTranscript(existingTranscript, questions);
  console.log(`  existing-customer → contactKind=${existing.contactKind} kind=${existing.messageKind}`);
  check("existing-customer follow-up is a message", existing.contactKind === "message", existing.contactKind);
  check("existing-customer kind tagged", existing.messageKind === "existing_customer", existing.messageKind);

  // ── Phase B: full pipeline into the local dev DB ──────────────────────────────
  console.log("\nPhase B — captureHumanCallLead into dev DB (rows cleaned up after)\n");
  const createdCallIds: string[] = [];
  const createdLeadIds: string[] = [];

  const vc = {
    questions,
    scoringRules: verticalConfig.scoringRules,
    baseValueLow: verticalConfig.baseValueLow,
    aiPromptTemplate: verticalConfig.aiPromptTemplate,
  };

  const msgCall = await createCall({
    businessId: business.id, callerPhone: "+15550000001", calledNumber: "+15550000000",
    status: "answered", outcome: "business_answered",
  });
  createdCallIds.push(msgCall.id);
  const msgResult = await captureHumanCallLead({ call: msgCall, verticalConfig: vc, intake: billing, transcriptText: billingTranscript });
  if (msgResult.leadId) createdLeadIds.push(msgResult.leadId);
  const msgLead = msgResult.leadId ? await getLeadById(msgResult.leadId) : null;
  check("message lead row created", !!msgLead);
  check("stored as leadType message", msgLead?.leadType === "message", msgLead?.leadType);
  check("messageKind persisted", msgLead?.messageKind === "billing", msgLead?.messageKind);
  check("notes = caller's own words", !!msgLead?.notes && /invoice|charge/i.test(msgLead.notes), msgLead?.notes);
  check("message NOT scored (priorityScore null)", msgLead?.priorityScore == null, msgLead?.priorityScore);
  check("message leadStatus stays new", msgLead?.leadStatus === "new", msgLead?.leadStatus);

  const jobCall = await createCall({
    businessId: business.id, callerPhone: "+15550000002", calledNumber: "+15550000000",
    status: "answered", outcome: "business_answered",
  });
  createdCallIds.push(jobCall.id);
  const jobResult = await captureHumanCallLead({ call: jobCall, verticalConfig: vc, intake: job, transcriptText: jobTranscript });
  if (jobResult.leadId) createdLeadIds.push(jobResult.leadId);
  const jobLead = jobResult.leadId ? await getLeadById(jobResult.leadId) : null;
  check("job lead row created", !!jobLead);
  check("stored as leadType job", jobLead?.leadType === "job", jobLead?.leadType);
  check("job scored (priorityScore set)", jobLead?.priorityScore != null, jobLead?.priorityScore);
  check("ZIP folded into intakeAnswers.zip_code", jobLead?.intakeAnswers?.zip_code === "33618", jobLead?.intakeAnswers);
  const floors = jobLead?.scoreTrace?.floorsApplied ?? [];
  check("critical-signal floor fired from transcript ('actively flooding')", floors.includes("critical_signal_floor"), floors);
  check("priority ≥ 80 (critical floor)", (jobLead?.priorityScore ?? 0) >= 80, jobLead?.priorityScore);
  check("job leadStatus qualified after assessment", jobLead?.leadStatus === "qualified", jobLead?.leadStatus);

  // Cleanup — hard-delete everything this run created (FK order: assessments → calls → leads).
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  if (createdLeadIds.length) await sql`delete from ai_assessments where lead_id = any(${createdLeadIds})`;
  if (createdCallIds.length) await sql`delete from calls where id = any(${createdCallIds})`;
  if (createdLeadIds.length) await sql`delete from leads where id = any(${createdLeadIds})`;
  await sql.end();
  console.log(`  🧹 cleaned up ${createdCallIds.length} call rows + ${createdLeadIds.length} lead rows`);

  // ── Phase C: web valve (real gpt-4o-mini) ─────────────────────────────────────
  console.log("\nPhase C — classifyWebIntake (real gpt-4o-mini)\n");

  const invoice = await classifyWebIntake("I have a question about my invoice from last month, I think I was double charged");
  console.log(`  invoice text → ${invoice.classification}/${invoice.messageKind}`);
  check("invoice question → non_job_message", invoice.classification === "non_job_message", invoice.classification);
  check("invoice kind billing", invoice.messageKind === "billing", invoice.messageKind);

  const area = await classifyWebIntake("do you service the 33618 area? just wondering before I bother filling anything out");
  console.log(`  service-area question → ${area.classification}/${area.messageKind}`);
  check("service-area question → non-job (or unclear = safe)", area.classification !== "service_request", area.classification);

  const sprinkler = await classifyWebIntake("need a quote to winterize my sprinkler system before it freezes");
  console.log(`  off-list service → ${sprinkler.classification}`);
  check("off-list real service request → service_request (stays a job)", sprinkler.classification === "service_request", sprinkler.classification);

  const gibberish = await classifyWebIntake("asdf hello test");
  console.log(`  gibberish → ${gibberish.classification}`);
  check("gibberish → NOT non_job_message (fails open toward job)", gibberish.classification !== "non_job_message", gibberish.classification);

  console.log(`\n${"=".repeat(50)}\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Harness crashed:", err);
  process.exit(1);
});
