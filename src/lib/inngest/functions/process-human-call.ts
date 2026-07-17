import { inngest } from "@/lib/inngest/client";
import { processHumanCall } from "@/lib/leads/process-human-call";
import { logger } from "@/lib/logger";

/**
 * Event-triggered: fired by the Twilio recording webhook when a team-answered
 * call's recording completes. Runs the durable, retryable post-call pipeline
 * (transcribe → extract → lead → delete audio). This is the FIRST event-triggered
 * Inngest function — after deploying, re-sync the app (PUT /api/inngest).
 */
export const processHumanCallFn = inngest.createFunction(
  {
    id: "process-human-call",
    name: "Process Team-Answered Call",
    triggers: [{ event: "call/human-recording.completed" }],
  },
  async ({ event, step }) => {
    const { callId, businessId, recordingSid, recordingUrl } = event.data as {
      callId: string;
      businessId: string;
      recordingSid: string;
      recordingUrl: string;
    };

    await step.run("process-human-call", () =>
      processHumanCall({ callId, businessId, recordingSid, recordingUrl })
    );

    logger.info("process-human-call: complete", { callId });
    return { callId };
  }
);
