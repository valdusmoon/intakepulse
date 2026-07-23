"use client";

import { useEffect, useRef, useState } from "react";

/**
 * V7ExtractionDemo — page-scoped fork of the homepage's ExtractionDemo.
 * "One sentence in, the facts out": a caller's run-on sentence types out live on
 * the left, and the facts Callverted pulls from it snap into a checklist on the
 * right, then the few things it still had to ask. Animates once when scrolled
 * into view. Illustrative scripted content — no real customer data.
 */

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

const EXTRACTED = [
  { label: "Service", value: "Water damage" },
  { label: "Urgency", value: "Emergency" },
  { label: "Cause", value: "Dishwasher line" },
  { label: "Started", value: "This morning" },
  { label: "Area", value: "3 rooms" },
];

const ASKED = [
  { label: "ZIP code", value: "33618" },
  { label: "Callback #", value: "(813) 555-0148" },
  { label: "Name", value: "Sarah" },
];

const SEG_START: number[] = [];
let _acc = 0;
for (const s of SEGMENTS) { SEG_START.push(_acc); _acc += s.t.length; }
const SENTENCE_LEN = _acc;
const FACT_END: number[] = [];
SEGMENTS.forEach((s, i) => s.facts?.forEach((f) => { FACT_END[f] = SEG_START[i] + s.t.length; }));

export function V7ExtractionDemo() {
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
        <div className="pointer-events-none absolute -top-16 -left-10 h-48 w-48 rounded-full bg-landing-primary/20 blur-3xl" aria-hidden />
        <div className="relative flex items-center justify-between mb-5">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-[#23a35a] animate-pulse" /> On the call · live
          </span>
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
