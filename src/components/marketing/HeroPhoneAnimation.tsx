"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hero phone animation — the emotional arc of the product: a call rings
 * unanswered at 2:47 AM, Callverted answers it, runs a short intake, and hands
 * back a scored lead card. Four beats crossfade on a loop; the step chips below
 * let a visitor jump to any beat.
 *
 * This used to be a Remotion <Player> (a heavy client runtime shipped above the
 * fold). It's now plain CSS/JS — same arc, a fraction of the bundle, reliable
 * autoplay — matching the CallReplay approach used elsewhere on the page. The
 * scenario (HVAC no-heat, Marcus Webb) is deliberately different from the
 * Rapid Restore / water demo lower down, to show breadth across urgent trades.
 */

const BEATS = [
  { key: "ringing", time: "0:00", label: "Rings unanswered", accent: "text-landing-alert", body: "Your team gets the first ring. No answer in ~15 seconds, Callverted keeps the same caller on the line.", ms: 3200 },
  { key: "answered", time: "0:04", label: "AI answers", accent: "text-landing-primary-glow", body: "No voicemail, no text-back delay. Callverted answers the missed call live.", ms: 2600 },
  { key: "intake", time: "0:22", label: "Qualifies", accent: "text-landing-purple", body: "The caller is reassured while Callverted collects job details, urgency, and service fit.", ms: 4600 },
  { key: "captured", time: "1:10", label: "Lead captured", accent: "text-landing-green", body: "The result is a callback-ready lead with urgency, intent, estimated value, transcript, and next action.", ms: 5200 },
] as const;

const CAPTURED = 3;

