import { openai } from "@/lib/openai";
import { logger } from "@/lib/logger";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import type { Answers } from "@/lib/verticals/filterAnswers";

/**
 * The closing reassurance a lead sees (web/widget) or hears (voice) once intake
 * is done. Generated from what they actually told us so it reads like someone
 * listened, rather than the same "we'll be in touch" every submitter gets.
 *
 * The model writes the wording, but it is fenced hard: it may only acknowledge
 * what they said and confirm a callback. It cannot promise a time, a price, or
 * a person, because those are commitments the business would have to honour.
 * Any failure falls back to the generic line, so this can never block intake.
 */

/**
 * The rules every closing message obeys, on every channel. Written once and
 * shared: a limit that applies on the web form but not on a live call is not
 * really a limit, and keeping two hand-written copies in sync failed almost
 * immediately. Only genuinely channel-specific wording (spoken length, "do not
 * ask questions") lives with the individual prompts below.
 */
const MUST_SAY = [
  "Show you understood their specific situation, in your own words, using what they actually told you.",
  "Briefly acknowledge how it must feel when the situation is distressing (a fire, a flood, no heat in winter). Warm and human, not dramatic. One clause is enough.",
  "Say the team has been notified, so they know it reached a person. State it positively and stop there. Vary how you word this.",
  "Close by asking them to please wait for the callback. Plain and short, e.g. \"Please wait and we'll be in touch.\" Vary the wording slightly.",
  "Speak as \"we\", never \"I\". The message comes from the company, not from an individual.",
  "Mention the callback exactly once. Do not restate it in different words at the end.",
];

const NEVER_SAY = [
  "Promise any arrival time, date, or window, or say \"within X hours/minutes\", beyond the callback wording you are given.",
  "Mention or imply any price, cost, estimate, quote, insurance, or coverage decision.",
  "Promise a specific person, technician, or crew.",
  "Give safety, medical, or repair advice, or tell them to take any action.",
  "Tell them not to contact anyone else, or imply they shouldn't. Asking them to wait for the callback is fine; telling someone with an active emergency to stop looking for help is not ours to say.",
  "Diagnose the problem or state a cause as fact.",
  "Invent any detail they did not give you.",
  "Use exclamation marks or salesy language.",
];

const bullets = (rules: string[]) => rules.map((r) => `- ${r}`).join("\n");

/** Callback wording both channels commit to, so a caller and a web submitter are
 *  told the same thing. Urgency is the only field every channel always captures.
 *
 *  Every phrase here is deliberately relative, never a clock. We're speaking on
 *  the business's behalf to someone who will hold them to it, and we have no
 *  visibility into their crew's day — so nothing here may name a time, a window,
 *  or a day ("today", "within the hour"). Convey priority, not a deadline. */
export function callbackPhraseForUrgency(urgency?: unknown): string {
  if (urgency === "emergency") return "as soon as possible";
  if (urgency === "soon") return "as soon as they can";
  return "shortly";
}

function systemPrompt(businessName: string, callbackPhrase: string): string {
  return `You write the closing message shown to someone who just requested service from a home-services company (restoration, HVAC, plumbing, electrical, contracting).

Write exactly 3 short sentences, max 45 words total, second person, plain warm English.

You MUST:
${bullets(MUST_SAY)}
- Say ${businessName} has their request and will get back to them ${callbackPhrase}.

You MUST NOT:
${bullets(NEVER_SAY)}

Return only the message text.`;
}

/**
 * The same rules, phrased as a Realtime instruction. On a voice call the model
 * already in the conversation writes this line itself — it has the whole call as
 * context, and going out to a second model would just add a round trip of
 * silence at the worst possible moment.
 */
export function voiceReassuranceInstruction(businessName: string, callbackPhrase: string): string {
  return [
    "Close out the call in two or three short sentences, warm and natural.",
    "You MUST:",
    bullets(MUST_SAY),
    `- Tell them ${businessName} has their request and will call them back ${callbackPhrase}.`,
    "You MUST NOT:",
    bullets(NEVER_SAY),
    "- Ask any question, or say anything that invites them to keep talking.",
  ].join("\n");
}

/** The always-safe message. Used verbatim when AI is unavailable or fails. */
export function genericReassurance(businessName: string): string {
  return `Thanks for the details. ${businessName} has your request and will get back to you shortly. Please wait and someone will be in touch.`;
}

/** Readable "Question: Answer" lines — the model reasons better over the labels
 *  the person actually saw than over raw option keys. */
function describeAnswers(
  questions: VerticalQuestion[],
  answers: Answers,
  serviceRequested?: string
): string {
  const lines: string[] = [];
  if (serviceRequested) lines.push(`In their own words: ${serviceRequested}`);

  for (const q of questions) {
    const v = answers[q.key];
    if (v === undefined || v === null || v === "") continue;
    const values = Array.isArray(v) ? v : [v];
    const labels = values.map((val) => q.options?.find((o) => o.value === val)?.label ?? String(val));
    if (labels.length) lines.push(`${q.label} ${labels.join(", ")}`);
  }
  return lines.join("\n");
}

export async function generateReassurance(params: {
  businessName: string;
  callerName?: string;
  questions: VerticalQuestion[];
  answers: Answers;
  serviceRequested?: string;
}): Promise<string> {
  const { businessName, callerName, questions, answers, serviceRequested } = params;
  const fallback = genericReassurance(businessName);

  if (!process.env.OPENAI_API_KEY) return fallback;

  const detail = describeAnswers(questions, answers, serviceRequested);
  if (!detail.trim()) return fallback;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 90,
      messages: [
        { role: "system", content: systemPrompt(businessName, callbackPhraseForUrgency(answers.urgency)) },
        {
          role: "user",
          content: [
            `Company: ${businessName}`,
            callerName ? `Their name: ${callerName}` : "",
            "",
            "What they told us:",
            detail,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });

    const text = res.choices[0]?.message?.content?.trim();
    // Guard against a run-on or empty generation reaching a customer.
    if (!text || text.length < 15 || text.length > 320) return fallback;
    return text;
  } catch (err) {
    logger.error("Reassurance generation failed", { err: String(err) });
    return fallback;
  }
}
