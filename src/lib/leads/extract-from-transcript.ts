import { openai } from "@/lib/openai";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { buildExtractIntakeTool } from "@/lib/voice/state-machine/tools";
import { validateExtraction, type ExtractionResult } from "@/lib/voice/state-machine/extraction";
import { logger } from "@/lib/logger";

/**
 * Whether a team-answered call is a real opportunity worth tracking as a lead.
 * The lead is created only if there's structured intake OR any of these fire.
 */
export interface SignalFlags {
  jobIntent: boolean;
  urgency: boolean;
  callbackRequested: boolean;
  quoteRequested: boolean;
  contactCaptured: boolean;
}

export interface TranscriptIntake {
  extraction: ExtractionResult;
  signal: SignalFlags;
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

/**
 * Turn a free-form (Whisper) transcript of a team-answered call into the same
 * structured shape the AI voice path produces: a `Record<questionKey, value>`
 * answers map (reusing the vertical's own `extract_intake` tool + validation),
 * plus opportunity signal flags and a short summary. This lets the human path
 * feed the exact same scoring/assessment pipeline as the AI path.
 *
 * Two parallel gpt-4o passes over the same transcript: structured intake, and
 * opportunity signal + summary + caller name.
 */
export async function extractIntakeFromTranscript(
  transcript: string,
  questions: VerticalQuestion[]
): Promise<TranscriptIntake> {
  if (!transcript.trim() || !process.env.OPENAI_API_KEY) {
    return {
      extraction: { answers: {} },
      signal: { ...EMPTY_SIGNAL },
      summary: "No conversation transcribed.",
      callerName: null,
    };
  }

  const intakeTool = buildExtractIntakeTool(questions);

  const signalTool = {
    type: "function" as const,
    function: {
      name: "record_call_signal",
      description:
        "Assess whether this call the business's team just answered is a real sales opportunity worth tracking as a lead, and capture the caller's name if stated.",
      parameters: {
        type: "object",
        properties: {
          job_intent: { type: "boolean", description: "The caller wants work done, or discussed a job/service/repair/project/estimate." },
          urgency: { type: "boolean", description: "The caller expressed time pressure or an emergency." },
          callback_requested: { type: "boolean", description: "A callback or follow-up was requested or promised." },
          quote_requested: { type: "boolean", description: "The caller asked about price, a quote, or an estimate." },
          contact_captured: { type: "boolean", description: "The caller shared contact details (name, number, or address)." },
          caller_name: { type: "string", description: "The caller's name if clearly stated. Omit if not stated." },
          summary: { type: "string", description: "1-2 sentence summary: service needed, urgency, and outcome. No personal contact details." },
        },
        required: ["job_intent", "urgency", "callback_requested", "quote_requested", "contact_captured", "summary"],
      },
    },
  };

  try {
    const [intakeCompletion, signalCompletion] = await Promise.all([
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
              "You classify whether a phone call a home-service business's team just answered is a real sales opportunity, and summarize it.",
          },
          { role: "user", content: transcript },
        ],
        tools: [signalTool],
        tool_choice: { type: "function", function: { name: "record_call_signal" } },
      }),
    ]);

    const intakeCall = intakeCompletion.choices[0]?.message?.tool_calls?.[0];
    const intakeArgs = safeParseArgs(intakeCall?.type === "function" ? intakeCall.function.arguments : undefined);
    const extraction = validateExtraction(questions, intakeArgs);

    const signalCall = signalCompletion.choices[0]?.message?.tool_calls?.[0];
    const signalArgs = safeParseArgs(signalCall?.type === "function" ? signalCall.function.arguments : undefined);
    const signal: SignalFlags = {
      jobIntent: !!signalArgs.job_intent,
      urgency: !!signalArgs.urgency,
      callbackRequested: !!signalArgs.callback_requested,
      quoteRequested: !!signalArgs.quote_requested,
      contactCaptured: !!signalArgs.contact_captured,
    };
    const summary =
      typeof signalArgs.summary === "string" && signalArgs.summary.trim()
        ? signalArgs.summary.trim()
        : "Team-answered call.";
    const callerName =
      typeof signalArgs.caller_name === "string" && signalArgs.caller_name.trim()
        ? signalArgs.caller_name.trim()
        : null;

    return { extraction, signal, summary, callerName };
  } catch (err) {
    logger.error("extractIntakeFromTranscript failed", { error: String(err) });
    return {
      extraction: { answers: {} },
      signal: { ...EMPTY_SIGNAL },
      summary: "Team-answered call (analysis unavailable).",
      callerName: null,
    };
  }
}
