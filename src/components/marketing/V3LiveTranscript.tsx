"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * V3 CENTREPIECE — the live transcript + extraction sidebar.
 *
 * The /v3 thesis is that a skeptic should be able to VERIFY the product before
 * they're asked to believe anything about it. Rival voice-AI pages all stop at
 * "here's a voice, listen to it". None of them show the part that actually
 * matters: a call turning into structured, ranked data while you watch.
 *
 * So this plays a real-shaped intake call turn by turn on the left, and fills
 * the lead record on the right at the exact moment the caller says the thing.
 * When the call ends, the three score components assemble and the tier settles
 * on Hot · 92, using the real 50/30/20 urgency/value/quality weighting so the
 * arithmetic holds up if anyone checks it.
 *
 * Autoplays once on scroll-in, replays on demand. Reduced-motion visitors get
 * the finished state immediately, which is also the fallback if the observer
 * never fires. Illustrative scripted content, not a real customer.
 */

type Who = "cv" | "caller";

interface Turn {
  who: Who;
  text: string;
  /** Field index this line unlocks in the sidebar. */
  fills?: number;
}

const CALLER = "Sarah";

const TURNS: Turn[] = [
  { who: "cv", text: "Thanks for calling Blue Star Restoration. The team is out on a job, so I'll take the details and get someone back to you. What's going on?" },
  { who: "caller", text: "Hi, this is Sarah. There's water coming into our basement. A pipe burst under the kitchen sink maybe twenty minutes ago.", fills: 0 },
  { who: "cv", text: "That sounds stressful. What's the ZIP code where the work is needed?" },
  { who: "caller", text: "07104.", fills: 1 },
  { who: "cv", text: "Got it, that's inside Blue Star's service area. Is the water still running, or did you get the main shut off?" },
  { who: "caller", text: "The main's off. But there's a couple of inches down there and it's spreading into the finished room.", fills: 2 },
  { who: "cv", text: "Understood. Can someone let a crew in tonight if they head out?" },
  { who: "caller", text: "Yes, I'll be here all night. The side door's open.", fills: 3 },
  { who: "cv", text: "Sarah, we understand you're dealing with water coming into the basement, and that must be stressful. The team at Blue Star Restoration has been notified and will get back to you as soon as possible." },
];

const FIELDS = [
  { label: "Service", value: "Water damage", sub: "Burst supply line", danger: false },
  { label: "Location", value: "Newark, NJ 07104", sub: "Inside service area", danger: false },
  { label: "Urgency", value: "Emergency", sub: "Active spread, finished space", danger: true },
  { label: "Access", value: "On site tonight", sub: "Side entrance, no key needed", danger: false },
];

/** The real composite: 50% urgency, 30% job value, 20% lead quality. */
const COMPONENTS = [
  { label: "Urgency", score: 96, weight: 0.5 },
  { label: "Job value", score: 88, weight: 0.3 },
  { label: "Lead quality", score: 90, weight: 0.2 },
];

const FINAL_SCORE = Math.round(COMPONENTS.reduce((a, c) => a + c.score * c.weight, 0)); // 92

const TOTAL_STEPS = TURNS.length + 1; // + the scoring beat
const durationOf = (t: Turn) => Math.min(1800, 500 + t.text.length * 14);

