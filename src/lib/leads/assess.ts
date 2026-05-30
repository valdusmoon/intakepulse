import { openai } from "@/lib/openai";
import { createAiAssessment } from "@/lib/db/queries/aiAssessments";
import { updateLead } from "@/lib/db/queries/leads";
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

export async function assessLead(
  leadId: string,
  answers: Answers,
  scores: ScoringResult,
  promptTemplate: string
): Promise<ReasoningResult> {
  const prompt = buildPrompt(promptTemplate, scores, answers);
  const MODEL = "gpt-4o";

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
  let parsed: ReasoningResult;

  try {
    parsed = JSON.parse(raw) as ReasoningResult;
    if (!parsed.urgencyReasoning || !parsed.qualityReasoning || !parsed.recommendedActions) {
      throw new Error("Missing fields");
    }
  } catch {
    parsed = {
      urgencyReasoning: "Assessment unavailable.",
      qualityReasoning: "Assessment unavailable.",
      recommendedActions: ["Review intake answers and contact the lead directly."],
    };
  }

  // Persist assessment
  await createAiAssessment({
    leadId,
    urgencyReasoning: parsed.urgencyReasoning,
    qualityReasoning: parsed.qualityReasoning,
    recommendedActions: parsed.recommendedActions,
    rawResponse: completion as unknown as Record<string, unknown>,
    model: MODEL,
  });

  // Write scores to lead row (denormalized for list view performance)
  await updateLead(leadId, {
    urgencyScore: scores.urgencyScore,
    qualityScore: scores.qualityScore,
    estimatedValueLow: scores.estimatedValueLow,
    estimatedValueHigh: scores.estimatedValueHigh,
    status: "qualified",
  });

  return parsed;
}
