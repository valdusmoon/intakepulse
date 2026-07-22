import { getBusinessById } from "@/lib/db/queries/businesses";
import { getCallById, updateCall } from "@/lib/db/queries/calls";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { withCustomServiceOptions } from "@/lib/verticals/customOptions";
import { transcribeRecording } from "@/lib/voice/transcription";
import { deleteRecording } from "@/lib/twilio/client";
import { extractIntakeFromTranscript } from "@/lib/leads/extract-from-transcript";
import { captureHumanCallLead } from "@/lib/leads/capture-human-call";
import { logger } from "@/lib/logger";

export interface ProcessHumanCallInput {
  callId: string;
  businessId: string;
  recordingSid: string;
  recordingUrl: string;
}

/**
 * Runner-agnostic post-call pipeline for a team-answered, recorded call:
 * transcribe (Whisper) → extract structured answers + opportunity signal →
 * store transcript + summary on the call → create a lead if there's signal →
 * delete the audio (transcript kept, audio never retained).
 *
 * Invoked by the Inngest function (active runner) and, if swapped, an inline
 * `after()` call in the recording webhook. Idempotent: if the call was already
 * processed (has a transcript or lead), it only ensures the audio is gone.
 */
export async function processHumanCall(input: ProcessHumanCallInput): Promise<void> {
  const { callId, recordingSid, recordingUrl } = input;

  const call = await getCallById(callId);
  if (!call) {
    logger.warn("processHumanCall: call not found", { callId });
    return;
  }

  // Idempotency: don't re-transcribe or create a duplicate lead on a retry —
  // just make sure the audio is deleted.
  if (call.transcript || call.leadId) {
    logger.debug("processHumanCall: already processed, ensuring audio deleted", { callId });
    await safeDeleteRecording(recordingSid);
    return;
  }

  const business = await getBusinessById(call.businessId);
  if (!business) {
    logger.warn("processHumanCall: business not found", { callId, businessId: call.businessId });
    return;
  }

  const verticalConfig = await getVerticalConfig(business.vertical);
  if (!verticalConfig) {
    logger.error("processHumanCall: no vertical config", { callId, vertical: business.vertical });
    return;
  }
  const questions = withCustomServiceOptions(verticalConfig.questions, business.customServiceOptions);

  const transcript = await transcribeRecording(recordingUrl);
  const intake = await extractIntakeFromTranscript(transcript, questions);

  await updateCall(callId, {
    transcript: [{ role: "user", message: transcript }],
    summary: intake.summary,
  });

  await captureHumanCallLead({
    call,
    verticalConfig: {
      questions,
      scoringRules: verticalConfig.scoringRules,
      baseValueLow: verticalConfig.baseValueLow,
      aiPromptTemplate: verticalConfig.aiPromptTemplate,
    },
    intake,
    transcriptText: transcript,
  });

  // Transcript kept above; discard the audio.
  await safeDeleteRecording(recordingSid);
}

async function safeDeleteRecording(recordingSid: string): Promise<void> {
  try {
    await deleteRecording(recordingSid);
  } catch (err) {
    logger.error("processHumanCall: failed to delete recording", { recordingSid, error: String(err) });
  }
}
