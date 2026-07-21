"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MediaSlot, PhoneFrame } from "@/components/marketing/MediaSlot";

/**
 * CallTimeline — one call, played through, on a dark band.
 *
 * This fuses the two strongest pieces of the /v3 and /v5 drafts, which turned
 * out to be the same story told twice:
 *
 *   /v5 gave the SPINE   — five beats stamped with time-relative labels
 *                          ("STILL ON THE CALL") instead of "Step 1/2/3", so the
 *                          reader feels everything happening inside one call.
 *   /v3 gave the DETAIL  — the transcript playing turn by turn while intake
 *                          fields extract and the priority score assembles.
 *
 * Press play and the spine advances in sync with the transcript, ending on the
 * push alert the owner actually receives. You hear the call while watching it
 * become a scored lead. Nevermiss has the audio but no scoring; Retell has
 * neither on the page. This section is the thing neither can answer quickly.
 *
 * AUDIO: `audioSrc` is optional and currently unset. Without it the playthrough
 * is a SCRIPTED animation on measured timings, and the control says so rather
 * than implying a recording is playing. When the real 22s call is recorded, pass
 * it in and drive `step` off `timeupdate` instead of the timers. The beat
 * offsets are already in seconds for exactly that reason.
 *
 * Respects prefers-reduced-motion by rendering the final state. Illustrative
 * scripted content, no real customer data.
 */

// ── The call ─────────────────────────────────────────────────────────────────

const CALLER = "Sarah";
const BUSINESS = "Blue Star Restoration";

type Moment =
  | { kind: "ring"; beat: number; ms: number }
  | { kind: "turn"; beat: number; who: "cv" | "caller"; text: string; fills?: number; ms: number }
  | { kind: "score"; beat: number; ms: number };

/**
 * A beat's copy. The host page owns this, so /v5 can hand in its richer
 * photo-carrying beats while a leaner page passes nothing and gets the
 * defaults. Only the five time-relative labels are fixed: the transcript is
 * keyed to beat INDEX, so the array must stay five long and in order.
 */
export type CallBeat = {
  when: string;
  t: string;
  /** Optional supporting paragraph. */
  d?: string;
  /** Optional image slot rendered under the beat. */
  media?: { title: string; note: string; prompt: string; dims: string };
};

const DEFAULT_BEATS: CallBeat[] = [
  { when: "The phone rings out", t: "Your team is on a job. Nobody picks up." },
  { when: "Callverted picks up", t: "It answers live and asks what a dispatcher would ask." },
  { when: "Still on the call", t: "Any price comes from your rules, word for word." },
  { when: "Before they hang up", t: "It repeats the problem back and names your business." },
  { when: "60 seconds later", t: "The lead is scored and it's already on your phone." },
];

const FIELDS = [
  { label: "Service", value: "Water damage", sub: "Burst supply line", danger: false },
  { label: "Location", value: "Newark, NJ 07104", sub: "Inside service area", danger: false },
  { label: "Urgency", value: "Emergency", sub: "Active spread, finished space", danger: true },
  { label: "Access", value: "On site tonight", sub: "Side entrance, no key needed", danger: false },
];

/** The real composite weighting: 50% urgency, 30% job value, 20% lead quality. */
const COMPONENTS = [
  { label: "Urgency", score: 96, weight: 0.5 },
  { label: "Job value", score: 88, weight: 0.3 },
  { label: "Lead quality", score: 90, weight: 0.2 },
];
const FINAL_SCORE = Math.round(COMPONENTS.reduce((a, c) => a + c.score * c.weight, 0)); // 92

const dur = (text: string) => Math.min(1900, 620 + text.length * 13);

const t = (beat: number, who: "cv" | "caller", text: string, fills?: number): Moment => ({
  kind: "turn",
  beat,
  who,
  text,
  fills,
  ms: dur(text),
});

const MOMENTS: Moment[] = [
  { kind: "ring", beat: 0, ms: 1700 },
  t(1, "cv", `Thanks for calling ${BUSINESS}. The team is out on a job, so I'll take the details and get someone back to you. What's going on?`),
  t(1, "caller", `Hi, this is ${CALLER}. There's water coming into our basement. A pipe burst under the kitchen sink maybe twenty minutes ago.`, 0),
  t(1, "cv", "That sounds stressful. What's the ZIP code where the work is needed?"),
  t(1, "caller", "07104.", 1),
  t(2, "cv", "Got it, that's inside Blue Star's service area. Is the water still running, or did you get the main shut off?"),
  t(2, "caller", "The main's off. But there's a couple of inches down there and it's spreading into the finished room.", 2),
  t(2, "cv", "Because every job is different, I won't quote a price. The team will confirm that with you directly."),
  t(3, "cv", "Can someone let a crew in tonight if they head out?"),
  t(3, "caller", "Yes, I'll be here all night. The side door's open.", 3),
  t(3, "cv", `${CALLER}, we understand you're dealing with water coming into the basement, and that must be stressful. The team at ${BUSINESS} has been notified and will get back to you as soon as possible. Please wait for our callback.`),
  { kind: "score", beat: 4, ms: 2800 },
];

