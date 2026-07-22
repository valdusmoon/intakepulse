import { openai } from "@/lib/openai";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { buildExtractIntakeTool } from "@/lib/voice/state-machine/tools";
import { validateExtraction, type ExtractionResult } from "@/lib/voice/state-machine/extraction";
import { MESSAGE_KINDS, type MessageKind } from "@/lib/leads/lead-taxonomy";
import { logger } from "@/lib/logger";

/**
 * Legacy opportunity booleans — kept as the fail-open fallback when contact_kind is
 * unusable (model failure): if any of these fired, the call is still captured as a job.
 */
export interface SignalFlags {
  jobIntent: boolean;
  urgency: boolean;
  callbackRequested: boolean;
  quoteRequested: boolean;
  contactCaptured: boolean;
}

/** What a team-answered call was — the transcript-side counterpart of the voice
 *  engine's contact_type triage. "junk" = wrong number / solicitation (screened
 *  equivalent: no lead row); "none" = nothing to act on. */
export type TranscriptContactKind = "job" | "message" | "junk" | "none";

export interface TranscriptIntake {
  extraction: ExtractionResult;
  signal: SignalFlags;
  contactKind: TranscriptContactKind;
  messageKind: MessageKind | null;
  /** The caller's ask in their own words, unscrubbed — becomes leads.notes for messages
   *  (unlike `summary`, which is deliberately PII-scrubbed for the call record). */
  messageForTeam: string | null;
  /** The service in the caller's own words, if stated — off-list capture parity with voice. */
  serviceRequested: string | null;
  summary: string;
  callerName: string | null;
}

const EMPTY_SIGNAL: SignalFlags = {
  jobIntent: false,
  urgency: false,
  callbackRequested: false,
  quoteRequested: false,
  contactCaptured: false,
};

