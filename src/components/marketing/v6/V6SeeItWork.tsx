"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * V6SeeItWork — the "See It Work" example selector (locked copy §4).
 *
 * Three tabs (Missed call · Answered call · Website inquiry). Switching a tab
 * swaps ONLY the content — channel badge, transcript, extracted fields, lead
 * packet, outcome badge — while the layout and the play-through animation stay
 * identical. That is the whole point: "Different inputs. Same ranked output."
 *
 * The transcript column reuses /v6's copied V3LiveTranscript look (chat bubbles
 * on the left, a lead record filling in on the right, a score that assembles the
 * moment the call ends). It is folded into this data-driven selector rather than
 * kept as a separate fixed component, so the three examples share one layout.
 *
 * Autoplays on scroll-in, replays on tab switch or the transport button.
 * Reduced-motion visitors get the finished state. Illustrative scripted content.
 */

type Who = "cv" | "team" | "caller" | "customer";

interface Turn {
  who: Who;
  text: string;
}

interface Field {
  label: string;
  value: string;
  /** Field shows once `step` passes this turn index. */
  after: number;
  danger?: boolean;
}

interface Example {
  id: string;
  tab: string;
  channel: { label: string; icon: "phone" | "globe" };
  header: { title: string; sub: string };
  contextBadge: string;
  callerLabel: string;
  turns: Turn[];
  fields: Field[];
  tier: "Hot" | "Warm";
  score?: number;
  outcomeLine: string;
}

const EXAMPLES: Example[] = [
  {
    id: "missed",
    tab: "Missed call",
    channel: { label: "Missed call", icon: "phone" },
    header: { title: "Missed call, answered live", sub: "Rang your team first · no answer · 7:12pm" },
    contextBadge: "Nobody picked up — Callverted answered in 14s.",
    callerLabel: "Sarah",
    turns: [
      { who: "cv", text: "Thanks for calling Blue Star. The team's out on a job, so I'll grab the details and get someone back to you fast. What's going on?" },
      { who: "caller", text: "My water heater just burst, the basement's flooding." },
      { who: "cv", text: "That's an emergency. What's the ZIP, and did you manage to shut the water off?" },
      { who: "caller", text: "It's 33618. I can't find the shutoff." },
    ],
    fields: [
      { label: "Service", value: "Water damage", after: 1 },
      { label: "Urgency", value: "Emergency", after: 1, danger: true },
      { label: "ZIP", value: "33618", after: 3 },
      { label: "Shutoff", value: "Not located", after: 3 },
      { label: "Est. value", value: "$1.8k–$3.2k", after: 3 },
    ],
    tier: "Hot",
    score: 92,
    outcomeLine: "Job · Hot · 92 · call back now.",
  },
  {
    id: "answered",
    tab: "Answered call",
    channel: { label: "Answered call", icon: "phone" },
    header: { title: "Call your team answered", sub: "Captured in the background · 2:04pm" },
    contextBadge: "Your team answered — captured, summarized, and scored anyway.",
    callerLabel: "Caller",
    turns: [
      { who: "team", text: "Blue Star, this is Mike." },
      { who: "caller", text: "Our AC quit and the house won't cool down. The unit's about twelve years old." },
      { who: "team", text: "I can get someone out this week. Let me take your details." },
    ],
    fields: [
      { label: "Service", value: "HVAC repair", after: 1 },
      { label: "System age", value: "12 yrs", after: 1 },
      { label: "Timing", value: "This week", after: 2 },
    ],
    tier: "Warm",
    score: 54,
    outcomeLine: "Job · Warm · 54 · follow up today.",
  },
  {
    id: "website",
    tab: "Website inquiry",
    channel: { label: "Website inquiry", icon: "globe" },
    header: { title: "Website inquiry", sub: "Submitted through your intake widget · 9:41am" },
    contextBadge: "Came in through your website widget.",
    callerLabel: "Website inquiry",
    turns: [
      { who: "customer", text: "Need a quote to remodel a bathroom, timeline flexible." },
      { who: "cv", text: "Got it. I'll capture the details and your team will follow up with a quote." },
    ],
    fields: [
      { label: "Service", value: "Bathroom remodel", after: 0 },
      { label: "Timeline", value: "Flexible", after: 0 },
      { label: "Est. value", value: "$6k–$12k", after: 1 },
    ],
    tier: "Warm",
    outcomeLine: "Job · Warm · call within the hour.",
  },
];