export function V3LiveTranscript() {
  /** Turns revealed. TURNS.length means the call is over and scoring runs. */
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [count, setCount] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const startedOnce = useRef(false);

  const scored = step > TURNS.length;
  const finished = scored;

  const jumpToEnd = useCallback(() => {
    setStep(TOTAL_STEPS);
    setCount(FINAL_SCORE);
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    setStep(0);
    setCount(0);
    setPlaying(true);
  }, []);

  // Autoplay the first time it scrolls into view; reduced motion gets the end state.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
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
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [jumpToEnd, play]);

  // The state machine: one timer per beat, re-armed as `step` advances.
  useEffect(() => {
    if (!playing) return;
    if (step >= TOTAL_STEPS) {
      setPlaying(false);
      return;
    }
    const ms = step < TURNS.length ? durationOf(TURNS[step]) : 700;
    const id = setTimeout(() => setStep((s) => s + 1), ms);
    return () => clearTimeout(id);
  }, [playing, step]);

  // Count the composite up once the scoring beat lands.
  useEffect(() => {
    if (!scored) {
      setCount(0);
      return;
    }
    if (count >= FINAL_SCORE) return;
    const id = setTimeout(() => setCount((c) => Math.min(FINAL_SCORE, c + 4)), 26);
    return () => clearTimeout(id);
  }, [scored, count]);

  // Keep the newest line in view inside the rail (never scrolls the page).
  useEffect(() => {
    const rail = railRef.current;
    if (rail) rail.scrollTop = rail.scrollHeight;
  }, [step]);

  const progress = Math.min(100, (step / TOTAL_STEPS) * 100);
  const speaking = playing && step < TURNS.length ? TURNS[step].who : null;

  return (
    <div ref={rootRef} className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4 lg:gap-5 items-stretch">
      {/* ── Left: the call ──────────────────────────────────────────────── */}
      <div className="flex flex-col rounded-3xl border border-[#e3e7ed] bg-white overflow-hidden shadow-[0_24px_60px_-32px_rgba(16,24,40,0.35)]">
        <div className="flex items-center gap-3 border-b border-[#eef1f4] px-4 sm:px-6 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-landing-primary/10 text-landing-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-cv-heading text-[14px] font-bold leading-tight text-[#152033]">Missed call, answered live</p>
            <p className="text-[11.5px] text-[#667085] truncate">Inbound to Blue Star Restoration · 7:12pm</p>
          </div>
          <span
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
              finished ? "bg-[#eaf7f0] text-[#177245]" : "bg-[#fff1f0] text-[#e5484d]"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${finished ? "bg-[#23a35a]" : "bg-[#e5484d] animate-pulse"}`} />
            {finished ? "ENDED" : "LIVE"}
          </span>
        </div>

        <div
          ref={railRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 sm:px-6 py-5 min-h-[340px] max-h-[420px] scroll-smooth"
          aria-live="polite"
        >
          {TURNS.slice(0, step).map((t, i) => (
            <div key={i} className={t.who === "cv" ? "" : "flex flex-col items-end"}>
              <p
                className={`text-[10px] font-bold uppercase tracking-[0.14em] mb-1 ${
                  t.who === "cv" ? "text-landing-primary" : "text-[#98a2b3]"
                }`}
              >
                {t.who === "cv" ? "Callverted" : CALLER}
              </p>
              <p
                className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                  t.who === "cv"
                    ? "rounded-tl-sm bg-[#eef3ff] text-[#152033]"
                    : "rounded-tr-sm bg-[#f4f6f9] text-[#344054] text-right"
                }`}
              >
                {t.text}
              </p>
            </div>
          ))}

          {speaking && (
            <div className={speaking === "cv" ? "" : "flex justify-end"}>
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

          {step === 0 && !playing && (
            <p className="text-[13.5px] text-[#98a2b3]">Press play to hear how a real intake call becomes a ranked lead.</p>
          )}
        </div>

        {/* transport */}
        <div className="flex items-center gap-3 border-t border-[#eef1f4] bg-[#f9fafb] px-4 sm:px-6 py-3.5">
          <button
            type="button"
            onClick={playing ? () => setPlaying(false) : play}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-landing-primary text-white transition-colors hover:bg-blue-600"
            aria-label={playing ? "Pause the transcript" : finished ? "Replay the transcript" : "Play the transcript"}
          >
            {playing ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : finished ? (
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
            {finished ? "0:22 / 0:22" : `${Math.min(TURNS.length, step)} / ${TURNS.length}`}
          </span>
        </div>
      </div>

      {/* ── Right: the record filling in ────────────────────────────────── */}
      <div className="flex flex-col rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-landing-primary">Lead record</p>
          <span className="font-cv-mono text-[11.5px] font-bold text-[#98a2b3]">
            {FIELDS.filter((_, i) => step > unlockAt(i)).length}/{FIELDS.length}
          </span>
        </div>

        <ul className="space-y-2.5">
          {FIELDS.map((f, i) => {
            const on = step > unlockAt(i);
            return (
              <li
                key={f.label}
                className={`rounded-xl border px-3.5 py-3 transition-all duration-500 ${
                  on ? "border-[#dbe3ef] bg-white opacity-100 translate-y-0 shadow-sm" : "border-[#eef1f4] bg-white/50 opacity-45 translate-y-1"
                }`}
              >
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">{f.label}</p>
                {on ? (
                  <>
                    <p className={`font-cv-heading text-[15px] font-bold leading-tight ${f.danger ? "text-[#b42318]" : "text-[#152033]"}`}>
                      {f.value}
                    </p>
                    <p className="text-[11.5px] text-[#667085] mt-0.5">{f.sub}</p>
                  </>
                ) : (
                  <span className="mt-1.5 block h-3 w-2/3 rounded-full bg-[#e9edf3]" aria-hidden />
                )}
              </li>
            );
          })}
        </ul>

        {/* score assembly */}
        <div
          className={`mt-5 pt-5 border-t border-[#e3e7ed] transition-opacity duration-500 ${
            scored ? "opacity-100" : "opacity-45"
          }`}
        >
          <div className="space-y-2 mb-4">
            {COMPONENTS.map((c) => (
              <div key={c.label} className="flex items-center gap-2.5">
                <span className="w-[74px] shrink-0 text-[10.5px] font-semibold text-[#667085]">{c.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3e7ed]">
                  <span
                    className="block h-full rounded-full bg-landing-primary transition-[width] duration-700 ease-out"
                    style={{ width: scored ? `${c.score}%` : "0%" }}
                  />
                </span>
                <span className="font-cv-mono w-6 shrink-0 text-right text-[10.5px] font-bold text-[#98a2b3]">
                  {scored ? c.score : "--"}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors duration-500 ${
              scored ? "bg-[#fff1f0]" : "bg-white"
            }`}
          >
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">Priority</p>
              <p className={`font-cv-heading text-[19px] font-bold leading-tight ${scored ? "text-[#e5484d]" : "text-[#c1c8d3]"}`}>
                Hot · {scored ? count : "--"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">Next action</p>
              <p className={`text-[13px] font-bold ${scored ? "text-landing-primary" : "text-[#c1c8d3]"}`}>
                Call within 10 minutes
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11.5px] leading-relaxed text-[#667085]">
            Scored on urgency, job value, and lead quality. The same record lands on your phone and in your inbox in
            about a minute.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Index of the turn that fills field `i`; the field shows once step passes it. */
function unlockAt(i: number) {
  const idx = TURNS.findIndex((t) => t.fills === i);
  return idx === -1 ? Infinity : idx;
}
