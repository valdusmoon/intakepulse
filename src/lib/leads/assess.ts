import { openai } from "@/lib/openai";
import { createAiAssessment } from "@/lib/db/queries/aiAssessments";
import { updateLead } from "@/lib/db/queries/leads";
import { logger } from "@/lib/logger";
import type { ScoringResult } from "./scoring";
import type { Answers } from "@/lib/verticals/filterAnswers";

export interface ReasoningResult {
  urgencyReasoning: string;
  qualityReasoning: string;
  recommendedActions: string[];
}

function buildPrompt(
  promptTemplate: string,
  scores: ScoringResult,
  answers: Answers
): string {
  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return promptTemplate
    .replace("{urgencyScore}", String(scores.urgencyScore))
    .replace("{qualityScore}", String(scores.qualityScore))
    .replace("{estimatedValueLow}", fmt(scores.estimatedValueLow))
    .replace("{estimatedValueHigh}", fmt(scores.estimatedValueHigh))
    .replace("{intakeAnswers}", JSON.stringify(answers, null, 2));
}

function mockAssessment(scores: ScoringResult): ReasoningResult {
  return {
    urgencyReasoning: `Urgency score ${scores.urgencyScore}/100 based on intake answers. (Mock assessment — OpenAI key not configured)`,
    qualityReasoning: `Quality score ${scores.qualityScore}/100 based on intake answers. (Mock assessment — OpenAI key not configured)`,
    recommendedActions: ["Call the lead back promptly.", "Review intake answers for job details.", "Confirm insurance status before site visit."],
  };
}

function degradedAssessment(scores: ScoringResult): ReasoningResult {
  return {
    urgencyReasoning: `Urgency score ${scores.urgencyScore}/10 based on intake answers. (AI assessment unavailable — reasoning generation failed)`,
    qualityReasoning: `Quality score ${scores.qualityScore}/100 based on intake answers. (AI assessment unavailable — reasoning generation failed)`,
    recommendedActions: ["Review intake answers and contact the lead directly."],
  };
}

/**
 * Persists the assessment + writes the deterministic scores to the lead, and
 * always marks the lead 'qualified' — this step must never be skipped even
 * when the AI reasoning call fails, or the lead is stuck unscored forever
 * with no notification ever sent.
 */
async function finalizeLead(
  leadId: string,
  scores: ScoringResult,
  reasoning: ReasoningResult,
  model: string,
  rawResponse: Record<string, unknown>
): Promise<void> {
  await createAiAssessment({
    leadId,
    urgencyReasoning: reasoning.urgencyReasoning,
    qualityReasoning: reasoning.qualityReasoning,
    recommendedActions: reasoning.recommendedActions,
    rawResponse,
    model,
  });

  await updateLead(leadId, {
    urgencyScore: scores.urgencyScore,
    qualityScore: scores.qualityScore,
    estimatedValueLow: scores.estimatedValueLow,
    estimatedValueHigh: scores.estimatedValueHigh,
    leadStatus: "qualified",
  });
}

export async function assessLead(
  leadId: string,
  answers: Answers,
  scores: ScoringResult,
  promptTemplate: string
): Promise<ReasoningResult> {
  if (!process.env.OPENAI_API_KEY) {
    const mock = mockAssessment(scores);
    await finalizeLead(leadId, scores, mock, "mock", { mock: true });
    return mock;
  }

  const MODEL = "gpt-4o";

  let reasoning: ReasoningResult;
  let rawResponse: Record<string, unknown> = { degraded: true };

  try {
    const prompt = buildPrompt(promptTemplate, scores, answers);

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert restoration industry consultant. Respond only with the JSON object requested. Do not change the provided scores.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as ReasoningResult;
    if (!parsed.urgencyReasoning || !parsed.qualityReasoning || !parsed.recommendedActions) {
      throw new Error("Missing fields in AI response");
    }

    reasoning = parsed;
    rawResponse = completion as unknown as Record<string, unknown>;
  } catch (error) {
    // Covers both a malformed/incomplete response AND the OpenAI call itself
    // throwing (network error, rate limit, timeout, etc). Either way, the lead
    // must still get its deterministic scores and reach 'qualified' — falling
    // through silently here would leave it stuck unscored with no notification.
    logger.error("AI reasoning generation failed — falling back to degraded assessment", {
      leadId,
      error: error instanceof Error ? error.message : String(error),
    });
    reasoning = degradedAssessment(scores);
  }

  await finalizeLead(leadId, scores, reasoning, MODEL, rawResponse);
  return reasoning;
}
