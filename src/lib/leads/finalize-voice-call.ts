import { openai } from "@/lib/openai";
import { getCallById, updateCall } from "@/lib/db/queries/calls";
import { getLeadById } from "@/lib/db/queries/leads";
import { getBusinessById } from "@/lib/db/queries/businesses";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { withCustomServiceOptions } from "@/lib/verticals/customOptions";
import { scoreLeadFromAnswers } from "@/lib/leads/scoring";
import { assessLead } from "@/lib/leads/assess";
import { notifyJobLead } from "@/lib/leads/notify-job";
import { notifyMessageCaptured } from "@/lib/leads/notify-message";
import { logger } from "@/lib/logger";
import type { CallTranscriptEntry } from "@/lib/db/schema/calls";

/**
 * Runner-agnostic post-call pipeline for an AI-handled voice call — the heavy
 * tail that used to run inline on the voice WebSocket and got FROZEN by the
 * platform's post-close grace window (observed in prod: lead created but never
 * scored, call stuck "ringing", transcript lost). The stream route's cleanup now
 * persists only fast critical state (lead row, call finals, transcript) and
 * fires the `call/voice.ended` event; this does the rest durably:
 *
 *   score + assess + notify the owner (job) / low-key alert (message) →
 *   generate the PII-scrubbed call summary.
 *
 * Everything it needs is read from the DB (the fast writes persisted it all) —
 * no in-memory session state crosses the boundary. Idempotent: a scored job
 * (priorityScore set) is never re-scored, an existing summary is never
 * regenerated, so Inngest retries and duplicate events are safe.
 */
export async function finalizeVoiceCall({ callId }: { callId: string }): Promise<void> {
  const call = await getCallById(callId);
  if (!call) {
    logger.warn("finalizeVoiceCall: call not found", { callId });
    return;
  }

  if (call.leadId) {
    const lead = await getLeadById(call.leadId);
    const business = lead ? await getBusinessById(lead.businessId) : null;

    // voice_test leads never reach this path (the test harness has no calls row),
    // but guard anyway — test runs must never page the owner.
    if (lead && business && lead.source !== "voice_test") {
      if (lead.leadType === "message") {
        await notifyMessageCaptured({
          business,
          leadId: lead.id,
          callerName: lead.callerName,
          callerPhone: lead.callerPhone,
          messageKind: lead.messageKind,
          notes: lead.notes,
        });
      } else if (lead.priorityScore == null) {
        // Unscored job — score with the same ScoringContext the inline path used:
        // the caller's own service words + their free-text reason, so the
        // emergency and critical-signal floors work exactly as before.
        const config = await getVerticalConfig(business.vertical);
        if (config) {
          const questions = withCustomServiceOptions(config.questions, business.customServiceOptions);
          const answers = lead.intakeAnswers ?? {};
          const scores = scoreLeadFromAnswers(answers, config.scoringRules, questions, config.baseValueLow, {
            serviceRequested: lead.serviceRequested,
            signalText: lead.notes,
          });
          const reasoning = await assessLead(lead.id, answers, scores, config.aiPromptTemplate);
          await notifyJobLead({
            business,
            leadId: lead.id,
            callerName: lead.callerName,
            callerPhone: lead.callerPhone,
            scores,
            reasoning,
            answers,
            questions,
          });
        } else {
          logger.error("finalizeVoiceCall: no vertical config", { callId, vertical: business.vertical });
        }
      }
    }
  }

  if (!call.summary) {
    const summary = await generateVoiceCallSummary(call.transcript ?? []);
    await updateCall(callId, { summary });
  }

  logger.info("finalizeVoiceCall: complete", { callId, leadId: call.leadId ?? null });
}

/** PII-scrubbed 1-2 sentence summary of the call for the call record. Moved out
 *  of the live WebSocket path (call-manager) — the GPT round-trip is exactly the
 *  kind of work the post-close grace window kills. Never throws. */
async function generateVoiceCallSummary(transcript: CallTranscriptEntry[]): Promise<string> {
  const transcriptText = transcript
    .map((t) => `${t.role === "user" ? "Caller" : "AI"}: ${t.message}`)
    .join("\n");

  if (!transcriptText.trim()) {
    return "No conversation recorded.";
  }

  const prompt = `Summarize this AI overflow-receptionist phone call in 1-2 sentences: the service needed, urgency, and outcome. Do not include names, phone numbers, addresses, or other personal details.

Transcript:
${transcriptText}

Summary:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content?.trim() || "Summary unavailable.";
  } catch (error) {
    logger.error("Failed to generate call summary", { error: String(error) });
    return "Summary unavailable.";
  }
}
