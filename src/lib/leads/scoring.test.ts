import { describe, it, expect } from "vitest";
import {
  scoreLeadFromAnswers,
  isHighValueLead,
  EMERGENCY_PRIORITY_FLOOR,
  CRITICAL_SIGNAL_PRIORITY_FLOOR,
  SCORE_VERSION,
  type ScoringContext,
} from "./scoring";
import type { ScoringRule, VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { VERTICALS } from "@/lib/verticals/verticalDefinitions";

const BASE_QUESTIONS: VerticalQuestion[] = [
  { key: "service_type", label: "Service", type: "single_select", options: [{ value: "a", label: "A" }], required: true },
];

describe("scoreLeadFromAnswers", () => {
  it("returns the floor scores when no rules match anything", () => {
    const result = scoreLeadFromAnswers({}, [], BASE_QUESTIONS, 150000);
    expect(result.urgencyScore).toBe(1);
    expect(result.qualityScore).toBe(1);
    expect(result.estimatedValueLow).toBe(150000);
    expect(result.estimatedValueHigh).toBe(300000);
  });

  it("estimatedValueHigh is always exactly 2x estimatedValueLow", () => {
    const rules: ScoringRule[] = [{ answerKey: "service_type", answerValue: "a", valueBonus: 123456 }];
    const result = scoreLeadFromAnswers({ service_type: "a" }, rules, BASE_QUESTIONS, 15000);
    expect(result.estimatedValueHigh).toBe(result.estimatedValueLow * 2);
    expect(result.estimatedValueLow).toBe(15000 + 123456);
  });

  it("clamps urgencyScore to 10 even when bonuses exceed the cap", () => {
    const rules: ScoringRule[] = [{ answerKey: "service_type", answerValue: "a", urgencyBonus: 999 }];
    const result = scoreLeadFromAnswers({ service_type: "a" }, rules, BASE_QUESTIONS, 0);
    expect(result.urgencyScore).toBe(10);
  });

  it("clamps qualityScore to 100 even when bonuses exceed the cap", () => {
    const rules: ScoringRule[] = [{ answerKey: "service_type", answerValue: "a", qualityBonus: 999 }];
    const result = scoreLeadFromAnswers({ service_type: "a" }, rules, BASE_QUESTIONS, 0);
    expect(result.qualityScore).toBe(100);
  });

  it("never drops below the floor of 1 for urgency/quality even with zero matching rules", () => {
    const result = scoreLeadFromAnswers({ service_type: "z" }, [{ answerKey: "service_type", answerValue: "a", urgencyBonus: 10 }], BASE_QUESTIONS, 0);
    expect(result.urgencyScore).toBe(1);
    expect(result.qualityScore).toBe(1);
  });

  it("only applies a rule when the answer actually matches its value", () => {
    const rules: ScoringRule[] = [
      { answerKey: "service_type", answerValue: "a", valueBonus: 100000 },
      { answerKey: "service_type", answerValue: "b", valueBonus: 999999 },
    ];
    const result = scoreLeadFromAnswers({ service_type: "a" }, rules, BASE_QUESTIONS, 0);
    expect(result.estimatedValueLow).toBe(100000);
  });

  it("sums bonuses across every matching rule, not just the first", () => {
    // Must include both keys as real questions — filterAnswersToVisible drops
    // any answer whose key isn't among the passed questions (see below).
    const questions: VerticalQuestion[] = [
      ...BASE_QUESTIONS,
      { key: "urgency", label: "Urgency", type: "single_select", options: [{ value: "emergency", label: "Emergency" }], required: true },
    ];
    const rules: ScoringRule[] = [
      { answerKey: "service_type", answerValue: "a", urgencyBonus: 2, qualityBonus: 5, valueBonus: 1000 },
      { answerKey: "urgency", answerValue: "emergency", urgencyBonus: 3, qualityBonus: 5, valueBonus: 2000 },
    ];
    const result = scoreLeadFromAnswers({ service_type: "a", urgency: "emergency" }, rules, questions, 0);
    // urgencyTotal = 5 -> round(1 + (5/15)*9) = round(4) = 4
    expect(result.urgencyScore).toBe(4);
    expect(result.estimatedValueLow).toBe(3000);
  });

  it("matches multi_select answers (arrays) via .includes", () => {
    const rules: ScoringRule[] = [{ answerKey: "service_type", answerValue: "b", valueBonus: 5000 }];
    const result = scoreLeadFromAnswers({ service_type: ["a", "b", "c"] }, rules, BASE_QUESTIONS, 0);
    expect(result.estimatedValueLow).toBe(5000);
  });

  it("excludes orphaned conditional answers from scoring (matches filterAnswersToVisible)", () => {
    const questions: VerticalQuestion[] = [
      { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }], required: true },
      {
        key: "water_category",
        label: "Water category",
        type: "single_select",
        options: [{ value: "cat_3", label: "Sewage" }],
        required: true,
        conditional: { key: "service_type", value: "water" },
      },
    ];
    const rules: ScoringRule[] = [{ answerKey: "water_category", answerValue: "cat_3", urgencyBonus: 4 }];
    // service_type is "fire", so water_category should never have been asked —
    // even though an answer for it is present (stale/orphaned), it must not score.
    const result = scoreLeadFromAnswers({ service_type: "fire", water_category: "cat_3" }, rules, questions, 0);
    expect(result.urgencyScore).toBe(1);
  });

  it("does score a conditional answer when its condition is actually satisfied", () => {
    const questions: VerticalQuestion[] = [
      { key: "service_type", label: "Service", type: "single_select", options: [{ value: "water", label: "Water" }], required: true },
      {
        key: "water_category",
        label: "Water category",
        type: "single_select",
        options: [{ value: "cat_3", label: "Sewage" }],
        required: true,
        conditional: { key: "service_type", value: "water" },
      },
    ];
    const rules: ScoringRule[] = [{ answerKey: "water_category", answerValue: "cat_3", urgencyBonus: 4 }];
    const result = scoreLeadFromAnswers({ service_type: "water", water_category: "cat_3" }, rules, questions, 0);
    expect(result.urgencyScore).toBeGreaterThan(1);
  });

  describe("every seeded vertical produces sane scores end-to-end", () => {
    for (const v of VERTICALS) {
      it(`${v.vertical}: an all-worst-case answer set should hit high urgency/quality`, () => {
        const primary = v.questions[0];
        const answers: Record<string, string> = {
          [primary.key]: primary.options?.[primary.options.length - 1]?.value ?? "",
          urgency: "emergency",
          time_since_issue: "today",
          has_coverage: "covered",
        };
        const result = scoreLeadFromAnswers(answers, v.scoringRules, v.questions, v.baseValueLow);
        expect(result.urgencyScore).toBeGreaterThanOrEqual(1);
        expect(result.urgencyScore).toBeLessThanOrEqual(10);
        expect(result.qualityScore).toBeGreaterThanOrEqual(1);
        expect(result.qualityScore).toBeLessThanOrEqual(100);
        expect(result.estimatedValueLow).toBeGreaterThan(0);
        expect(result.estimatedValueHigh).toBe(result.estimatedValueLow * 2);
      });

      it(`${v.vertical}: a blank/no-signal answer set never crashes and stays at the floor`, () => {
        const result = scoreLeadFromAnswers({}, v.scoringRules, v.questions, v.baseValueLow);
        expect(result.urgencyScore).toBe(1);
        expect(result.qualityScore).toBe(1);
        expect(result.estimatedValueLow).toBe(v.baseValueLow);
      });
    }
  });

  // ─── priorityScore + tier (the composite that ranks leads) ────────────────────
  const HOT = 65;
  const WARM = 40;
  const tierOf = (p: number) => (p >= HOT ? "Hot" : p >= WARM ? "Warm" : "Cool");
  const vertical = (name: string) => {
    const v = VERTICALS.find((x) => x.vertical === name);
    if (!v) throw new Error(`test setup: no vertical ${name}`);
    return v;
  };
  const scoreIn = (name: string, answers: Record<string, string>, ctx?: ScoringContext) => {
    const v = vertical(name);
    return scoreLeadFromAnswers(answers, v.scoringRules, v.questions, v.baseValueLow, ctx);
  };

  describe("priorityScore composite", () => {
    it("priorityScore is always within 0-100", () => {
      for (const v of VERTICALS) {
        const worst = scoreIn(v.vertical, {
          [v.questions[0].key]: v.questions[0].options?.at(-1)?.value ?? "",
          urgency: "emergency",
          time_since_issue: "today",
          has_coverage: "covered",
        });
        expect(worst.priorityScore).toBeGreaterThanOrEqual(0);
        expect(worst.priorityScore).toBeLessThanOrEqual(100);
      }
    });

    // The founder-approved target table (plan §"Fitted target table").
    // Emergency water — the lead this whole change exists to fix — MUST read Hot.
    it("restoration fire + emergency → Hot", () => {
      const s = scoreIn("restoration", { service_type: "fire", urgency: "emergency" });
      expect(tierOf(s.priorityScore)).toBe("Hot");
    });

    it("restoration water + emergency → Hot (the fix; was Cool/Warm)", () => {
      const s = scoreIn("restoration", { service_type: "water", urgency: "emergency" });
      expect(tierOf(s.priorityScore)).toBe("Hot");
    });

    it("restoration mold + soon → Warm", () => {
      const s = scoreIn("restoration", { service_type: "mold", urgency: "soon" });
      expect(tierOf(s.priorityScore)).toBe("Warm");
    });

    it("restoration water + flexible, no other signal → Cool", () => {
      const s = scoreIn("restoration", { service_type: "water", urgency: "flexible" });
      expect(tierOf(s.priorityScore)).toBe("Cool");
    });

    it("qualification (coverage + recency) raises a flexible lead's priority", () => {
      // Both stay Cool at flexible urgency (Warm isn't lowered to catch them), but
      // adding real qualifying signal must move the number up, not down.
      const bare = scoreIn("restoration", { service_type: "water", urgency: "flexible" });
      const qualified = scoreIn("restoration", {
        service_type: "water",
        urgency: "flexible",
        has_coverage: "covered",
        time_since_issue: "today",
      });
      expect(tierOf(bare.priorityScore)).toBe("Cool");
      expect(qualified.priorityScore).toBeGreaterThan(bare.priorityScore);
    });

    it("spam / no-signal 'other' lead → Cool", () => {
      const s = scoreIn("other", { service_type: "general", urgency: "flexible" });
      expect(tierOf(s.priorityScore)).toBe("Cool");
    });

    it("an emergency outranks the same service at flexible urgency", () => {
      const emergency = scoreIn("plumbing", { service_type: "burst_pipe", urgency: "emergency" });
      const flexible = scoreIn("plumbing", { service_type: "burst_pipe", urgency: "flexible" });
      expect(emergency.priorityScore).toBeGreaterThan(flexible.priorityScore);
    });
  });

  describe("priority floors", () => {
    it("a low-value emergency with a matched service floors to Hot", () => {
      // $500 AC repair would blend to ~59 (Warm) — the emergency floor lifts it.
      const s = scoreIn("hvac", { service_type: "ac_repair", urgency: "emergency" });
      expect(s.priorityScore).toBeGreaterThanOrEqual(EMERGENCY_PRIORITY_FLOOR);
      expect(tierOf(s.priorityScore)).toBe("Hot");
    });

    it("an emergency with OFF-LIST service words still floors to Hot", () => {
      // No structured service match, but the caller gave words → service is clear.
      const s = scoreIn("electrical", { urgency: "emergency" }, { serviceRequested: "my panel is buzzing loudly" });
      expect(s.priorityScore).toBeGreaterThanOrEqual(EMERGENCY_PRIORITY_FLOOR);
    });

    it("an emergency with a TRULY unclear service does NOT floor to Hot", () => {
      // No structured service, no off-list words → we can't tell what they need,
      // so the word 'emergency' alone must not float the lead to Hot.
      const s = scoreIn("electrical", { urgency: "emergency" });
      expect(s.priorityScore).toBeLessThan(EMERGENCY_PRIORITY_FLOOR);
    });

    it("a critical-signal phrase in a free-text answer floors higher than a plain emergency", () => {
      const s = scoreIn("restoration", { service_type: "water", urgency: "soon", cause: "active flooding in the basement" });
      expect(s.priorityScore).toBeGreaterThanOrEqual(CRITICAL_SIGNAL_PRIORITY_FLOOR);
      expect(tierOf(s.priorityScore)).toBe("Hot");
      expect(s.trace.floorsApplied).toContain("critical_signal_floor");
    });

    it("critical-signal words passed via signalText also floor", () => {
      const s = scoreIn("plumbing", { service_type: "drain_clog", urgency: "flexible" }, { signalText: "there is a sewage backup coming up the drain" });
      expect(s.priorityScore).toBeGreaterThanOrEqual(CRITICAL_SIGNAL_PRIORITY_FLOOR);
    });

    it("a NEGATED critical-signal phrase does not floor", () => {
      const s = scoreIn("plumbing", { service_type: "drain_clog", urgency: "flexible" }, { signalText: "just checking, there is no sewage backup and I don't smell gas" });
      expect(s.priorityScore).toBeLessThan(CRITICAL_SIGNAL_PRIORITY_FLOOR);
      expect(s.trace.floorsApplied).not.toContain("critical_signal_floor");
    });
  });

  describe("high-value flag (tier-independent)", () => {
    it("a valuable but non-urgent lead stays Cool yet is flagged high-value", () => {
      // The founder-approved behavior: don't lower Warm to catch this — badge it.
      const s = scoreIn("hvac", { service_type: "ac_replacement", urgency: "flexible", has_coverage: "covered" });
      expect(tierOf(s.priorityScore)).toBe("Cool");
      expect(s.valueScore).toBeGreaterThanOrEqual(80);
      expect(isHighValueLead(s.estimatedValueLow)).toBe(true);
    });

    it("a small-ticket lead is not flagged high-value", () => {
      const s = scoreIn("plumbing", { service_type: "drain_clog", urgency: "flexible" });
      expect(isHighValueLead(s.estimatedValueLow)).toBe(false);
    });
  });

  describe("scoreTrace (explainability)", () => {
    it("records version, matched rules, floors, and normalized sub-scores", () => {
      const s = scoreIn("restoration", { service_type: "water", urgency: "emergency" });
      expect(s.trace.version).toBe(SCORE_VERSION);
      expect(s.trace.floorsApplied).toContain("emergency_floor");
      expect(s.trace.valueScore).toBe(s.valueScore);
      expect(s.trace.urgency100).toBeGreaterThan(0);
      // The two rules that should have fired for water + emergency.
      const keys = s.trace.matchedRules.map((r) => `${r.answerKey}=${r.answerValue}`);
      expect(keys).toContain("urgency=emergency");
      expect(keys).toContain("service_type=water");
    });

    it("no floors applied on a plain flexible lead", () => {
      const s = scoreIn("plumbing", { service_type: "drain_clog", urgency: "flexible" });
      expect(s.trace.floorsApplied).toEqual([]);
    });
  });
});
