import { getVisibleQuestions, type Answers } from "@/lib/verticals/filterAnswers";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

/**
 * Channel-agnostic honest intake status: 'completed' only when every visible ASKABLE
 * (non-voiceExtractOnly) question is answered — the primary question counts as answered
 * via an off-list serviceRequested. Mirrors voice's deriveIntakeStatus semantics for
 * contexts without a live call session ('abandoned' doesn't apply — nobody hung up
 * mid-intake; the team simply didn't ask).
 */
export function deriveIntakeStatusFromAnswers(
  questions: VerticalQuestion[],
  answers: Answers,
  serviceRequested: string | null
): "not_started" | "started" | "completed" {
  const hasAny = Object.keys(answers).length > 0 || !!serviceRequested;
  if (!hasAny) return "not_started";
  const primaryKey = questions[0]?.key;
  const visible = getVisibleQuestions(questions, answers);
  const askable = visible.filter((q) => !q.voiceExtractOnly);
  const answered = (q: VerticalQuestion) =>
    q.key in answers || (q.key === primaryKey && !!serviceRequested);
  return askable.every(answered) ? "completed" : "started";
}