function safeParseArgs(raw: string | undefined | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function emptyIntake(summary: string): Omit<TranscriptIntake, "extraction"> {
  return {
    signal: { ...EMPTY_SIGNAL },
    contactKind: "none",
    messageKind: null,
    messageForTeam: null,
    serviceRequested: null,
    summary,
    callerName: null,
  };
}

/**
 * Turn a free-form (Whisper) transcript of a team-answered call into the same
 * structured shape the AI voice path produces: a `Record<questionKey, value>`
 * answers map (reusing the vertical's own `extract_intake` tool + validation),
 * plus the three-outcome classification (job / message / junk-or-none), the
 * message content for the team, and a short summary. This lets the human path
 * feed the exact same capture contract as the AI path.
 *
 * Two parallel gpt-4o passes over the same transcript: structured intake, and
 * classification + message + summary + caller name. Each pass degrades
 * independently — a failed signal pass can't discard successful field
 * extraction (structured answers still force a job downstream), and vice versa.
 */
export async function extractIntakeFromTranscript(
  transcript: string,
  questions: VerticalQuestion[]
): Promise<TranscriptIntake> {
  if (!transcript.trim() || !process.env.OPENAI_API_KEY) {
    return {
      extraction: { answers: {} },
      ...emptyIntake("No conversation transcribed."),
    };
  }

  const intakeTool = buildExtractIntakeTool(questions);

  const signalTool = {
    type: "function" as const,
    function: {
      name: "record_call_signal",
      description:
        "Classify what this call the business's team just answered was (a job opportunity, a message for the team, junk, or nothing), capture the message if any, and summarize it.",
      parameters: {
        type: "object",
        properties: {
          contact_kind: {
            type: "string",
            enum: ["job", "message", "junk", "none"],
            description:
              "What this team-answered call was. \"job\" = the caller wants work/service done or described a problem they have (even vaguely). " +
              "\"message\" = a non-job matter the team must act on: billing/invoice/payment, an existing customer about an ongoing job, a callback request, " +
              "a question (hours, service area, pricing, price-shopping WITHOUT a problem they actually have), a vendor or job applicant with a message. " +
              "\"junk\" = wrong number, misdial, or someone trying to SELL to the business (SEO, ads, staffing, etc). " +
              "\"none\" = no opportunity and nothing to act on (silence, pocket dial, pure chit-chat). Prefer \"message\" over \"none\" when in doubt.",
          },
          message_kind: {
            type: "string",
            enum: ["existing_customer", "billing", "callback", "question", "general"],
            description: "Only when contact_kind is \"message\": which kind.",
          },
          message_for_team: {
            type: "string",
            description:
              "Only when contact_kind is \"message\": the caller's ask in their own words, 1-2 sentences, INCLUDING any names/numbers/details the team needs to act. This is internal, not a public summary.",
          },
          service_requested: {
            type: "string",
            description:
              "The service/work the caller asked about, in their own words, if any was stated. Include even for messages (e.g. price-shopping).",
          },
          job_intent: { type: "boolean", description: "The caller wants work done, or discussed a job/service/repair/project/estimate." },
          urgency: { type: "boolean", description: "The caller expressed time pressure or an emergency." },
          callback_requested: { type: "boolean", description: "A callback or follow-up was requested or promised." },
          quote_requested: { type: "boolean", description: "The caller asked about price, a quote, or an estimate." },
          contact_captured: { type: "boolean", description: "The caller shared contact details (name, number, or address)." },
          caller_name: { type: "string", description: "The caller's name if clearly stated. Omit if not stated." },
          summary: { type: "string", description: "1-2 sentence summary: service needed, urgency, and outcome. No personal contact details." },
        },
        required: ["contact_kind", "job_intent", "urgency", "callback_requested", "quote_requested", "contact_captured", "summary"],
      },
    },
  };

  const [intakeSettled, signalSettled] = await Promise.allSettled([
    openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Extract only fields the caller explicitly stated in this phone call transcript. Omit anything not clearly said; never guess or infer.",
        },
        { role: "user", content: transcript },
      ],
      tools: [
        { type: "function", function: { name: intakeTool.name, description: intakeTool.description, parameters: intakeTool.parameters } },
      ],
      tool_choice: { type: "function", function: { name: intakeTool.name } },
    }),
    openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You classify what a phone call a home-service business's team just answered was (a job opportunity, a message for the team, junk, or nothing), capture the message if any, and summarize it.",
        },
        { role: "user", content: transcript },
      ],
      tools: [signalTool],
      tool_choice: { type: "function", function: { name: "record_call_signal" } },
    }),
  ]);

  let extraction: ExtractionResult = { answers: {} };
  if (intakeSettled.status === "fulfilled") {
    const intakeCall = intakeSettled.value.choices[0]?.message?.tool_calls?.[0];
    const intakeArgs = safeParseArgs(intakeCall?.type === "function" ? intakeCall.function.arguments : undefined);
    extraction = validateExtraction(questions, intakeArgs);
  } else {
    logger.error("extractIntakeFromTranscript: intake extraction failed", { error: String(intakeSettled.reason) });
  }

  if (signalSettled.status !== "fulfilled") {
    logger.error("extractIntakeFromTranscript: signal classification failed", { error: String(signalSettled.reason) });
    return { extraction, ...emptyIntake("Team-answered call (analysis unavailable).") };
  }

  const signalCall = signalSettled.value.choices[0]?.message?.tool_calls?.[0];
  const signalArgs = safeParseArgs(signalCall?.type === "function" ? signalCall.function.arguments : undefined);

  const signal: SignalFlags = {
    jobIntent: !!signalArgs.job_intent,
    urgency: !!signalArgs.urgency,
    callbackRequested: !!signalArgs.callback_requested,
    quoteRequested: !!signalArgs.quote_requested,
    contactCaptured: !!signalArgs.contact_captured,
  };
  const rawKind = signalArgs.contact_kind;
  const contactKind: TranscriptContactKind =
    rawKind === "job" || rawKind === "message" || rawKind === "junk" || rawKind === "none" ? rawKind : "none";
  const messageKind =
    typeof signalArgs.message_kind === "string" && (MESSAGE_KINDS as string[]).includes(signalArgs.message_kind)
      ? (signalArgs.message_kind as MessageKind)
      : null;
  const messageForTeam =
    typeof signalArgs.message_for_team === "string" && signalArgs.message_for_team.trim()
      ? signalArgs.message_for_team.trim()
      : null;
  const serviceRequested =
    typeof signalArgs.service_requested === "string" && signalArgs.service_requested.trim()
      ? signalArgs.service_requested.trim()
      : null;
  const summary =
    typeof signalArgs.summary === "string" && signalArgs.summary.trim()
      ? signalArgs.summary.trim()
      : "Team-answered call.";
  const callerName =
    typeof signalArgs.caller_name === "string" && signalArgs.caller_name.trim()
      ? signalArgs.caller_name.trim()
      : null;

  return { extraction, signal, contactKind, messageKind, messageForTeam, serviceRequested, summary, callerName };
}
