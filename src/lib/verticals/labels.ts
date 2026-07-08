import type { VerticalConfig, VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

export function humanizeKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAnswerOptionLabel(question: VerticalQuestion | undefined, value: string) {
  const opt = question?.options?.find((o) => o.value === value);
  return opt?.label ?? value;
}

/** Ordered, human-labeled intake answers for display — orders by the vertical's question order, unknown keys last. */
export function formatIntakeAnswers(
  questions: VerticalQuestion[],
  answers: Record<string, string | string[]> | null | undefined
) {
  if (!answers) return [];
  const qMap = new Map(questions.map((q) => [q.key, q]));
  return Object.entries(answers)
    .sort(([a], [b]) => {
      const ai = questions.findIndex((q) => q.key === a);
      const bi = questions.findIndex((q) => q.key === b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    })
    .map(([key, value]) => {
      const q = qMap.get(key);
      const label = q?.label ?? humanizeKey(key);
      const val = Array.isArray(value)
        ? value.map((v) => getAnswerOptionLabel(q, v)).join(", ")
        : getAnswerOptionLabel(q, value as string);
      return { key, label, value: val };
    });
}

/**
 * Best-effort "what does this lead need" one-liner, derived from the first
 * question in the vertical's Q&A (the primary categorization question, e.g.
 * damage_type) — there's no dedicated free-text "service" field in the data
 * model, so this is the closest honest proxy across all verticals.
 */
export function deriveServiceLabel(
  verticalConfig: Pick<VerticalConfig, "questions"> | null | undefined,
  answers: Record<string, string | string[]> | null | undefined
): string | null {
  if (!verticalConfig || !answers) return null;
  const primary = verticalConfig.questions[0];
  if (!primary) return null;
  const raw = answers[primary.key];
  if (!raw) return null;
  const label = Array.isArray(raw) ? raw.map((v) => getAnswerOptionLabel(primary, v)).join(", ") : getAnswerOptionLabel(primary, raw);
  return label;
}

/**
 * Short supporting detail line for list views — the next 1-2 answered
 * questions after the primary one, joined plainly. Real data, not an AI
 * summary (no per-row join needed for list rendering).
 */
export function deriveReasonLine(
  verticalConfig: Pick<VerticalConfig, "questions"> | null | undefined,
  answers: Record<string, string | string[]> | null | undefined
): string | null {
  if (!verticalConfig || !answers) return null;
  const formatted = formatIntakeAnswers(verticalConfig.questions, answers);
  const rest = formatted.slice(1, 3);
  if (rest.length === 0) return null;
  return rest.map((a) => a.value).join(" · ");
}