const TIER_TONE = {
  Hot: { text: "text-[#e5484d]", bg: "bg-[#fff1f0]", ring: "ring-[#f7c9c7]", dot: "bg-[#e5484d]" },
  Warm: { text: "text-[#b45309]", bg: "bg-[#fff7ed]", ring: "ring-[#fbdcae]", dot: "bg-[#f59e0b]" },
} as const;

const prefersReduced = () =>
  typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

const durationOf = (t: Turn) => Math.min(1700, 550 + t.text.length * 13);

function ChannelIcon({ icon }: { icon: "phone" | "globe" }) {
  if (icon === "globe") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21C9.5 18.4 8.2 15.3 8.2 12S9.5 5.6 12 3z" />
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" />
    </svg>
  );
}

export function V6SeeItWork() {
  const [activeIdx, setActiveIdx] = useState(0);
  const example = EXAMPLES[activeIdx];
  const TOTAL = example.turns.length + 1; // + the scoring beat
  const finalScore = example.score ?? 0;

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [count, setCount] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const startedOnce = useRef(false);

  const revealed = Math.min(step, example.turns.length);
  const scored = step > example.turns.length;

  const jumpToEnd = useCallback(() => {
    setStep(TOTAL);
    setCount(finalScore);
    setPlaying(false);
  }, [TOTAL, finalScore]);

  const play = useCallback(() => {
    setStep(0);
    setCount(0);
    setPlaying(true);
  }, []);

  // Autoplay the first time it scrolls into view; reduced motion gets the end state.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (prefersReduced()) {
      startedOnce.current = true;
      jumpToEnd();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !startedOnce.current) {
          startedOnce.current = true;
          play();
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [jumpToEnd, play]);

  // Replay whenever the active example changes (after the first view kicks off).
  useEffect(() => {
    if (!startedOnce.current) return;
    if (prefersReduced()) jumpToEnd();
    else play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // The state machine: one timer per beat, re-armed as `step` advances.
  useEffect(() => {
    if (!playing) return;
    if (step >= TOTAL) {
      setPlaying(false);
      return;
    }
    const ms = step < example.turns.length ? durationOf(example.turns[step]) : 700;
    const id = setTimeout(() => setStep((s) => s + 1), ms);
    return () => clearTimeout(id);
  }, [playing, step, TOTAL, example]);

  // Count the score up once the scoring beat lands.
  useEffect(() => {
    if (!scored || !finalScore) return;
    if (count >= finalScore) return;
    const id = setTimeout(() => setCount((c) => Math.min(finalScore, c + 4)), 26);
    return () => clearTimeout(id);
  }, [scored, count, finalScore]);

  // Keep the newest line in view inside the rail (never scrolls the page).
  useEffect(() => {
    const rail = railRef.current;
    if (rail) rail.scrollTop = rail.scrollHeight;
  }, [step]);

  const selectTab = (idx: number) => {
    if (idx === activeIdx) return;
    setStep(0);
    setCount(0);
    setPlaying(false);
    setActiveIdx(idx);
  };

  const progress = Math.min(100, (step / TOTAL) * 100);
  const speakingWho = playing && step < example.turns.length ? example.turns[step].who : null;
  const filledFields = example.fields.filter((f) => step > f.after).length;
  const tone = TIER_TONE[example.tier];
  const leftSide = (who: Who) => who === "cv" || who === "team";
  const labelFor = (who: Who) =>
    who === "cv" ? "Callverted" : who === "team" ? "Your team" : example.callerLabel;

  return (
    <div ref={rootRef}>
      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="mb-3 flex flex-col items-center">
        <div
          role="tablist"
          aria-label="Choose an example"
          className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-[#e3e7ed] bg-white p-1 shadow-sm"
        >
          {EXAMPLES.map((ex, i) => {
            const on = i === activeIdx;
            return (
              <button
                key={ex.id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => selectTab(i)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  on ? "bg-landing-primary text-white shadow-sm" : "text-[#667085] hover:text-[#152033]"
                }`}
              >
                {ex.tab}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[12.5px] font-semibold text-[#667085]">Different inputs. Same ranked output.</p>
      </div>

      {/* ── The card: transcript + record ────────────────────────────────── */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-5">
        {/* Left: the call / inquiry */}
        <div className="flex flex-col overflow-hidden rounded-3xl border border-[#e3e7ed] bg-white shadow-[0_24px_60px_-32px_rgba(16,24,40,0.35)]">
          <div className="flex items-center gap-3 border-b border-[#eef1f4] px-4 py-4 sm:px-6">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-landing-primary/10 text-landing-primary">
              <ChannelIcon icon={example.channel.icon} />
            </span>
            <div className="min-w-0">
              <p className="font-cv-heading text-[14px] font-bold leading-tight text-[#152033]">{example.header.title}</p>
              <p className="truncate text-[11.5px] text-[#667085]">{example.header.sub}</p>
            </div>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#eef3ff] px-2.5 py-1 text-[10.5px] font-bold text-landing-primary">
              <ChannelIcon icon={example.channel.icon} />
              {example.channel.label}
            </span>
          </div>

          {/* context badge */}
          <div className="border-b border-[#eef1f4] bg-[#f9fafb] px-4 py-2.5 sm:px-6">
            <p className="text-[12px] font-semibold text-[#475467]">{example.contextBadge}</p>
          </div>

          <div
            ref={railRef}
            className="max-h-[380px] min-h-[300px] flex-1 space-y-3 overflow-y-auto px-4 py-5 scroll-smooth sm:px-6"
            aria-live="polite"
          >
            {example.turns.slice(0, revealed).map((t, i) => (
              <div key={`${example.id}-${i}`} className={`cv-replay-in ${leftSide(t.who) ? "" : "flex flex-col items-end"}`}>
                <p
                  className={`mb-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    leftSide(t.who) ? "text-landing-primary" : "text-[#98a2b3]"
                  }`}
                >
                  {labelFor(t.who)}
                </p>
                <p
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    leftSide(t.who)
                      ? "rounded-tl-sm bg-[#eef3ff] text-[#152033]"
                      : "rounded-tr-sm bg-[#f4f6f9] text-right text-[#344054]"
                  }`}
                >
                  {t.text}
                </p>
              </div>
            ))}

            {speakingWho && (
              <div className={leftSide(speakingWho) ? "" : "flex justify-end"}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f6f9] px-3 py-2" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[#c1c8d3] animate-pulse"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </span>
              </div>
            )}
          </div>

          {/* transport */}
          <div className="flex items-center gap-3 border-t border-[#eef1f4] bg-[#f9fafb] px-4 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={playing ? () => setPlaying(false) : play}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-landing-primary text-white transition-colors hover:bg-blue-600"
              aria-label={playing ? "Pause" : scored ? "Replay" : "Play"}
            >
              {playing ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1.5" />
                  <rect x="14" y="4" width="4" height="16" rx="1.5" />
                </svg>
              ) : scored ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12a8 8 0 1 1 2.3 5.7" />
                  <path d="M4 17v-5h5" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3e7ed]">
              <span
                className="block h-full rounded-full bg-landing-primary transition-[width] duration-500 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </span>
            <span className="font-cv-mono shrink-0 text-[11px] font-semibold text-[#98a2b3]">
              {scored ? "done" : `${revealed} / ${example.turns.length}`}
            </span>
          </div>
        </div>

        {/* Right: the record filling in + the outcome */}
        <div className="flex flex-col rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-landing-primary">Lead record</p>
            <span className="font-cv-mono text-[11.5px] font-bold text-[#98a2b3]">
              {filledFields}/{example.fields.length}
            </span>
          </div>

          <ul className="space-y-2.5">
            {example.fields.map((f) => {
              const on = step > f.after;
              return (
                <li
                  key={f.label}
                  className={`rounded-xl border px-3.5 py-3 transition-all duration-500 ${
                    on
                      ? "translate-y-0 border-[#dbe3ef] bg-white opacity-100 shadow-sm"
                      : "translate-y-1 border-[#eef1f4] bg-white/50 opacity-45"
                  }`}
                >
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">{f.label}</p>
                  {on ? (
                    <p className={`font-cv-heading text-[15px] font-bold leading-tight ${f.danger ? "text-[#b42318]" : "text-[#152033]"}`}>
                      {f.value}
                    </p>
                  ) : (
                    <span className="mt-1.5 block h-3 w-2/3 rounded-full bg-[#e9edf3]" aria-hidden />
                  )}
                </li>
              );
            })}
          </ul>

          {/* outcome */}
          <div className={`mt-5 border-t border-[#e3e7ed] pt-5 transition-opacity duration-500 ${scored ? "opacity-100" : "opacity-45"}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">Outcome</p>
              {scored && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                  {example.tier}
                  {example.score != null ? ` · ${scored ? count : example.score}` : ""}
                </span>
              )}
            </div>
            <p className={`font-cv-heading text-[19px] font-bold leading-tight ${scored ? tone.text : "text-[#c1c8d3]"}`}>
              {scored ? example.outcomeLine : "Scoring…"}
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[#667085]">
              Same layout, same ranked output. Only the inputs changed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
