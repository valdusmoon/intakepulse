import { inngest } from "@/lib/inngest/client";
import { finalizeVoiceCall } from "@/lib/leads/finalize-voice-call";
import { logger } from "@/lib/logger";

/**
 * Event-triggered: fired by the voice stream route's cleanup once a call's
 * critical state (lead row, call finals, transcript) is persisted. Runs the
 * durable, retryable heavy tail — scoring, assessment, owner notifications,
 * call summary — OUTSIDE the WebSocket-close grace window that was freezing
 * this work mid-write in prod. After deploying, re-sync the Inngest app
 * (PUT /api/inngest) so the new function registers.
 */
export const finalizeVoiceCallFn = inngest.createFunction(
  {
    id: "finalize-voice-call",
    name: "Finalize Voice AI Call",
    triggers: [{ event: "call/voice.ended" }],
  },
  async ({ event, step }) => {
    const { callId } = event.data as { callId: string };

    await step.run("finalize-voice-call", () => finalizeVoiceCall({ callId }));

    logger.info("finalize-voice-call: complete", { callId });
    return { callId };
  }
);
