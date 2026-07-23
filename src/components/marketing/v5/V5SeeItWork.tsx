"use client";

import { useEffect, useState } from "react";

/**
 * V5SeeItWork — the §4 example selector for /v5 (a genuinely new UI piece).
 *
 * Three tabs — Missed call · Answered call · Website inquiry. Switching a tab
 * swaps ONLY the transcript, the extracted fields, the lead packet, the outcome
 * badge, and the channel badge; the layout and the fade-in animation are
 * identical across tabs. The takeaway line is fixed: "Different inputs. Same
 * ranked output." Illustrative scripted content, no real customer data.
 */

type Tier = "Hot" | "Warm";

type Example = {
  key: string;
  tab: string;
  /** How this opportunity came in — the contextual channel badge. */
  channelBadge: string;
  /** Optional implementation detail shown under the transcript (missed call). */
  channelNote?: string;
  transcript: string;
  fields: string[];
  tier: Tier;
  score?: string;
  action: string;
};

const EXAMPLES: Example[] = [
  {
    key: "missed",
    tab: "Missed call",
    channelBadge: "Nobody picked up — Callverted answered in 14s.",
    channelNote: "Your team didn't pick up. The AI voice agent answered after ~15 seconds.",
    transcript: "My water heater just burst, the basement's flooding.",
    fields: ["Water damage", "Emergency", "ZIP 33618", "Shutoff not located", "$1.8k–$3.2k"],
    tier: "Hot",
    score: "92",
    action: "Call back now",
  },
  {
    key: "answered",
    tab: "Answered call",
    channelBadge: "Your team answered — captured, summarized, and scored anyway.",
    transcript: "It's not cooling at all and it's 90 out. The system's about twelve years old.",
    fields: ["HVAC repair", "This week", "System 12 yrs"],
    tier: "Warm",
    score: "54",
    action: "Follow up today",
  },
  {
    key: "website",
    tab: "Website inquiry",
    channelBadge: "Came in through your website widget.",
    transcript: "Need a quote to remodel a bathroom, timeline flexible.",
    fields: ["Bathroom remodel", "Flexible timeline", "$6k–$12k"],
    tier: "Warm",
    action: "Call within the hour",
  },
];

const TIER_PILL: Record<Tier, string> = {
  Hot: "bg-[#fff1f0] text-[#e5484d] ring-[#e5484d]/20",
  Warm: "bg-[#fff7ed] text-[#c2410c] ring-[#c2410c]/20",
};

export function V5SeeItWork() {
  const [active, setActive] = useState(0);
  const ex = EXAMPLES[active];

  return (
    <div>
      {/* tab bar — segmented control */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-[#e3e7ed] bg-[#f2f4f7] p-1 text-sm font-semibold">
          {EXAMPLES.map((e, i) => (
            <button
              key={e.key}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={`rounded-full px-4 py-1.5 transition-colors ${
                active === i ? "bg-white text-landing-primary shadow-sm" : "text-[#667085] hover:text-[#344054]"
              }`}
            >
              {e.tab}
            </button>
          ))}
        </div>
      </div>

      {/* keyed on the active tab so the panels re-fade on every switch */}
      <ExampleView key={ex.key} ex={ex} />

      <p className="mt-6 text-center text-[13.5px] font-semibold text-[#344054]">Different inputs. Same ranked output.</p>
    </div>
  );
}

function ExampleView({ ex }: { ex: Example }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const fade = (delay: number): React.CSSProperties => ({
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(10px)",
    transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
    transitionDelay: `${delay}ms`,
  });

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
      {/* Left — the transcript, on a dark call panel */}
      <div
        className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1226] p-6 sm:p-8"
        style={fade(0)}
      >
        <div className="pointer-events-none absolute -top-16 -left-10 h-48 w-48 rounded-full bg-landing-primary/20 blur-3xl" aria-hidden />
        <div className="relative mb-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold text-white/75 ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-[#23a35a]" />
            {ex.channelBadge}
          </span>
        </div>
        <p className="font-cv-heading relative text-[22px] font-semibold leading-relaxed text-white/90 sm:text-[27px]">
          &ldquo;{ex.transcript}&rdquo;
        </p>
        <div className="relative mt-auto flex items-start gap-2 pt-6 text-[12.5px] text-white/50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
            <path d="M12 3a9 9 0 1 0 9 9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {ex.channelNote ?? "Captured live. No form, no menu, nobody typed a thing."}
        </div>
      </div>

      {/* Right — extracted facts + the ranked lead packet */}
      <div className="rounded-3xl border border-[#e3e7ed] bg-white p-6 sm:p-7" style={fade(90)}>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-landing-primary">Understood instantly</span>
          <span className="font-cv-mono text-[12px] font-bold text-[#98a2b3]">
            {ex.fields.length}/{ex.fields.length}
          </span>
        </div>
        <ul className="space-y-2">
          {ex.fields.map((f) => (
            <li key={f} className="flex items-center gap-3 rounded-xl border border-[#c9ead9] bg-[#f3faf6] px-3.5 py-2.5">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#23a35a] text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="text-[14px] font-bold text-[#152033]">{f}</span>
            </li>
          ))}
        </ul>

        {/* the ranked lead packet */}
        <div className="mt-5 rounded-2xl border border-[#e3e7ed] bg-[#f9fafb] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#667085]">Ranked lead</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${TIER_PILL[ex.tier]}`}
            >
              Job · {ex.tier}
              {ex.score ? ` · ${ex.score}` : ""}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#eef3ff] px-3 py-2.5 ring-1 ring-landing-primary/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="shrink-0 text-landing-primary">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <p className="text-[13.5px] font-bold text-landing-primary">{ex.action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
