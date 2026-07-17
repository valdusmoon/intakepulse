import { toFile } from "openai/uploads";
import { openai } from "@/lib/openai";
import { serverEnv } from "@/lib/env";

/**
 * Download a Twilio call recording and transcribe it with Whisper. Callverted
 * keeps the transcript, never the audio (the caller deletes the recording after
 * this). Twilio recording URLs require HTTP Basic auth with the account
 * SID/token; appending `.mp3` fetches the audio directly.
 *
 * Note: whisper-1 returns un-attributed text (no speaker labels) even though the
 * recording is dual-channel — good enough for signal extraction + a summary.
 */
export async function transcribeRecording(recordingUrl: string): Promise<string> {
  if (!serverEnv.TWILIO_ACCOUNT_SID || !serverEnv.TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured — cannot download recording");
  }
  const auth = Buffer.from(
    `${serverEnv.TWILIO_ACCOUNT_SID}:${serverEnv.TWILIO_AUTH_TOKEN}`
  ).toString("base64");

  const res = await fetch(`${recordingUrl}.mp3`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to download recording (${res.status} ${res.statusText})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const file = await toFile(buf, "recording.mp3", { type: "audio/mpeg" });
  const result = await openai.audio.transcriptions.create({ model: "whisper-1", file });
  return result.text;
}
