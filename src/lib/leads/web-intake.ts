import { openai } from "@/lib/openai";
import { logger } from "@/lib/logger";

/**
 * Backend valve for web-form submissions (direct intake URL + website widget —
 * one code path). The form stays pitched purely as job intake with no visible
 * message/question branch; this valve only catches clearly-non-job text that
 * arrives through the "Something else" free-text service option, so a billing
 * question can't land in the ranked queue as a scored job.
 * See docs/intake-capture-contract.md §4.
 */

export interface WebIntakeVerdict {
  classification: "service_request" | "non_job_message" | "unclear";
  messageKind: "question" | "billing" | "general";
}

/**
 * Pure decision: the valve only runs on the "Something else" path (free-text
 * service, no structured primary answer), and never against an existing JOB
 * lead (downgrade is forbidden).
 */
export function shouldRunValve(opts: {
  isNewLead: boolean;
  existingLeadType: string | null; // null when the lead was just created
  hasStructuredPrimary: boolean;
  serviceRequested: string | null;
}): boolean {
  if (!opts.serviceRequested || opts.hasStructuredPrimary) return false;
  return opts.isNewLead || opts.existingLeadType === "message";
}

/**
 * Pure decision: a message lead that re-submits with a real structured service
 * answer is upgraded to a job. Never the reverse.
 */
export function shouldUpgradeToJob(existingLeadType: string, hasStructuredPrimary: boolean): boolean {
  return existingLeadType === "message" && hasStructuredPrimary;
}

const FAIL_OPEN: WebIntakeVerdict = { classification: "unclear", messageKind: "general" };

/**
 * One cheap forced-tool classification of "Something else" free text. Fails OPEN
 * to "unclear" (treated as a job downstream) — a misfiled job beats a lost one.
 */
export async function classifyWebIntake(freeText: string): Promise<WebIntakeVerdict> {
  if (!freeText.trim() || !process.env.OPENAI_API_KEY) return FAIL_OPEN;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Text submitted through a home-service business's website SERVICE-REQUEST form via the 'Something else' option. " +
            "Classify it. \"service_request\" = they want work/service done or describe a problem they have — ANY trade or service counts, " +
            "even one this business may not offer. \"non_job_message\" = clearly NOT requesting work: a billing/invoice/payment question, " +
            "a general question (hours, service area, warranty), a vendor pitch, a job application, or feedback. " +
            "\"unclear\" = cannot tell. Prefer \"unclear\" over \"non_job_message\" when in doubt.",
        },
        { role: "user", content: freeText },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "classify_web_intake",
            description: "Classify the submission.",
            parameters: {
              type: "object",
              properties: {
                classification: { type: "string", enum: ["service_request", "non_job_message", "unclear"] },
                message_kind: {
                  type: "string",
                  enum: ["question", "billing", "general"],
                  description: "Only when classification is non_job_message.",
                },
              },
              required: ["classification"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "classify_web_intake" } },
    });

    const call = completion.choices[0]?.message?.tool_calls?.[0];
    const args = call?.type === "function" ? (JSON.parse(call.function.arguments || "{}") as Record<string, unknown>) : {};
    const classification =
      args.classification === "service_request" || args.classification === "non_job_message" || args.classification === "unclear"
        ? args.classification
        : "unclear";
    const messageKind =
      args.message_kind === "question" || args.message_kind === "billing" || args.message_kind === "general"
        ? args.message_kind
        : "general";
    return { classification, messageKind };
  } catch (err) {
    logger.error("classifyWebIntake failed — failing open to job", { error: String(err) });
    return FAIL_OPEN;
  }
}
