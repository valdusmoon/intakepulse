"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * V5HeroScenes — page-scoped copy of V4HeroScenes for the /v5 rebuild.
 *
 * Same animated three-beat product story (call → intake → ranked lead) rendered
 * as the app itself: browser chrome, left rail, top bar, and a stage that cycles
 * through the call, the live intake, and the ranked lead. Forked into v5/ so the
 * demo can be iterated for /v5 without touching /, /v6, or /v7.
 *
 * All motion is CSS + a small JS timeline, so text stays crisp and selectable.
 * Scene dots are real buttons (click to jump). Respects prefers-reduced-motion
 * by pinning to the payoff scene. ?scene=0|1|2 freezes a beat for screenshots.
 * Illustrative scripted content, no real customer data.
 */

const SCENES = [
  { key: "call", ms: 4200, tab: "Calls", title: "Incoming call" },
  { key: "intake", ms: 5400, tab: "Calls", title: "Live intake" },
  { key: "lead", ms: 4800, tab: "Leads", title: "Ranked lead" },
] as const;

const STAGE = "h-[430px] sm:h-[450px]";

export function V5HeroScenes() {
  const [scene, setScene] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const schedule = useCallback((from: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = (from + 1) % SCENES.length;
      setScene(next);
      schedule(next);
    }, SCENES[from].ms);
  }, []);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("scene");
    if (forced !== null) {
      setScene(Math.max(0, Math.min(SCENES.length - 1, parseInt(forced, 10) || 0)));
      setFrozen(true);
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) {
      setScene(2);
      setFrozen(true);
      return;
    }
    schedule(0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [schedule]);

  const jump = (i: number) => {
    setScene(i);
    if (!frozen) schedule(i);
  };

  const active = SCENES[scene];

  return (
    <div>
      {/* browser chrome, drawn rather than a bezel image */}
      <div className="overflow-hidden rounded-xl border border-[#e3e7ed] bg-white shadow-[0_36px_70px_-28px_rgba(16,24,40,0.36)]">
        <div className="flex items-center gap-2 border-b border-[#eef1f4] bg-[#f9fafb] px-3.5 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="font-cv-mono ml-2 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-[10.5px] text-[#98a2b3] ring-1 ring-[#eef1f4]">
            app.callverted.com/dashboard
          </span>
        </div>

        {/* app shell: rail + top bar + stage */}
        <div className="flex">
          <AppRail activeTab={active.tab} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between border-b border-[#eef1f4] px-4 py-3 sm:px-5">
              <p className="font-cv-heading text-[14px] font-bold text-[#152033]">{active.tab}</p>
              <span className="font-cv-mono text-[10.5px] font-semibold text-[#98a2b3]">{active.title}</span>
            </div>
            <div className={`relative ${STAGE}`}>
              <SceneWrap active={scene === 0}>
                <CallScene active={scene === 0} />
              </SceneWrap>
              <SceneWrap active={scene === 1}>
                <IntakeScene active={scene === 1} />
              </SceneWrap>
              <SceneWrap active={scene === 2}>
                <LeadScene active={scene === 2} />
              </SceneWrap>
            </div>
          </div>
        </div>
      </div>

      {/* scene dots — real buttons, so the story is steerable */}
      <div className="mt-5 flex items-center justify-center gap-2.5">
        {SCENES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => jump(i)}
            aria-current={scene === i}
            aria-label={`Show scene ${i + 1}: ${s.title}`}
            className="group flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-[#f2f5fa]"
          >
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                scene === i ? "w-7 bg-landing-primary" : "w-1.5 bg-[#d0d7e2] group-hover:bg-[#b6c0d1]"
              }`}
            />
            <span
              className={`text-[11.5px] font-semibold transition-colors ${
                scene === i ? "text-[#344054]" : "text-[#98a2b3]"
              }`}
            >
              {s.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SceneWrap({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden p-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:p-5"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0) scale(1)" : "translateY(8px) scale(0.99)",
        pointerEvents: active ? "auto" : "none",
      }}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

/** Left nav rail. Static across scenes except which item is lit. */
function AppRail({ activeTab }: { activeTab: string }) {
  const items = [
    { label: "Leads", d: "M4 6h16M4 12h10M4 18h6" },
    { label: "Calls", d: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" },
    { label: "Reports", d: "M4 18 10 12l4 3 6-8M20 7h-4M20 7v4" },
  ];
  return (
    <div className="hidden w-[52px] shrink-0 flex-col items-center gap-1.5 border-r border-[#eef1f4] bg-[#fcfdfe] py-3 sm:flex">
      <span className="mb-2 grid h-7 w-7 place-items-center rounded-lg bg-landing-primary text-[11px] font-black text-white">
        C
      </span>
      {items.map((it) => {
        const on = it.label === activeTab;
        return (
          <span
            key={it.label}
            title={it.label}
            className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
              on ? "bg-landing-primary/10 text-landing-primary" : "text-[#c1c8d3]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d={it.d} />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

// ── Scene 0: the call rings out, Callverted picks up ─────────────────────────

const PRIOR_CALLS = [
  { who: "(512) 555-0188", when: "Yesterday · 4:12 PM", tag: "Captured" },
  { who: "(512) 555-0132", when: "Yesterday · 11:03 AM", tag: "Captured" },
];

function CallScene({ active }: { active: boolean }) {
  const [secs, setSecs] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!active) {
      setSecs(0);
      setConnected(false);
      return;
    }
    const t = setTimeout(() => setConnected(true), 1100);
    const iv = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [active]);

  const mmss = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="flex h-full flex-col">
      {/* the live call banner */}
      <div
        className={`rounded-2xl border p-4 transition-colors duration-500 sm:p-5 ${
          connected ? "border-landing-primary/25 bg-[#f5f8ff]" : "border-[#e3e7ed] bg-[#f9fafb]"
        }`}
      >
        <div className="flex items-start gap-3.5">
          <span
            className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition-colors duration-500 ${
              connected ? "bg-landing-primary" : "bg-[#98a2b3]"
            }`}
          >
            {!connected && (
              <span className="absolute inset-0 animate-ping rounded-full bg-[#98a2b3] opacity-50" aria-hidden />
            )}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="relative">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-cv-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#98a2b3]">
              {connected ? "Answered by Callverted" : "Incoming · after hours"}
            </p>
            <p className="font-cv-heading mt-1 text-[19px] font-bold leading-tight text-[#152033] sm:text-[21px]">
              (512) 555-0147
            </p>
            <p className="font-cv-mono mt-0.5 h-4 text-[12px] tabular-nums text-[#667085]">
              {connected ? mmss : "ringing…"}
            </p>
          </div>

          <span
            className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-opacity duration-500 sm:block ${
              connected ? "bg-landing-primary/10 text-landing-primary opacity-100" : "opacity-0"
            }`}
          >
            Live
          </span>
        </div>

        {/* waveform */}
        <span className="mt-4 flex h-6 items-end gap-[3px]" aria-hidden>
          {Array.from({ length: 42 }, (_, i) => (
            <span
              key={i}
              className={`flex-1 rounded-full bg-landing-primary ${active && connected ? "cv-replay-bar" : ""}`}
              style={{
                height: `${6 + ((i * 7) % 15)}px`,
                animationDelay: `${(i % 11) * 0.09}s`,
                opacity: connected ? 0.75 : 0.18,
              }}
            />
          ))}
        </span>
      </div>

      <p className="font-cv-mono mt-5 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#98a2b3]">
        Earlier today
      </p>
      <div className="space-y-2">
        {PRIOR_CALLS.map((c) => (
          <div
            key={c.who}
            className="flex items-center justify-between rounded-xl border border-[#eef1f4] bg-white px-3.5 py-2.5"
          >
            <div>
              <p className="text-[13px] font-semibold text-[#344054]">{c.who}</p>
              <p className="text-[11.5px] text-[#98a2b3]">{c.when}</p>
            </div>
            <span className="rounded-full bg-[#eef7f1] px-2.5 py-1 text-[10.5px] font-bold text-[#17966b]">
              {c.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scene 1: live transcript, facts extracting ───────────────────────────────

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
let _acc = 0;
for (const s of H_SEG) {
  H_SEG_START.push(_acc);
  _acc += s.t.length;
}
const H_LEN = _acc;
const H_FACT_END: number[] = [];
H_SEG.forEach((s, i) =>
  s.facts?.forEach((f) => {
    H_FACT_END[f] = H_SEG_START[i] + s.t.length;
  }),
);

function IntakeScene({ active }: { active: boolean }) {
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!active) {
      setTyped(0);
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) {
      setTyped(H_LEN);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let n = 0;
    const type = () => {
      n += 1;
      setTyped(n);
      if (n < H_LEN) timers.push(setTimeout(type, 27));
    };
    timers.push(setTimeout(type, 350));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const typing = typed < H_LEN;

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      {/* transcript */}
      <div className="flex min-w-0 flex-col rounded-2xl border border-[#e3e7ed] bg-[#f9fafb] p-4 sm:p-5">
        <p className="font-cv-mono mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#98a2b3]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#17966b]" /> On the call · live
        </p>
        <p className="font-cv-heading text-[17px] font-semibold leading-relaxed text-[#152033] sm:text-[19px]">
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
                  style={{
                    background: full ? "rgba(23,150,107,0.14)" : "transparent",
                    boxShadow: full ? "inset 0 -2px 0 0 #17966b" : "none",
                  }}
                >
                  {text}
                </span>
              );
            }
            return <span key={i}>{text}</span>;
          })}
          {typing ? (
            <span
              className="ml-0.5 -mb-[2px] inline-block h-[0.9em] w-[2px] animate-pulse bg-landing-primary align-middle"
              aria-hidden
            />
          ) : (
            "”"
          )}
        </p>
        <p className="mt-auto pt-4 text-[12px] leading-relaxed text-[#667085]">
          It listens first, then asks only for what is still missing.
        </p>
      </div>

      {/* extracted facts */}
      <div className="flex min-w-0 flex-col">
        <p className="font-cv-mono mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#98a2b3]">
          Captured
        </p>
        <div className="space-y-2">
          {H_FACTS.map((f, i) => {
            const on = typed >= (H_FACT_END[i] ?? Infinity);
            return (
              <div
                key={f.label}
                className={`rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                  on
                    ? "translate-y-0 border-[#17966b]/25 bg-[#f2faf6] opacity-100"
                    : "translate-y-1 border-[#eef1f4] bg-white opacity-45"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full transition-colors ${
                      on ? "bg-[#17966b] text-white" : "bg-[#e3e7ed] text-transparent"
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="text-[9.5px] font-bold uppercase tracking-wide text-[#98a2b3]">{f.label}</span>
                </div>
                <p className="mt-1 text-[13px] font-bold text-[#152033]">{f.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Scene 2: the ranked lead ─────────────────────────────────────────────────

const H_LEAD = [
  { label: "Intent", value: "High", tone: "text-[#152033]" },
  { label: "Urgency", value: "Emergency", tone: "text-[#e5484d]" },
  { label: "Est. value", value: "$1.8k–$3.2k", tone: "text-[#152033]" },
  { label: "Service fit", value: "In your area", tone: "text-[#152033]" },
];

const QUEUE = [
  { name: "No heat · Emergency", meta: "$1.8k–$3.2k", tier: "Hot · 92", hot: true },
  { name: "AC not cooling", meta: "$600–$1.1k", tier: "Warm · 54", hot: false },
  { name: "Thermostat swap", meta: "$180–$320", tier: "Cool · 28", hot: false },
];

function LeadScene({ active }: { active: boolean }) {
  const TOTAL = H_LEAD.length + 2; // 4 fields + action + button
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) {
      setStep(TOTAL);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= TOTAL; i++) timers.push(setTimeout(() => setStep(i), 200 + (i - 1) * 560));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const stateAt = (idx: number) => (step > idx ? (step - 1 === idx ? "focus" : "seen") : "pending");
  const cls = (idx: number, base: string, focusRing: string) => {
    const s = stateAt(idx);
    return `${base} transition-all duration-300 ${
      s === "focus" ? `opacity-100 scale-[1.02] ${focusRing}` : s === "seen" ? "opacity-100 scale-100" : "opacity-35 scale-[0.99]"
    }`;
  };

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      {/* the lead record */}
      <div className="flex min-w-0 flex-col rounded-2xl border border-[#e3e7ed] bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-cv-mono text-[10px] font-bold uppercase tracking-[0.14em] text-landing-primary">
            Ready to call back
          </p>
          <span className="inline-flex items-center rounded-full bg-[#fff1f0] px-2.5 py-1 text-[11px] font-bold text-[#e5484d] ring-1 ring-[#e5484d]/20">
            Hot · 92
          </span>
        </div>

        <div className="mb-2.5 grid grid-cols-2 gap-2">
          {H_LEAD.map((f, i) => (
            <div
              key={f.label}
              className={cls(
                i,
                "rounded-xl border border-[#eef1f4] bg-[#f9fafb] px-3 py-2",
                "ring-2 ring-landing-primary/40 bg-[#f5f8ff]",
              )}
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#98a2b3]">{f.label}</p>
              <p className={`text-[13px] font-bold ${f.tone}`}>{f.value}</p>
            </div>
          ))}
        </div>

        <div
          className={cls(
            H_LEAD.length,
            "mb-2.5 rounded-xl bg-[#eef3ff] px-3 py-2 ring-1 ring-landing-primary/20",
            "ring-2 ring-landing-primary/50",
          )}
        >
          <p className="text-[9px] font-bold uppercase tracking-wide text-landing-primary/70">Recommended action</p>
          <p className="text-[13px] font-bold text-landing-primary">Call within 10 minutes</p>
        </div>

        <button
          type="button"
          tabIndex={-1}
          className={cls(
            H_LEAD.length + 1,
            "mt-auto w-full rounded-xl bg-landing-primary py-2.5 text-[13px] font-semibold text-white",
            "cv-pulse-cta",
          )}
        >
          Call back now
        </button>
      </div>

      {/* the queue it landed at the top of */}
      <div className="flex min-w-0 flex-col">
        <p className="font-cv-mono mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#98a2b3]">
          Priority queue
        </p>
        <div className="space-y-2">
          {QUEUE.map((q, i) => (
            <div
              key={q.name}
              className={`rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                q.hot ? "border-landing-primary/30 bg-[#f5f8ff]" : "border-[#eef1f4] bg-white"
              }`}
              style={{ opacity: step > 0 ? 1 : 0.4, transitionDelay: `${i * 90}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12.5px] font-semibold text-[#344054]">{q.name}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    q.hot ? "bg-[#fff1f0] text-[#e5484d]" : "bg-[#f2f4f7] text-[#98a2b3]"
                  }`}
                >
                  {q.tier}
                </span>
              </div>
              <p className="mt-0.5 text-[11.5px] text-[#98a2b3]">{q.meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
