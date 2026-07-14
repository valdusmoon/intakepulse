"use client";

import { createContext, forwardRef, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * HeroScenes — the animated hero for /v4, in a cinematic (Birdeye-style)
 * treatment: the background photo is dimmed and a dark, frameless frosted-glass
 * panel floats on it, walking through the product story — one call becoming a
 * ranked lead:
 *
 *   0. Call    — the after-hours call Callverted picks up (native call-screen look).
 *   1. Intake  — the caller's sentence transcribes live and facts extract.
 *   2. Lead    — the scored, callback-ready lead packet the call produced.
 *
 * All motion is CSS + a small JS timeline (no video / no Remotion), which keeps
 * the text crisp and selectable. Built as a provider so the backdrop and panel
 * share one scene index and stay in lock-step; splices into the hero by wrapping
 * the section in <HeroScenesProvider>, then dropping <HeroBackdrop/> where the
 * <img> was and <HeroSceneCard/> where <HeroLeadPacket/> was.
 *
 * ?scene=0|1|2 freezes a scene (for screenshots/QA). Respects
 * prefers-reduced-motion: pins to the payoff (the lead packet), never cycles.
 * Illustrative scripted content — no real customer data.
 */

const SCENES = [
  { key: "call", ms: 4200, img: "/hero/relieved-caller.jpg", pos: "60% center" },
  { key: "intake", ms: 5400, img: "/hero/calm-caller.jpg", pos: "58% center" },
  { key: "lead", ms: 4800, img: "/hero/confident-owner.jpg", pos: "55% center" },
] as const;

// Dimmed, left-weighted wash so the white headline reads and the photo stays
// visible behind the glass panel on the right. Two tones: "dark" (full
// cinematic / Birdeye match) and "medium" (brighter photo, panel still reads).
type Tone = "dark" | "medium";
const WASH: Record<Tone, { side: string; bottom: string }> = {
  dark: {
    side: "linear-gradient(90deg, rgba(8,11,20,0.94) 0%, rgba(8,11,20,0.74) 40%, rgba(8,11,20,0.34) 68%, rgba(8,11,20,0.52) 100%)",
    bottom: "linear-gradient(to top, rgba(8,11,20,0.55), transparent 42%)",
  },
  medium: {
    side: "linear-gradient(90deg, rgba(8,11,20,0.8) 0%, rgba(8,11,20,0.42) 40%, rgba(8,11,20,0.06) 66%, rgba(8,11,20,0.2) 100%)",
    bottom: "linear-gradient(to top, rgba(8,11,20,0.32), transparent 36%)",
  },
};

const SceneCtx = createContext<{ scene: number; tone: Tone }>({ scene: 0, tone: "dark" });

export function HeroScenesProvider({ children, tone = "dark" }: { children: ReactNode; tone?: Tone }) {
  const [scene, setScene] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("scene");
    if (forced !== null) {
      setScene(Math.max(0, Math.min(SCENES.length - 1, parseInt(forced, 10) || 0)));
      return; // frozen for QA/screenshots
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) { setScene(2); return; }
    const schedule = (from: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const next = (from + 1) % SCENES.length;
        setScene(next);
        schedule(next);
      }, SCENES[from].ms);
    };
    schedule(0);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  return <SceneCtx.Provider value={{ scene, tone }}>{children}</SceneCtx.Provider>;
}

/** Cross-fading background photos + the dimming wash. Absolutely fills its
 * (relative, overflow-hidden) parent section. */
export function HeroBackdrop() {
  const { scene, tone } = useContext(SceneCtx);
  const wash = WASH[tone];
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {SCENES.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s.key}
          src={s.img}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1100ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ objectPosition: s.pos, opacity: scene === i ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: wash.side }} />
      <div className="absolute inset-0" style={{ background: wash.bottom }} />
      {/* Mobile-only: the panel is hidden < lg and the headline spans full width, so
          the left-weighted desktop wash leaves the right side too bright behind text.
          Darken more uniformly on phones for legibility. */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{ background: "linear-gradient(180deg, rgba(8,11,20,0.62) 0%, rgba(8,11,20,0.44) 42%, rgba(8,11,20,0.58) 100%)" }}
      />
    </div>
  );
}

// ── The floating dark-glass panel ────────────────────────────────────────────

