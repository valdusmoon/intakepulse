import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { weeklyReport } from "@/lib/inngest/functions/weekly-report";
import { activationNudges } from "@/lib/inngest/functions/activation-nudges";
import { processHumanCallFn } from "@/lib/inngest/functions/process-human-call";
import { finalizeVoiceCallFn } from "@/lib/inngest/functions/finalize-voice-call";

// PARKED lifecycle crons (early-stage simplification — 2026-07-12). The code
// still exists and is fully functional; it's just not registered here, so it
// never triggers. Re-add the import + the entry in `functions` to re-enable.
//   - trialReminders   → re-enable at the real-Stripe flip (only matters once
//                        real charges happen; trial auto-converts regardless).
//   - winbackEmails    → re-enable once there are churned customers to win back.
//   - monthlyRoiRecap  → redundant with the weekly report for now; pick one.
// import { trialReminders } from "@/lib/inngest/functions/trial-reminders";
// import { winbackEmails } from "@/lib/inngest/functions/winback-emails";
// import { monthlyRoiRecap } from "@/lib/inngest/functions/monthly-roi-recap";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    weeklyReport,
    activationNudges,
    processHumanCallFn, // event-triggered: call/human-recording.completed
    finalizeVoiceCallFn, // event-triggered: call/voice.ended
    // trialReminders,   // parked — see note above
    // winbackEmails,    // parked — see note above
    // monthlyRoiRecap,  // parked — see note above
  ],
});
