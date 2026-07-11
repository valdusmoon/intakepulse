"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * An auto-playing, art-directed replay of a real overflow call — captions
 * animate in the way a voice call would unfold, then it flips to a two-audience
 * reveal that makes the core pitch unmistakable:
 *   - the CALLER just gets a fast, calm experience (and never sees any scoring)
 *   - the BUSINESS gets a scored lead packet the instant the caller hangs up
 *
 * This is a scripted showcase, not the live engine — the interactive sandbox
 * below it (InteractiveDemo) is where a visitor can actually drive it. Keeping
 * the hero demo self-playing means a cold visitor feels the product in seconds
 * with zero effort, and in the right modality (a voice call, not a chatbox).
 */

type Step =
  | { kind: "assistant"; text: string }
  | { kind: "caller"; text: string }
  | { kind: "keypad"; digits: string; caption: string };

const SCRIPT: Step[] = [
  { kind: "assistant", text: "Thanks for calling Rapid Restore. I'm their automated intake assistant. Briefly, what's going on?" },
  { kind: "caller", text: "My basement is flooding from a burst dishwasher line. It started this morning and it's already in three rooms." },
  { kind: "assistant", text: "What's the ZIP code where the work is needed? You can say it or key it in." },
  { kind: "keypad", digits: "07641", caption: "Keyed in the ZIP" },
  { kind: "assistant", text: "Is this covered by insurance, warranty, or financing, or out of pocket?" },
  { kind: "keypad", digits: "1", caption: "Insurance / warranty / financing" },
  { kind: "assistant", text: "The team will review the details before discussing pricing. Can I get your name?" },
  { kind: "caller", text: "Nile" },
  { kind: "assistant", text: "Thanks, Nile. I have this noted as an emergency water issue in ZIP 07641. Rapid Restore has the request and will call you back as soon as possible." },
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

// What the business receives the moment the caller hangs up. Everything the
// caller never sees: the tier, the score, the estimated job value, the SLA.
const PACKET = {
  tier: "Hot",
  score: 66,
  estValue: "$4,500 – $9,000",
  action: "Call back within 10 minutes",
  details: [
    { label: "Service", value: "Water damage" },
    { label: "Urgency", value: "Emergency" },
    { label: "ZIP", value: "07641" },
    { label: "Cause", value: "Burst dishwasher line" },
    { label: "Rooms affected", value: "3 rooms" },
  ],
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
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

  // Keep the transcript pinned to the newest line while it plays.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible]);

  const shown = SCRIPT.slice(0, visible);

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
          <p className="text-[11px] text-white/45">
            {phase === "done" ? "Call ended · 0:41" : "Live call · answering now"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Equalizer active={phase === "playing"} />
          {phase === "done" && (
            <button
              onClick={play}
              className="text-[11px] font-semibold text-white/50 hover:text-white transition-colors"
            >
              Replay
            </button>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex flex-col gap-2.5 min-h-[300px] max-h-[340px] overflow-y-auto pr-1">
        {shown.map((step, i) => {
          if (step.kind === "keypad") {
            return (
              <div key={i} className="flex flex-col items-center gap-1 cv-replay-in">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">
                  Pressed {step.digits}
                </span>
                <span className="text-[10.5px] text-white/35">{step.caption}</span>
              </div>
            );
          }
          const isAssistant = step.kind === "assistant";
          return (
            <div key={i} className={`flex cv-replay-in ${isAssistant ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
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

      {/* The reveal — the whole point of the replay */}
      {phase === "done" && <SplitReveal />}
    </div>
  );
}

function SplitReveal() {
  return (
    <div className="mt-4 cv-replay-in">
      <p className="mb-3 text-center text-[11px] uppercase tracking-widest text-white/40 font-semibold">
        One call, two very different sides
      </p>
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

        {/* Business side — the scored packet the caller never sees */}
        <div className="rounded-2xl border border-landing-primary/25 bg-landing-primary/[0.06] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-widest text-landing-primary-glow font-bold">What you receive</p>
            <span className="rounded-full border border-[#ff5a4d]/30 bg-[#ff5a4d]/15 px-2.5 py-0.5 text-[11px] font-extrabold text-[#ff8177]">
              {PACKET.tier} · {PACKET.score}/100
            </span>
          </div>

          <dl className="space-y-1.5 mb-3">
            {PACKET.details.map((d) => (
              <div key={d.label} className="flex justify-between gap-3 text-[13px]">
                <dt className="text-white/45">{d.label}</dt>
                <dd className="font-semibold text-white/90 text-right">{d.value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Est. job value</p>
            <p className="font-cv-heading text-lg font-bold text-white">{PACKET.estValue}</p>
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
        <span
          key={i}
          className="w-[2px] rounded-full bg-landing-primary-glow/80 cv-replay-bar"
          style={{ height: "8px", animationDelay: `${i * 0.15}s` }}
        />
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
