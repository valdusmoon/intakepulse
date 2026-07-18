"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bright, light-themed interactive visuals for the /v4 landing mock.
 *
 *  - HeroLeadPacket: the hero's product visualization — a short recovered-call
 *    conversation beside the scored lead-assessment card it produces. Shows the
 *    whole product (call in → packet out) above the fold. Static by design so it
 *    reads instantly; only the callback CTA pulses.
 *  - ExtractionDemo: the "One sentence in. Eight facts out." differentiator — a
 *    caller's run-on sentence on the left, with the facts Callverted pulled from
 *    it snapping into a checklist on the right, then the few things it still had
 *    to ask. Animates once when scrolled into view.
 *
 * Both are white-on-light (the opposite of the dark CallReplay card) so they sit
 * on a bright page. No real customer data — illustrative scripted content.
 */

// ── Hero: conversation + scored lead card ────────────────────────────────────
const HERO_CONVO = [
  { who: "ai" as const, text: "Thanks for calling Blue Star. Briefly, what's going on?" },
  { who: "caller" as const, text: "Our furnace just died and it's freezing. We've got kids at home." },
  { who: "ai" as const, text: "Got it. What's the ZIP where the work is needed?" },
  { who: "keypad" as const, text: "07104" },
];

const HERO_FIELDS = [
  { label: "Intent", value: "High", tone: "text-[#152033]" },
  { label: "Urgency", value: "Emergency", tone: "text-[#b42318]" },
  { label: "Est. value", value: "$1.8k – $3.2k", tone: "text-[#152033]" },
  { label: "Service fit", value: "Inside area", tone: "text-[#152033]" },
];