export function HeroPhoneAnimation() {
  const [beat, setBeat] = useState(0);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = (m: boolean) => {
      setReduced(m);
      if (m) setBeat(CAPTURED); // pin to the payoff, no motion
    };
    apply(mq.matches);
    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  // Auto-advance through the beats and loop. Re-armed whenever `beat` changes,
  // so a manual chip click (which sets `beat`) resets the dwell cleanly.
  useEffect(() => {
    if (reduced) return;
    timer.current = setTimeout(() => setBeat((b) => (b + 1) % BEATS.length), BEATS[beat].ms);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [beat, reduced]);

  function jump(i: number) {
    if (timer.current) clearTimeout(timer.current);
    setBeat(i);
  }

  return (
    <div className="mx-auto max-w-[300px]">
      <div className="relative w-[280px] sm:w-[300px] mx-auto">
        {/* Layered ambient glow */}
        <div className="absolute inset-0 -z-10 rounded-[3rem] opacity-30 blur-[70px]" style={{ background: "radial-gradient(circle at 50% 40%, rgba(91,140,255,.45), transparent 75%)" }} aria-hidden />
        <div className="absolute inset-0 -z-10 rounded-[3rem] opacity-50 blur-3xl" style={{ background: "radial-gradient(circle at 50% 35%, rgba(59,108,255,.35), transparent 70%)" }} aria-hidden />

        {/* Signal rings — a call ping radiating outward. Only while ringing. */}
        {!reduced && beat === 0 && (
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <span className="cv-signal-ring" style={{ animationDelay: "0s" }} />
            <span className="cv-signal-ring" style={{ animationDelay: "1.05s" }} />
            <span className="cv-signal-ring" style={{ animationDelay: "2.1s" }} />
          </div>
        )}

        {/* Phone bezel */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#232d47] bg-[#05070d] p-2.5 shadow-[0_30px_80px_rgba(0,0,0,.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-60" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.1), transparent)" }} aria-hidden />
          <div className="absolute left-1/2 top-2.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#0a0f1c]" aria-hidden />

          {/* Screen */}
          <div className="relative overflow-hidden rounded-[2rem]" style={{ aspectRatio: "360 / 740", background: "linear-gradient(180deg,#0d1526,#0a0f1c)" }}>
            <RingingScreen active={beat === 0} animate={!reduced} />
            <AnsweredScreen active={beat === 1} />
            <IntakeScreen active={beat === 2} />
            <LeadCardScreen active={beat === CAPTURED} />
          </div>
        </div>
      </div>

      {/* Step chips — jump to a beat; the active chip tracks the loop. */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {BEATS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => jump(i)}
            className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
              beat === i ? "border-landing-primary-glow/60 bg-white/8" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            }`}
          >
            <span className={`block font-cv-mono text-[10px] ${beat === i ? step.accent : "text-white/35"}`}>{step.time}</span>
            <span className={`block text-[12.5px] font-semibold mt-0.5 ${beat === i ? "text-white" : "text-white/60"}`}>{step.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-white/50 text-center min-h-[2.5em] leading-snug">{BEATS[beat].body}</p>
    </div>
  );
}

/** Each screen fills the phone and crossfades; inactive ones are inert. */
function Screen({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      {children}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6.5 10.7c1.45 2.85 3.85 5.25 6.7 6.7l2.2-2.2c.3-.3.75-.4 1.15-.26 1.05.35 2.18.55 3.45.55.62 0 1.1.48 1.1 1.1v3.25c0 .62-.48 1.1-1.1 1.1C10.62 20.94 3.05 13.38 3.05 4c0-.62.48-1.1 1.1-1.1H7.4c.62 0 1.1.48 1.1 1.1 0 1.25.18 2.4.55 3.45.14.4.04.84-.26 1.14l-2.3 2.1Z" fill="white" />
    </svg>
  );
}

function RingingScreen({ active, animate }: { active: boolean; animate: boolean }) {
  return (
    <Screen active={active}>
      <div className="flex flex-col items-center gap-[22px]">
        <div className="font-cv-mono text-[13px] tracking-wide text-[#7d8bb0]">2:47 AM</div>
        <div className="relative flex h-[78px] w-[78px] items-center justify-center">
          {active && animate &&
            [0, 0.6, 1.2].map((d) => (
              <span key={d} className="absolute h-[58px] w-[58px] rounded-full bg-[#5b8cff]/30 animate-ping" style={{ animationDelay: `${d}s` }} aria-hidden />
            ))}
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full shadow-[0_0_26px_rgba(91,140,255,.45)]" style={{ background: "linear-gradient(145deg,#2454d8,#173a8f)" }}>
            <PhoneIcon />
          </div>
        </div>
        <div className="text-center">
          <div className="font-cv-heading text-xl font-extrabold text-[#f5f7ff]">Unknown Caller</div>
          <div className="mt-1 text-[12.5px] text-[#7d8bb0]">mobile · Newark, NJ</div>
        </div>
      </div>
    </Screen>
  );
}

function AnsweredScreen({ active }: { active: boolean }) {
  return (
    <Screen active={active}>
      <div className="flex flex-col items-center gap-3.5 px-6">
        <div className="flex items-center gap-2 rounded-full border border-[#5b8cff]/40 bg-[#2454d8]/[0.16] px-3.5 py-2">
          <span className="h-2 w-2 rounded-full bg-[#5b8cff]" />
          <span className="text-[13px] font-extrabold text-[#dbe4ff]">Answered by Callverted</span>
        </div>
        <p className="w-[230px] text-center text-[13px] leading-relaxed text-[#7d8bb0]">
          Your team still gets the first chance. Callverted only takes over when the call would have gone cold.
        </p>
      </div>
    </Screen>
  );
}

function Bubble({ align, children }: { align: "left" | "right"; children: React.ReactNode }) {
  const right = align === "right";
  return (
    <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[84%] px-3 py-2.5 text-[12.5px] leading-[1.45]"
        style={{
          borderRadius: 15,
          borderBottomRightRadius: right ? 5 : 15,
          borderBottomLeftRadius: right ? 15 : 5,
          background: right ? "#1b2540" : "linear-gradient(145deg,#2454d8,#1d47bd)",
          color: right ? "#dde3f5" : "#fff",
          border: right ? "1px solid #2a3556" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function IntakeScreen({ active }: { active: boolean }) {
  return (
    <Screen active={active}>
      <div className="flex w-full flex-col gap-2.5 px-[18px]">
        <Bubble align="left">Thanks for calling Blue Star Home Services. What happened?</Bubble>
        <Bubble align="right">Our furnace just died and it&apos;s freezing in here.</Bubble>
        <Bubble align="left">Got it. Is anyone home right now, and how old is the unit?</Bubble>
        <Bubble align="right">Yes, my kids are here. It&apos;s probably 10 years old.</Bubble>
      </div>
    </Screen>
  );
}

function LeadMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e3e7ed] bg-[#f9fafb] p-2.5">
      <div className="font-cv-mono text-[9.5px] uppercase tracking-wide text-[#98a2b3]">{label}</div>
      <div className="mt-0.5 text-sm font-extrabold text-[#152033]">{value}</div>
    </div>
  );
}

function LeadCardScreen({ active }: { active: boolean }) {
  return (
    <Screen active={active}>
      <div className="w-full px-[18px]">
        <div className={`w-full rounded-[18px] bg-white p-4 text-[#152033] shadow-[0_22px_48px_rgba(0,0,0,.35)] transition-all duration-500 ${active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <div className="flex items-center justify-between">
            <span className="font-cv-mono text-[10px] font-extrabold uppercase tracking-widest text-[#98a2b3]">New lead</span>
            <span className="flex items-center gap-1.5 rounded-full border border-[#f3c9c3] bg-[#fff0ee] px-2 py-[3px] text-[10.5px] font-extrabold text-[#b42318]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#b42318] animate-pulse" />
              Urgent
            </span>
          </div>
          <div className="mt-2 font-cv-heading text-[19px] font-extrabold text-[#152033]">Marcus Webb</div>
          <div className="mt-0.5 text-xs text-[#667085]">HVAC · no heat · furnace failure</div>
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <LeadMetric label="Intent" value="High" />
            <LeadMetric label="Value" value="$1.8k–$3.2k" />
          </div>
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <span className="text-[11.5px] leading-[1.35] text-[#667085]">Recommended: call within 10 min</span>
            <div className="shrink-0 rounded-[9px] bg-[#2454d8] px-[11px] py-2 text-[11px] font-extrabold text-white">Call back</div>
          </div>
        </div>
      </div>
    </Screen>
  );
}
