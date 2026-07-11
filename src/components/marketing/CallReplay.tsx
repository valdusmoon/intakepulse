"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * An auto-playing, art-directed replay of a real overflow call. The point it
 * has to land is the product's core mechanic: the caller speaks naturally, and
 * Callverted EXTRACTS several facts from one sentence and only asks for what's
 * still missing. So alongside the transcript a live "intake" panel fills in as
 * the call plays — five fields snap in the instant the caller describes the
 * problem, then ZIP / coverage / name arrive as they're asked. It ends on a
 * two-audience reveal: the caller just got a fast, calm experience; the business
 * gets a scored lead packet the caller never sees.
 *
 * Scripted showcase, not the live engine — the interactive sandbox below it
 * (InteractiveDemo) is where a visitor drives the real thing. Self-playing means
 * a cold visitor feels it in seconds, zero effort, in the right modality.
 */

type Capture = Record<string, string>;
type Step =
  | { kind: "assistant"; text: string }
  | { kind: "caller"; text: string; capture?: Capture }
  | { kind: "keypad"; digits: string; caption: string; capture?: Capture };

// The intake fields, in the order they fill. `value` is what the caller never
// re-states — proof the engine caught it the first time.
const SLOTS = [
  { key: "service", label: "Service" },
  { key: "urgency", label: "Urgency" },
  { key: "cause", label: "Cause" },
  { key: "rooms", label: "Rooms" },
  { key: "started", label: "Started" },
  { key: "zip", label: "ZIP" },
  { key: "coverage", label: "Coverage" },
  { key: "name", label: "Name" },
] as const;

const SCRIPT: Step[] = [
  { kind: "assistant", text: "Thanks for calling Rapid Restore. I'm their automated intake assistant. Briefly, what's going on?" },
  {
    kind: "caller",
    text: "My basement is flooding from a burst dishwasher line. It started this morning and it's already in three rooms.",
    // The magic moment: one sentence → five fields at once.
    capture: { service: "Water damage", urgency: "Emergency", cause: "Dishwasher line", rooms: "3 rooms", started: "This morning" },
  },
  { kind: "assistant", text: "What's the ZIP code where the work is needed? You can say it or key it in." },
  { kind: "keypad", digits: "07641", caption: "Keyed in the ZIP", capture: { zip: "07641" } },
  { kind: "assistant", text: "Is this covered by insurance, warranty, or financing, or out of pocket?" },
  { kind: "keypad", digits: "1", caption: "Insurance / warranty / financing", capture: { coverage: "Insurance" } },
  { kind: "assistant", text: "The team will review the details before discussing pricing. Can I get your name?" },
  { kind: "caller", text: "Sarah", capture: { name: "Sarah" } },
  { kind: "assistant", text: "Thanks, Sarah. I have this noted as an emergency water issue in ZIP 07641. Rapid Restore has the request and will call you back as soon as possible." },
];

// What the caller actually got — the experience, not any analysis. Deliberately
// no numbers here: the point is the caller never hears a score or a value.
const CALLER_EXPERIENCE = [
  "Answered on the first ring, day or night",
  "Guided through in about forty seconds",
  "No hold music, no web form to fill out",
  "Told a real person will confirm pricing",
  "Promised a fast callback — and believed it",
];

// The scored output the caller never sees. The raw facts live in the capture
// panel above; this is only what SCORING produced from them.
const PACKET = {
  tier: "Hot",
  score: 66,
  estValue: "$4,500 – $9,000",
  action: "Call back within 10 minutes",
};

// Reveal pacing — a base beat plus reading time, so long lines linger and short
// keypad taps snap by. Capped so nothing drags.
function stepDelay(step: Step): number {
  if (step.kind === "keypad") return 850;
  const len = step.text.length;
  return Math.min(900 + len * 32, 3000);
}