export function HeroLeadPacket() {
  return (
    <div className="w-full max-w-[440px] rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-3 shadow-[0_40px_90px_-30px_rgba(16,24,40,0.45)] ring-1 ring-black/5">
      {/* header */}
      <div className="flex items-center gap-2.5 px-2 pt-2 pb-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-landing-primary text-white">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" /></svg>
        </span>
        <div className="min-w-0">
          <p className="font-cv-heading text-[14px] font-bold text-[#152033] leading-tight">Blue Star Home Services</p>
          <p className="text-[11px] text-[#667085]">Recovered call · qualifying</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#eaf7f0] px-2.5 py-1 text-[10.5px] font-bold text-[#177245]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#23a35a]" /> LIVE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_0.95fr] gap-2">
        {/* conversation */}
        <div className="rounded-2xl bg-[#f4f6f9] p-3 flex flex-col gap-2">
          {HERO_CONVO.map((m, i) => {
            if (m.who === "keypad") {
              return (
                <div key={i} className="self-end rounded-xl rounded-br-sm bg-landing-primary px-3 py-1.5 font-cv-mono text-[13px] font-bold text-white tracking-widest">{m.text}</div>
              );
            }
            const ai = m.who === "ai";
            return (
              <div key={i} className={`max-w-[92%] rounded-2xl px-3 py-2 text-[12px] leading-snug ${ai ? "self-start bg-white text-[#344054] rounded-bl-sm shadow-sm" : "self-end bg-landing-primary text-white rounded-br-sm"}`}>
                {m.text}
              </div>
            );
          })}
        </div>

        {/* scored lead card */}
        <div className="rounded-2xl border border-[#e6ebf2] bg-white p-3">
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {HERO_FIELDS.map((f) => (
              <div key={f.label}>
                <p className="text-[9.5px] uppercase tracking-wide text-[#98a2b3] font-semibold">{f.label}</p>
                <p className={`text-[13px] font-bold ${f.tone}`}>{f.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-[#eef3ff] px-3 py-2 mb-2.5">
            <p className="text-[9.5px] uppercase tracking-wide text-landing-primary/70 font-semibold">Recommended action</p>
            <p className="text-[13px] font-bold text-landing-primary">Call within 10 minutes</p>
          </div>
          <button className="w-full rounded-xl bg-landing-primary py-2 text-[13px] font-semibold text-white cv-pulse-cta">Call back now</button>
        </div>
      </div>

      {/* progress rail */}
      <div className="flex items-center gap-3 px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#98a2b3]">
        <span className="text-landing-primary">Team rings</span>
        <span className="h-px flex-1 bg-gradient-to-r from-landing-primary to-[#e3e7ed]" />
        <span className="text-landing-primary">AI answers</span>
        <span className="h-px flex-1 bg-[#e3e7ed]" />
        <span>Lead ready</span>
      </div>
    </div>
  );
}

// ── Extraction demo: one sentence in, eight facts out ────────────────────────
// The caller's sentence in reading-order segments. As each phrase is "spoken"
// (typed) it highlights, and the fact(s) it yields snap into the checklist.
type Seg = { t: string; hi?: boolean; facts?: number[] };
const SEGMENTS: Seg[] = [
  { t: "My basement is " },
  { t: "flooding", hi: true, facts: [0, 1] },
  { t: " from a " },
  { t: "burst dishwasher line", hi: true, facts: [2] },
  { t: ". It started " },
  { t: "this morning", hi: true, facts: [3] },
  { t: " and it's already in " },
  { t: "three rooms", hi: true, facts: [4] },
  { t: "." },
];

// Facts in the order they're captured as the sentence is spoken.
const EXTRACTED = [
  { label: "Service", value: "Water damage" },
  { label: "Urgency", value: "Emergency" },
  { label: "Cause", value: "Dishwasher line" },
  { label: "Started", value: "This morning" },
  { label: "Area", value: "3 rooms" },
];

const ASKED = [
  { label: "ZIP code", value: "07104" },
  { label: "Callback #", value: "(973) 555-0148" },
  { label: "Name", value: "Sarah" },
];

// Computed once: char offset per segment + the char index at which each fact is
// fully "spoken", so the highlight + checklist derive from a single typed count.
const SEG_START: number[] = [];
let _acc = 0;
for (const s of SEGMENTS) { SEG_START.push(_acc); _acc += s.t.length; }
const SENTENCE_LEN = _acc;
const FACT_END: number[] = [];
SEGMENTS.forEach((s, i) => s.facts?.forEach((f) => { FACT_END[f] = SEG_START[i] + s.t.length; }));

export function ExtractionDemo() {
  const [typed, setTyped] = useState(0); // chars of the sentence revealed
  const [asked, setAsked] = useState(0); // asked-for chips revealed
  const rootRef = useRef<HTMLDivElement | null>(null);
  const played = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !played.current) {
          played.current = true;
          if (reduced) { setTyped(SENTENCE_LEN); setAsked(ASKED.length); return; }
          // Type the sentence out like a live transcription; when it finishes,
          // the few still-missing fields get asked on a slower beat.
          let n = 0;
          const type = () => {
            n += 1;
            setTyped(n);
            if (n < SENTENCE_LEN) {
              timers.push(setTimeout(type, 17));
            } else {
              let a = 0;
              const revealAsked = () => { a += 1; setAsked(a); if (a < ASKED.length) timers.push(setTimeout(revealAsked, 450)); };
              timers.push(setTimeout(revealAsked, 400));
            }
          };
          timers.push(setTimeout(type, 300));
        }
      },
      { threshold: 0.45 }
    );
    io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, []);

  const typing = typed < SENTENCE_LEN;
  const captured = FACT_END.filter((e) => typed >= e).length;

  return (
    <div ref={rootRef} className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
      {/* Left — the caller's sentence, typing out live */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1226] p-6 sm:p-8 flex flex-col">
        {/* soft glow */}
        <div className="pointer-events-none absolute -top-16 -left-10 h-48 w-48 rounded-full bg-landing-primary/20 blur-3xl" aria-hidden />
        <div className="relative flex items-center justify-between mb-5">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-[#23a35a] animate-pulse" /> On the call · live
          </span>
          {/* waveform — animates only while the caller is "speaking" */}
          <span className="inline-flex items-end gap-[3px] h-5" aria-hidden>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className={`w-[3px] rounded-full bg-landing-primary-glow/70 ${typing ? "cv-replay-bar" : ""}`} style={{ height: `${6 + ((i * 7) % 14)}px`, animationDelay: `${i * 0.12}s` }} />
            ))}
          </span>
        </div>
        <p className="relative font-cv-heading text-[22px] sm:text-[27px] font-semibold leading-relaxed text-white/90 min-h-[128px] sm:min-h-[148px]">
          &ldquo;
          {SEGMENTS.map((s, i) => {
            const vis = Math.max(0, Math.min(typed - SEG_START[i], s.t.length));
            if (vis === 0) return null;
            const text = s.t.slice(0, vis);
            const full = vis === s.t.length;
            if (s.hi) {
              return (
                <span key={i} className={`relative rounded px-0.5 transition-colors duration-300 ${full ? "bg-[#23a35a]/25 text-white" : "text-white"}`} style={{ boxShadow: full ? "inset 0 -2px 0 0 #34d399" : "none" }}>{text}</span>
              );
            }
            return <span key={i}>{text}</span>;
          })}
          {typing ? <span className="ml-0.5 inline-block w-[2px] h-[0.9em] -mb-[2px] bg-landing-primary-glow align-middle animate-pulse" aria-hidden /> : "”"}
        </p>
        <div className="relative mt-auto pt-6 flex items-center gap-2 text-[12.5px] text-white/50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 7v5l3 2" /></svg>
          One sentence. No form. No menu.
        </div>
      </div>

      {/* Right — facts captured live + what it still asked */}
      <div className="rounded-3xl border border-[#e3e7ed] bg-white p-6 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-landing-primary">Understood instantly</span>
          <span className="font-cv-mono text-[12px] font-bold text-[#98a2b3]">{captured}/5</span>
        </div>
        <ul className="space-y-2">
          {EXTRACTED.map((f, i) => {
            const on = typed >= (FACT_END[i] ?? Infinity);
            return (
              <li key={f.label} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${on ? "border-[#c9ead9] bg-[#f3faf6] opacity-100 translate-y-0" : "border-[#eef1f4] bg-white opacity-40 translate-y-1"}`}>
                <span className={`grid h-5 w-5 place-items-center rounded-full ${on ? "bg-[#23a35a] text-white" : "bg-[#e3e7ed] text-transparent"}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <span className="text-[11.5px] text-[#98a2b3] w-[64px] shrink-0">{f.label}</span>
                <span className="text-[14px] font-bold text-[#152033]">{f.value}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 pt-4 border-t border-[#eef1f4]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#667085] mb-3">Then it asked only for what was missing</p>
          <div className="flex flex-wrap gap-2">
            {ASKED.map((f, i) => {
              const on = asked > i;
              return (
                <span key={f.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-300 ${on ? "border-landing-primary/30 bg-[#eef3ff] text-landing-primary opacity-100" : "border-[#eef1f4] bg-white text-[#c1c8d3] opacity-50"}`}>
                  {f.label}
                  {on && <span className="text-[#98a2b3] font-normal">· {f.value}</span>}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
