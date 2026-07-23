"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * V8HeroScenes — the dark split-hero visual for /v8.
 *
 * Unlike the v6/v7 heroes (which walked ONE call through three changing scenes),
 * the v8 hero keeps the OUTPUT fixed and rotates the INPUT. A single ranked job
 * packet stays put on the right while:
 *   - the SOURCE cue above it cross-fades through missed call · answered call ·
 *     website inquiry, and
 *   - rotating trade photography cross-fades behind the whole frame.
 * That introduces the mental model before the first scroll: many ways in, one
 * ranked list out. All motion is CSS + one shared scene index. Respects
 * prefers-reduced-motion (pins to the first source). Scripted content, no real data.
 */

type Kind = "missed" | "answered" | "web";
const SCENES: { source: string; detail: string; kind: Kind; img: string; pos: string }[] = [
  { source: "Missed call", detail: "Rang out after hours", kind: "missed", img: "/industries/plumbing.jpg", pos: "50% 42%" },
  { source: "Answered call", detail: "Captured in the background", kind: "answered", img: "/industries/hvac.jpg", pos: "50% 40%" },
  { source: "Website inquiry", detail: "From your site widget", kind: "web", img: "/industries/restoration.jpg", pos: "50% 38%" },
  { source: "Missed call", detail: "Nobody free on the job", kind: "missed", img: "/industries/electrical.jpg", pos: "50% 42%" },
];

const SCENE_MS = 4200;

// Heavy on the left so the hero copy stays crisp; lighter mid/right where the
// dark-glass packet card sits over the photo.
const WASH_SIDE =
  "linear-gradient(90deg, rgba(8,11,20,0.96) 0%, rgba(8,11,20,0.82) 38%, rgba(8,11,20,0.46) 68%, rgba(8,11,20,0.62) 100%)";
const WASH_BOTTOM = "linear-gradient(to top, rgba(8,11,20,0.55), transparent 40%)";

const SceneCtx = createContext<{ scene: number }>({ scene: 0 });

export function V8HeroScenesProvider({ children }: { children: ReactNode }) {
  const [scene, setScene] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("scene");
    if (forced !== null) {
      setScene(Math.max(0, Math.min(SCENES.length - 1, parseInt(forced, 10) || 0)));
      return; // frozen for QA/screenshots
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;
    const schedule = () => {
      timer.current = setTimeout(() => {
        setScene((s) => (s + 1) % SCENES.length);
        schedule();
      }, SCENE_MS);
    };
    schedule();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  return <SceneCtx.Provider value={{ scene }}>{children}</SceneCtx.Provider>;
}

/** Cross-fading trade photography + the dimming wash. Fills its (relative,
 * overflow-hidden) parent section. */
export function V8HeroBackdrop() {
  const { scene } = useContext(SceneCtx);
  return (
    <div className="absolute inset-0 overflow-hidden bg-landing-ink" aria-hidden>
      {SCENES.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={s.img}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ objectPosition: s.pos, opacity: scene === i ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: WASH_SIDE }} />
      <div className="absolute inset-0" style={{ background: WASH_BOTTOM }} />
      <div
        className="absolute inset-0 lg:hidden"
        style={{ background: "linear-gradient(180deg, rgba(8,11,20,0.68) 0%, rgba(8,11,20,0.5) 42%, rgba(8,11,20,0.62) 100%)" }}
      />
      {/* subtle brand glow */}
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(91,140,255,0.35), transparent)" }}
      />
    </div>
  );
}

function SourceIcon({ kind }: { kind: Kind }) {
  if (kind === "web") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    );
  }
  if (kind === "answered") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        <path d="M4 5.5C4 12.4 9.6 18 16.5 18a1.5 1.5 0 0 0 1.5-1.5v-1.9a1 1 0 0 0-.8-1l-2.5-.5a1 1 0 0 0-1 .4l-.7.9a11 11 0 0 1-4.9-4.9l.9-.7a1 1 0 0 0 .4-1l-.5-2.5a1 1 0 0 0-1-.8H5.5A1.5 1.5 0 0 0 4 5.5z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" />
    </svg>
  );
}

const HERO_FIELDS: { label: string; value: string; danger?: boolean }[] = [
  { label: "Service", value: "Water damage" },
  { label: "Urgency", value: "Emergency", danger: true },
  { label: "ZIP", value: "33618" },
  { label: "Est. value", value: "$1.8k–$3.2k" },
];

/** The fixed ranked-job packet with the rotating source cue above it. */
export function V8HeroSceneCard() {
  const { scene } = useContext(SceneCtx);

  return (
    <div className="w-full max-w-[380px]">
      <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#0b0f1a]/60 p-5 shadow-[0_40px_100px_-25px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.07] to-transparent" aria-hidden />

        {/* Rotating SOURCE cue — the input that changes */}
        <p className="font-cv-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b8cff]">Inbound opportunity</p>
        <div className="relative mt-2 h-9">
          {SCENES.map((s, i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-center transition-opacity duration-700"
              style={{ opacity: scene === i ? 1 : 0 }}
              aria-hidden={scene !== i}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5">
                <span className="text-[#5b8cff]"><SourceIcon kind={s.kind} /></span>
                <span className="text-[13px] font-semibold text-white">{s.source}</span>
                <span className="text-[11.5px] text-white/50">· {s.detail}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Transition connector */}
        <div className="my-3.5 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-white/55">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* Fixed ranked JOB packet — the output that stays the same */}
        <div className="mb-3 flex items-center justify-between">
          <p className="font-cv-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Job packet</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Hot · 92
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {HERO_FIELDS.map((f) => (
            <div key={f.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-white/40">{f.label}</p>
              <p className={`text-[13px] font-bold ${f.danger ? "text-[#ff8b84]" : "text-white"}`}>{f.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-landing-primary/25 bg-landing-primary/15 px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-landing-primary-glow/80">Recommended action</p>
          <p className="text-[13px] font-bold text-white">Call back now</p>
        </div>

        <button type="button" className="cv-pulse-cta mt-3 w-full rounded-xl bg-landing-primary py-2.5 text-[13px] font-semibold text-white">
          Call back now
        </button>
      </div>

      <p className="mt-4 text-center text-[12px] font-medium text-white/45">Many ways in. One ranked list out.</p>
    </div>
  );
}