export function CallReplay() {
  const [visible, setVisible] = useState(0); // how many script steps are shown
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasPlayed = useRef(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const play = useCallback(() => {
    clearTimers();
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(SCRIPT.length);
      setPhase("done");
      return;
    }
    setVisible(0);
    setPhase("playing");
    let acc = 400;
    for (let i = 0; i < SCRIPT.length; i++) {
      acc += stepDelay(SCRIPT[i]);
      timers.current.push(setTimeout(() => setVisible(i + 1), acc));
    }
    timers.current.push(setTimeout(() => setPhase("done"), acc + 700));
  }, [clearTimers]);

  // Start only once the replay scrolls into view, so it isn't already finished
  // by the time the visitor gets to it.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          play();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimers();
    };
  }, [play, clearTimers]);

  const shown = SCRIPT.slice(0, visible);
  const captured: Capture = Object.assign({}, ...shown.map((s) => ("capture" in s && s.capture) || {}));

  return (
    <div
      ref={rootRef}
      className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 sm:p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]"
    >
      {/* Call header — reads as a live voice line, not a chat window */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-landing-primary/20 text-landing-primary-glow">
          <PhoneGlyph />
        </span>
        <div className="min-w-0">
          <p className="font-cv-heading text-[15px] font-bold leading-tight">Rapid Restore · overflow line</p>
          <p className="text-[11px] text-white/45">{phase === "done" ? "Call ended · 0:41" : "Live call · answering now"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Equalizer active={phase === "playing"} />
          {phase === "done" && (
            <button onClick={play} className="text-[11px] font-semibold text-white/50 hover:text-white transition-colors">
              Replay
            </button>
          )}
        </div>
      </div>

      {/* Transcript + live intake, side by side (stacked on mobile). The
          transcript grows to fit as the call plays — no scroll box, so it reads
          like a controlled screen rather than a scrolling chat log. */}
      <div className="grid gap-4 md:grid-cols-[1.25fr_1fr] items-start">
        <div className="flex flex-col gap-2.5 min-h-[264px]">
          {shown.map((step, i) => {
            if (step.kind === "keypad") {
              return (
                <div key={i} className="flex flex-col items-center gap-1 cv-replay-in">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">Pressed {step.digits}</span>
                  <span className="text-[10.5px] text-white/35">{step.caption}</span>
                </div>
              );
            }
            const isAssistant = step.kind === "assistant";
            return (
              <div key={i} className={`flex cv-replay-in ${isAssistant ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    isAssistant ? "bg-white/[0.07] text-white/85 rounded-bl-sm" : "bg-landing-primary text-white rounded-br-sm"
                  }`}
                >
                  {isAssistant && (
                    <span className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-landing-primary-glow/80 font-bold">
                      <MiniWave /> Callverted
                    </span>
                  )}
                  {step.text}
                </div>
              </div>
            );
          })}
          {phase === "playing" && visible < SCRIPT.length && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/[0.07] px-3.5 py-3">
                <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        <CapturePanel captured={captured} />
      </div>

      {/* The reveal — the whole point of the replay */}
      {phase === "done" && <SplitReveal />}
    </div>
  );
}

/** Live intake: the fields Callverted has pulled so far vs. what it still needs.
 *  Captured fields carry the value the caller never had to repeat. */
function CapturePanel({ captured }: { captured: Capture }) {
  const done = SLOTS.filter((s) => captured[s.key]);
  const pending = SLOTS.filter((s) => !captured[s.key]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-widest text-white/50 font-bold">Live intake</span>
        <span className="font-cv-mono text-[11px] text-landing-primary-glow font-bold">{done.length}/{SLOTS.length}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {done.map((s) => (
          <div key={s.key} className="flex items-center gap-2 cv-replay-in">
            <CheckGlyph />
            <span className="text-[11px] text-white/45 w-[62px] shrink-0">{s.label}</span>
            <span className="text-[12.5px] font-semibold text-white/90 truncate">{captured[s.key]}</span>
          </div>
        ))}
        {pending.map((s) => (
          <div key={s.key} className="flex items-center gap-2 opacity-45">
            <span className="grid place-items-center w-[15px] h-[15px] shrink-0" aria-hidden>
              <span className="w-2 h-2 rounded-full border border-white/40" />
            </span>
            <span className="text-[11px] text-white/40 w-[62px] shrink-0">{s.label}</span>
            <span className="text-[12px] text-white/30">waiting…</span>
          </div>
        ))}
      </div>

      {pending.length === 0 && (
        <p className="mt-3 pt-3 border-t border-white/10 text-[11px] text-white/45 leading-snug">
          Only what was missing got asked. The rest came from one sentence.
        </p>
      )}
    </div>
  );
}

function SplitReveal() {
  return (
    <div className="mt-4 cv-replay-in">
      <p className="mb-3 text-center text-[11px] uppercase tracking-widest text-white/40 font-semibold">One call, two very different sides</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Caller side — experience only, zero numbers */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-white/50 font-bold">What your caller experiences</p>
          <ul className="space-y-2">
            {CALLER_EXPERIENCE.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-white/80">
                <CheckGlyph />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Business side — the SCORED output (raw facts are in the capture panel) */}
        <div className="rounded-2xl border border-landing-primary/25 bg-landing-primary/[0.06] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-widest text-landing-primary-glow font-bold">What you receive</p>
            <span className="rounded-full border border-[#ff5a4d]/30 bg-[#ff5a4d]/15 px-2.5 py-0.5 text-[11px] font-extrabold text-[#ff8177]">
              {PACKET.tier} · {PACKET.score}/100
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Est. job value</p>
              <p className="font-cv-heading text-lg font-bold text-white">{PACKET.estValue}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Lead score</p>
              <p className="font-cv-heading text-lg font-bold text-white">{PACKET.score}/100</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-landing-primary-glow" />
            <p className="text-[13px] font-semibold text-white/85">{PACKET.action}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11.5px] text-white/40">
        The score, the value, and the callback window are for you. Your caller never sees them.
      </p>
    </div>
  );
}

function PhoneGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg className="mt-0.5 shrink-0 text-landing-primary-glow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// A little speaking indicator on the assistant's lines.
function MiniWave() {
  return (
    <span className="inline-flex items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-[2px] rounded-full bg-landing-primary-glow/80 cv-replay-bar" style={{ height: "8px", animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

// The header equalizer — animates while the call is live, flat when it ends.
function Equalizer({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-end gap-[2px] h-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-[2.5px] rounded-full bg-landing-primary-glow/70 ${active ? "cv-replay-bar" : ""}`}
          style={{ height: active ? "6px" : "3px", animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}
