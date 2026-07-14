"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hero call panel — the emotional arc of the product as a glassmorphic call UI
 * that floats over the hero photograph (a worried homeowner making the call).
 * Four beats crossfade on a loop: the call rings the business unanswered,
 * Callverted answers it, runs a short intake, and hands back a scored lead card.
 * The step chips below let a visitor jump to any beat.
 *
 * This replaces the old phone-bezel mockup (HeroPhoneAnimation) — same beat
 * logic and scenario (HVAC no-heat, Marcus Webb), reskinned as a real-looking
 * call surface for a more premium, "this is actually happening" read.
 */

const BEATS = [
  { key: "ringing", time: "0:00", chip: "Rings", accent: "text-landing-alert", status: "Incoming call · your team's line" },
  { key: "answered", time: "0:04", chip: "Answers", accent: "text-landing-primary-glow", status: "Connected · Callverted" },
  { key: "intake", time: "0:22", chip: "Qualifies", accent: "text-landing-purple", status: "Live · qualifying the caller" },
  { key: "captured", time: "1:10", chip: "Lead", accent: "text-landing-green", status: "Call ended · lead created" },
] as const;

const DWELL = [3200, 2600, 4600, 5200];
const CAPTURED = 3;

export function HeroCallPanel() {
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

  useEffect(() => {
    if (reduced) return;
    timer.current = setTimeout(() => setBeat((b) => (b + 1) % BEATS.length), DWELL[beat]);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [beat, reduced]);

  function jump(i: number) {
    if (timer.current) clearTimeout(timer.current);
    setBeat(i);
  }

  const active = BEATS[beat];

  return (
    <div className="mx-auto w-full max-w-[384px]">
      <div className="relative">
        {/* Ambient glow behind the glass */}
        <div
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle at 50% 35%, rgba(59,108,255,.4), transparent 70%)" }}
          aria-hidden
        />

        <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-[#0b1226]/70 p-5 shadow-[0_30px_80px_rgba(0,0,0,.55)] backdrop-blur-2xl">
          {/* Header — reads as a live call surface */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: "linear-gradient(145deg,#2454d8,#173a8f)" }}>
              {!reduced && beat === 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5b8cff]/40" aria-hidden />
              )}
              <PhoneGlyph />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-cv-heading text-[15px] font-bold leading-tight text-white">Blue Star Home Services</p>
              <p className={`mt-0.5 text-[12px] font-medium transition-colors ${active.accent}`}>{active.status}</p>
            </div>
            <span className="font-cv-mono text-[12px] text-white/45">{active.time}</span>
          </div>

          {/* Beat content — fixed height so the card never jumps */}
          <div className="relative mt-4 min-h-[286px]">
            <RingingBeat active={beat === 0} animate={!reduced} />
            <AnsweredBeat active={beat === 1} />
            <IntakeBeat active={beat === 2} />
            <LeadBeat active={beat === CAPTURED} />
          </div>

          {/* Step chips — jump to a beat; the active chip tracks the loop */}
          <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-white/10 pt-4">
            {BEATS.map((b, i) => (
              <button
                key={b.key}
                onClick={() => jump(i)}
                className={`rounded-lg border px-1.5 py-2 text-center transition-colors ${
                  beat === i ? "border-white/25 bg-white/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <span className={`block font-cv-mono text-[9.5px] ${beat === i ? b.accent : "text-white/30"}`}>{b.time}</span>
                <span className={`mt-0.5 block text-[11px] font-semibold ${beat === i ? "text-white" : "text-white/55"}`}>{b.chip}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Each beat fills the content area and crossfades; inactive ones are inert. */
function Beat({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={`absolute inset-0 flex flex-col justify-center transition-opacity duration-300 ${active ? "opacity-100" : "pointer-events-none invisible opacity-0"}`}>
      {children}
    </div>
  );
}

function RingingBeat({ active, animate }: { active: boolean; animate: boolean }) {
  return (
    <Beat active={active}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-[74px] w-[74px] items-center justify-center">
          {active && animate &&
            [0, 0.6, 1.2].map((d) => (
              <span key={d} className="absolute h-[54px] w-[54px] animate-ping rounded-full bg-[#5b8cff]/25" style={{ animationDelay: `${d}s` }} aria-hidden />
            ))}
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full shadow-[0_0_26px_rgba(91,140,255,.45)]" style={{ background: "linear-gradient(145deg,#2454d8,#173a8f)" }}>
            <PhoneGlyph />
          </div>
        </div>
        <div>
          <div className="font-cv-heading text-lg font-extrabold text-white">Unknown Caller</div>
          <div className="mt-0.5 text-[12.5px] text-white/50">mobile · Newark, NJ</div>
        </div>
        <div className="mt-1 flex items-center gap-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff4d4d]/90"><DeclineGlyph /></span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2ecc71]/90"><PhoneGlyph small /></span>
        </div>
        <p className="text-[11.5px] text-white/40">Ringing your team first…</p>
      </div>
    </Beat>
  );
}

function AnsweredBeat({ active }: { active: boolean }) {
  return (
    <Beat active={active}>
      <div className="flex flex-col items-center gap-3.5 px-3 text-center">
        <div className="flex items-center gap-2 rounded-full border border-[#5b8cff]/40 bg-[#2454d8]/[0.18] px-3.5 py-2">
          <span className="h-2 w-2 rounded-full bg-[#5b8cff]" />
          <span className="text-[13px] font-extrabold text-[#dbe4ff]">Answered by Callverted</span>
        </div>
        <p className="text-[13px] leading-relaxed text-white/60">
          No one picked up in 15 seconds, so Callverted took the call before it went cold.
        </p>
      </div>
    </Beat>
  );
}

function Bubble({ align, children }: { align: "left" | "right"; children: React.ReactNode }) {
  const right = align === "right";
  return (
    <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[86%] px-3 py-2 text-[12px] leading-[1.45]"
        style={{
          borderRadius: 14,
          borderBottomRightRadius: right ? 4 : 14,
          borderBottomLeftRadius: right ? 14 : 4,
          background: right ? "rgba(255,255,255,0.08)" : "linear-gradient(145deg,#2454d8,#1d47bd)",
          color: right ? "#dde3f5" : "#fff",
          border: right ? "1px solid rgba(255,255,255,0.1)" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function IntakeBeat({ active }: { active: boolean }) {
  return (
    <Beat active={active}>
      <div className="flex w-full flex-col gap-2">
        <Bubble align="left">Thanks for calling Blue Star. What&apos;s going on?</Bubble>
        <Bubble align="right">Our furnace just died and it&apos;s freezing in here.</Bubble>
        <Bubble align="left">Got it. Is anyone home, and how old is the unit?</Bubble>
        <Bubble align="right">Yes, my kids are here. It&apos;s about 10 years old.</Bubble>
      </div>
    </Beat>
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

function LeadBeat({ active }: { active: boolean }) {
  return (
    <Beat active={active}>
      <div className={`w-full rounded-[18px] bg-white p-4 text-[#152033] shadow-[0_22px_48px_rgba(0,0,0,.35)] transition-all duration-500 ${active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
        <div className="flex items-center justify-between">
          <span className="font-cv-mono text-[10px] font-extrabold uppercase tracking-widest text-[#98a2b3]">New lead</span>
          <span className="flex items-center gap-1.5 rounded-full border border-[#f3c9c3] bg-[#fff0ee] px-2 py-[3px] text-[10.5px] font-extrabold text-[#b42318]">
            <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-[#b42318]" />
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
    </Beat>
  );
}

function PhoneGlyph({ small }: { small?: boolean }) {
  const s = small ? 18 : 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6.5 10.7c1.45 2.85 3.85 5.25 6.7 6.7l2.2-2.2c.3-.3.75-.4 1.15-.26 1.05.35 2.18.55 3.45.55.62 0 1.1.48 1.1 1.1v3.25c0 .62-.48 1.1-1.1 1.1C10.62 20.94 3.05 13.38 3.05 4c0-.62.48-1.1 1.1-1.1H7.4c.62 0 1.1.48 1.1 1.1 0 1.25.18 2.4.55 3.45.14.4.04.84-.26 1.14l-2.3 2.1Z" fill="white" />
    </svg>
  );
}

function DeclineGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ transform: "rotate(135deg)" }}>
      <path d="M6.5 10.7c1.45 2.85 3.85 5.25 6.7 6.7l2.2-2.2c.3-.3.75-.4 1.15-.26 1.05.35 2.18.55 3.45.55.62 0 1.1.48 1.1 1.1v3.25c0 .62-.48 1.1-1.1 1.1C10.62 20.94 3.05 13.38 3.05 4c0-.62.48-1.1 1.1-1.1H7.4c.62 0 1.1.48 1.1 1.1 0 1.25.18 2.4.55 3.45.14.4.04.84-.26 1.14l-2.3 2.1Z" fill="white" />
    </svg>
  );
}
