import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";

export type Answers = Record<string, string | string[]>;

export function getVisibleQuestions(
  questions: VerticalQuestion[],
  answers: Answers
): VerticalQuestion[] {
  return questions.filter((q) => {
    if (!q.conditional) return true;
    const { key, value } = q.conditional;
    const answer = answers[key];
    return Array.isArray(answer) ? answer.includes(value) : answer === value;
  });
}

export function filterAnswersToVisible(
  questions: VerticalQuestion[],
  answers: Answers
): Answers {
  const visible = getVisibleQuestions(questions, answers);
  const visibleKeys = new Set(visible.map((q) => q.key));
  return Object.fromEntries(
    Object.entries(answers).filter(([key]) => visibleKeys.has(key))
  );
}