const TOTAL_MS = MOMENTS.reduce((a, m) => a + m.ms, 0);
const OFFSETS = MOMENTS.reduce<number[]>((acc, m, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + MOMENTS[i - 1].ms);
  return acc;
}, []);
const clock = (ms: number) =>
  `${String(Math.floor(ms / 60000)).padStart(1, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

// ── Component ────────────────────────────────────────────────────────────────

export function CallTimeline({
  audioSrc,
  beats = DEFAULT_BEATS,
}: {
  audioSrc?: string;
  beats?: CallBeat[];
}) {
  const BEATS = beats;
  // step = how many moments have STARTED. 0 = idle, MOMENTS.length = finished.
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const started = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
  };

  const advance = useCallback((from: number) => {
    clear();
    if (from >= MOMENTS.length) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => {
      const next = from + 1;
      setStep(next);
      advance(next);
    }, MOMENTS[from].ms);
  }, []);

  const play = useCallback(() => {
    const restart = step >= MOMENTS.length;
    const from = restart ? 0 : step;
    setStep(from + 1);
    setPlaying(true);
    advance(from + 1);
  }, [step, advance]);

  const pause = () => {
    clear();
    setPlaying(false);
  };

  // Reduced motion: render the finished state, never animate.
  useEffect(() => {
    const r = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (r) {
      setReduced(true);
      setStep(MOMENTS.length);
    }
    return clear;
  }, []);

  // Autoplay once when scrolled into view, the way the homepage hero does.
  useEffect(() => {
    if (reduced || started.current || !rootRef.current) return;
    const el = rootRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            play();
            io.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const done = step >= MOMENTS.length;
  const current = Math.min(step, MOMENTS.length) - 1;
  const activeBeat = done ? BEATS.length - 1 : current >= 0 ? MOMENTS[current].beat : 0;
  const elapsed = done ? TOTAL_MS : current >= 0 ? OFFSETS[current] + MOMENTS[current].ms : 0;
  const pct = Math.min(100, (elapsed / TOTAL_MS) * 100);

  const visibleTurns = MOMENTS.slice(0, Math.max(0, step)).filter((m) => m.kind === "turn");
  const filled = new Set(
    visibleTurns.flatMap((m) => (m.kind === "turn" && m.fills !== undefined ? [m.fills] : [])),
  );
  const scoring = done || (current >= 0 && MOMENTS[current].kind === "score");

  return (
    <div ref={rootRef} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      {/* transport */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={playing ? pause : play}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-landing-primary text-white shadow-[0_10px_28px_-8px_rgba(36,84,216,0.7)] transition-colors hover:bg-blue-600"
          aria-label={playing ? "Pause the call" : done ? "Replay the call" : "Play the call"}
        >
          {playing ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1.5" />
              <rect x="14" y="4" width="4" height="16" rx="1.5" />
            </svg>
          ) : done ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="min-w-[160px] flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-cv-heading text-[15px] font-bold text-white">
              {done ? "That call is now a ranked lead" : playing ? "Playing the call" : "Play the call"}
            </p>
            <span className="font-cv-mono text-[11.5px] tabular-nums text-white/50">
              {clock(elapsed)} / {clock(TOTAL_MS)}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-landing-primary-glow transition-[width] duration-300 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* honesty marker: no recording exists yet, so don't imply one is playing */}
      {!audioSrc && (
        <p className="font-cv-mono mt-3 text-[10px] uppercase tracking-[0.12em] text-white/35">
          Scripted playthrough · audio asset pending
        </p>
      )}

      {/* spine */}
      <ol className="mt-7 space-y-0">
        {BEATS.map((b, i) => {
          const state = i < activeBeat ? "past" : i === activeBeat ? "now" : "future";
          const beatTurns = MOMENTS.slice(0, Math.max(0, step)).filter(
            (m) => m.kind === "turn" && m.beat === i,
          );
          const last = i === BEATS.length - 1;
          return (
            <li key={b.when} className="relative flex gap-4 pb-6 last:pb-0 sm:gap-5">
              {/* spine line */}
              {!last && (
                <span
                  className="absolute left-[15px] top-9 bottom-0 w-px sm:left-[17px]"
                  style={{
                    background:
                      state === "past"
                        ? "linear-gradient(180deg, rgba(91,140,255,0.6), rgba(91,140,255,0.25))"
                        : "rgba(255,255,255,0.12)",
                  }}
                  aria-hidden
                />
              )}

              {/* node */}
              <span
                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold transition-all duration-500 sm:h-9 sm:w-9 ${
                  state === "future"
                    ? "bg-white/[0.06] text-white/35 ring-1 ring-white/10"
                    : state === "now"
                      ? "bg-landing-primary text-white ring-4 ring-landing-primary/25"
                      : "bg-landing-primary/25 text-white ring-1 ring-landing-primary/40"
                }`}
              >
                {state === "past" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
                {state === "now" && playing && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-landing-primary opacity-40" aria-hidden />
                )}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={`font-cv-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-500 ${
                    state === "future" ? "text-white/30" : "text-landing-primary-glow"
                  }`}
                >
                  {b.when}
                </p>
                <p
                  className={`font-cv-heading mt-1.5 text-[16px] font-bold leading-snug transition-colors duration-500 sm:text-[18px] ${
                    state === "future" ? "text-white/40" : "text-white"
                  }`}
                >
                  {b.t}
                </p>

                {b.d && (
                  <p
                    className={`mt-2 max-w-xl text-[14px] leading-relaxed transition-colors duration-500 ${
                      state === "future" ? "text-white/30" : "text-white/60"
                    }`}
                  >
                    {b.d}
                  </p>
                )}

                {b.media && (
                  <div className="mt-4 max-w-md">
                    <MediaSlot
                      kind="image"
                      dark
                      className="aspect-[4/3]"
                      title={b.media.title}
                      note={b.media.note}
                      dims={b.media.dims}
                      prompt={b.media.prompt}
                    />
                  </div>
                )}

                {/* transcript turns belonging to this beat */}
                {beatTurns.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {beatTurns.map((m, k) => {
                      if (m.kind !== "turn") return null;
                      const isCv = m.who === "cv";
                      return (
                        <div
                          key={k}
                          className={`max-w-[46ch] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            isCv
                              ? "bg-white/[0.07] text-white/85"
                              : "bg-landing-primary/15 text-white ring-1 ring-landing-primary/25"
                          }`}
                        >
                          <span className="font-cv-mono mb-1 block text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40">
                            {isCv ? "Callverted" : CALLER}
                          </span>
                          {m.text}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* the payoff beat */}
                {last && (
                  <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[auto_1fr] lg:items-start">
                    <PhoneFrame className="w-[220px] shrink-0">
                      <div className="px-3 pb-5 pt-7">
                        <p className="font-cv-mono text-center text-[10px] text-white/40">
                          {scoring ? "now" : "—"}
                        </p>
                        <div
                          className={`mt-3 rounded-2xl bg-white/[0.13] p-3 ring-1 ring-white/15 backdrop-blur transition-all duration-700 ${
                            scoring ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                          }`}
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="font-cv-mono text-[8.5px] font-bold uppercase tracking-wider text-white/55">
                              Callverted
                            </span>
                            <span className="rounded-full bg-[#ff5d5d] px-1.5 py-0.5 text-[8.5px] font-black text-white">
                              Hot · {FINAL_SCORE}
                            </span>
                          </div>
                          <p className="text-[11.5px] font-bold leading-tight text-white">
                            Water damage · Emergency
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-white/60">Est. $1.8k–$3.2k · Newark 07104</p>
                          <p className="mt-1.5 text-[10.5px] font-semibold text-[#8fb0ff]">
                            Call within 10 minutes
                          </p>
                        </div>
                      </div>
                    </PhoneFrame>

                    {/* score assembly */}
                    <div className="min-w-0">
                      <p className="font-cv-mono mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                        How it scored
                      </p>
                      <div className="space-y-2">
                        {COMPONENTS.map((c, ci) => (
                          <div key={c.label} className="flex items-center gap-3">
                            <span className="w-[86px] shrink-0 text-[11.5px] text-white/55">{c.label}</span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                              <span
                                className="block h-full rounded-full bg-landing-primary-glow transition-[width] duration-[900ms] ease-out"
                                style={{
                                  width: scoring ? `${c.score}%` : "0%",
                                  transitionDelay: `${ci * 160}ms`,
                                }}
                              />
                            </span>
                            <span className="font-cv-mono w-8 shrink-0 text-right text-[11.5px] tabular-nums text-white/70">
                              {scoring ? c.score : 0}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-[11.5px] text-white/40">
                        Urgency 50% · job value 30% · lead quality 20%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* extracted fields rail */}
      <div className="mt-2 border-t border-white/10 pt-5">
        <p className="font-cv-mono mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
          Captured while they talked
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FIELDS.map((f, i) => {
            const on = filled.has(i);
            return (
              <div
                key={f.label}
                className={`rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                  on
                    ? "translate-y-0 border-white/15 bg-white/[0.07] opacity-100"
                    : "translate-y-1 border-white/5 bg-white/[0.02] opacity-40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full transition-colors ${
                      on ? "bg-landing-primary text-white" : "bg-white/10 text-transparent"
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="font-cv-mono text-[9.5px] font-bold uppercase tracking-wide text-white/40">
                    {f.label}
                  </span>
                </div>
                <p className={`mt-1 text-[13px] font-bold ${f.danger && on ? "text-[#ff8b84]" : "text-white"}`}>
                  {f.value}
                </p>
                <p className="text-[11px] text-white/45">{f.sub}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