export function HeroSceneCard() {
  const { scene } = useContext(SceneCtx);
  const r0 = useRef<HTMLDivElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  const refs = [r0, r1, r2];
  const [height, setHeight] = useState<number>(384);

  // Size the panel to the active scene so nothing is scrunched — the call screen
  // gets room to breathe, the lead packet only as tall as it needs. Inactive
  // scenes are absolutely positioned, so each ref reports its natural height.
  useEffect(() => {
    const measure = () => { const el = refs[scene].current; if (el) setHeight(el.offsetHeight); };
    measure();
    const id = setTimeout(measure, 60); // after fonts/layout settle
    window.addEventListener("resize", measure);
    return () => { clearTimeout(id); window.removeEventListener("resize", measure); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  return (
    <div className="w-full max-w-[360px]">
      <div className="relative rounded-[32px] border border-white/12 bg-[#0b0f1a]/50 backdrop-blur-2xl shadow-[0_40px_100px_-25px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* subtle top sheen for the glass feel */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.07] to-transparent z-10" aria-hidden />
        <div
          className="relative transition-[height] duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ height }}
        >
          <SceneWrap ref={r0} active={scene === 0}><CallScene active={scene === 0} /></SceneWrap>
          <SceneWrap ref={r1} active={scene === 1}><IntakeScene active={scene === 1} /></SceneWrap>
          <SceneWrap ref={r2} active={scene === 2}><LeadScene active={scene === 2} /></SceneWrap>
        </div>
      </div>
    </div>
  );
}

const SceneWrap = forwardRef<HTMLDivElement, { active: boolean; children: ReactNode }>(
  function SceneWrap({ active, children }, ref) {
    return (
      <div
        ref={ref}
        className="absolute inset-x-0 top-0 p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? "translateY(0) scale(1)" : "translateY(10px) scale(0.985)",
          pointerEvents: active ? "auto" : "none",
        }}
        aria-hidden={!active}
      >
        {children}
      </div>
    );
  }
);

function CtrlButton({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/10">
      {children}
    </span>
  );
}

// ── Scene 0: native-style call screen ────────────────────────────────────────
function CallScene({ active }: { active: boolean }) {
  const [secs, setSecs] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!active) { setSecs(0); setConnected(false); return; }
    const t = setTimeout(() => setConnected(true), 1100);
    const iv = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [active]);

  const mmss = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center py-1">
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
        {connected ? "Answered by Callverted" : "Incoming · after hours"}
      </p>
      <h3 className="mt-3 font-cv-heading text-[27px] font-bold text-white leading-tight">Blue Star Home</h3>
      <p className="mt-1.5 font-cv-mono text-[15px] text-white/60 tabular-nums h-5">
        {connected ? mmss : "ringing…"}
      </p>

      {/* waveform */}
      <span className="mt-5 inline-flex h-5 items-end gap-[3px]" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full bg-landing-primary-glow ${active && connected ? "cv-replay-bar" : ""}`}
            style={{ height: `${6 + ((i * 7) % 15)}px`, animationDelay: `${i * 0.09}s`, opacity: connected ? 0.9 : 0.25 }}
          />
        ))}
      </span>

      {/* iOS-style control grid (decorative — sells the native call look) */}
      <div className="mt-7 grid grid-cols-3 gap-x-7 gap-y-4 place-items-center">
        <CtrlButton><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v3" strokeLinecap="round" /></svg></CtrlButton>
        <CtrlButton><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="6" r="1.6" /><circle cx="12" cy="6" r="1.6" /><circle cx="19" cy="6" r="1.6" /><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /><circle cx="5" cy="18" r="1.6" /><circle cx="12" cy="18" r="1.6" /><circle cx="19" cy="18" r="1.6" /></svg></CtrlButton>
        <CtrlButton><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" /></svg></CtrlButton>
        <CtrlButton><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></CtrlButton>
        <CtrlButton><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l5-3v10l-5-3v-4zM3 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /></svg></CtrlButton>
        <CtrlButton><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg></CtrlButton>
      </div>

      <span className="mt-4 grid h-12 w-12 place-items-center rounded-full bg-[#f5453a] text-white shadow-lg">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" transform="rotate(135 12 12)" /></svg>
      </span>
    </div>
  );
}

// ── Scene 1: live intake / extraction ────────────────────────────────────────
type Seg = { t: string; hi?: boolean; facts?: number[] };
const H_SEG: Seg[] = [
  { t: "Our " },
  { t: "furnace died", hi: true, facts: [0] },
  { t: " and the house is " },
  { t: "freezing", hi: true, facts: [1] },
  { t: " with " },
  { t: "two kids home", hi: true, facts: [2] },
  { t: "." },
];
const H_FACTS = [
  { label: "Service", value: "Heating — no heat" },
  { label: "Urgency", value: "Emergency" },
  { label: "Household", value: "Two kids home" },
];
const H_SEG_START: number[] = [];
let _a = 0;
for (const s of H_SEG) { H_SEG_START.push(_a); _a += s.t.length; }
const H_LEN = _a;
const H_FACT_END: number[] = [];
H_SEG.forEach((s, i) => s.facts?.forEach((f) => { H_FACT_END[f] = H_SEG_START[i] + s.t.length; }));

function IntakeScene({ active }: { active: boolean }) {
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!active) { setTyped(0); return; }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) { setTyped(H_LEN); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let n = 0;
    const type = () => { n += 1; setTyped(n); if (n < H_LEN) timers.push(setTimeout(type, 27)); };
    timers.push(setTimeout(type, 350));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const typing = typed < H_LEN;

  return (
    <div className="flex flex-col">
      <p className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-white/45 mb-3">
        <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" /> On the call · live
      </p>
      <p className="font-cv-heading text-[18px] font-semibold leading-relaxed text-white/90 min-h-[104px] mb-5">
        &ldquo;
        {H_SEG.map((s, i) => {
          const vis = Math.max(0, Math.min(typed - H_SEG_START[i], s.t.length));
          if (vis === 0) return null;
          const text = s.t.slice(0, vis);
          const full = vis === s.t.length;
          if (s.hi) {
            return (
              <span
                key={i}
                className="rounded px-0.5 transition-colors duration-300"
                style={{ background: full ? "rgba(52,211,153,0.2)" : "transparent", boxShadow: full ? "inset 0 -2px 0 0 #34d399" : "none" }}
              >
                {text}
              </span>
            );
          }
          return <span key={i}>{text}</span>;
        })}
        {typing ? <span className="ml-0.5 inline-block h-[0.9em] w-[2px] -mb-[2px] bg-landing-primary-glow align-middle animate-pulse" aria-hidden /> : "”"}
      </p>

      <div className="space-y-1.5">
        {H_FACTS.map((f, i) => {
          const on = typed >= (H_FACT_END[i] ?? Infinity);
          return (
            <div
              key={f.label}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-300 ${on ? "border-[#34d399]/30 bg-[#34d399]/10 opacity-100 translate-y-0" : "border-white/10 bg-white/[0.03] opacity-40 translate-y-1"}`}
            >
              <span className={`grid h-4 w-4 place-items-center rounded-full ${on ? "bg-[#34d399] text-[#06281c]" : "bg-white/15 text-transparent"}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <span className="text-[10px] text-white/40 w-[70px] shrink-0 uppercase tracking-wide font-semibold">{f.label}</span>
              <span className="text-[13px] font-bold text-white">{f.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Scene 2: the ranked lead packet ──────────────────────────────────────────
const H_LEAD = [
  { label: "Intent", value: "High", tone: "text-white" },
  { label: "Urgency", value: "Emergency", tone: "text-[#ff8b84]" },
  { label: "Est. value", value: "$1.8k–$3.2k", tone: "text-white" },
  { label: "Service fit", value: "In your area", tone: "text-white" },
];

// The lead packet reveals one element at a time, spotlighting each as the
// "camera" steps through it: 4 fields → recommended action → the callback CTA.
// step = how many elements have been reached (0..6); the element at index
// step-1 is the one currently "selected".
function LeadScene({ active }: { active: boolean }) {
  const TOTAL = H_LEAD.length + 2; // 4 fields + action + button
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) { setStep(TOTAL); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= TOTAL; i++) timers.push(setTimeout(() => setStep(i), 220 + (i - 1) * 620));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // visual state for the element at position `idx` (0-based across all elements)
  const stateAt = (idx: number) => (step > idx ? (step - 1 === idx ? "focus" : "seen") : "pending");
  const cls = (idx: number, base: string, focusRing: string) => {
    const s = stateAt(idx);
    return `${base} transition-all duration-300 ${
      s === "focus" ? `opacity-100 scale-[1.03] ${focusRing}` : s === "seen" ? "opacity-100 scale-100" : "opacity-30 scale-[0.98]"
    }`;
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-landing-primary-glow">Ready to call back</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff5d5d]/20 px-2.5 py-1 text-[11px] font-bold text-[#ff8b84] ring-1 ring-[#ff5d5d]/30">Hot · 92</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2.5">
        {H_LEAD.map((f, i) => (
          <div
            key={f.label}
            className={cls(i, "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2", "ring-2 ring-landing-primary-glow/70 bg-white/[0.08]")}
          >
            <p className="text-[9px] uppercase tracking-wide text-white/40 font-semibold">{f.label}</p>
            <p className={`text-[13px] font-bold ${f.tone}`}>{f.value}</p>
          </div>
        ))}
      </div>

      <div className={cls(H_LEAD.length, "rounded-xl bg-landing-primary/20 ring-1 ring-landing-primary/30 px-3 py-2 mb-2.5", "ring-2 ring-landing-primary-glow/80 bg-landing-primary/30")}>
        <p className="text-[9px] uppercase tracking-wide text-landing-primary-glow/80 font-semibold">Recommended action</p>
        <p className="text-[13px] font-bold text-white">Call within 10 minutes</p>
      </div>

      <button
        type="button"
        className={cls(H_LEAD.length + 1, "w-full rounded-xl bg-landing-primary py-2.5 text-[13px] font-semibold text-white", "cv-pulse-cta")}
      >
        Call back now
      </button>
    </div>
  );
}
