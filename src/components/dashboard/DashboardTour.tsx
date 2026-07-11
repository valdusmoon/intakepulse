"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/dashboard/v2/primitives";

const STORAGE_KEY = "cv_dashboard_tour_done";

type Step = {
  icon: string;
  title: string;
  body: string;
  // Element id to anchor the coach-mark against. Omit for a centered step.
  target?: string;
};

const STEPS: Step[] = [
  {
    icon: "waving_hand",
    title: "Welcome to your dashboard",
    body: "This is your command center. Every call and web lead Callverted captures lands here, ranked so you always know who to call back first.",
  },
  {
    icon: "checklist",
    title: "Finish setting up",
    body: "Work through these steps to go live. A quick test call, publishing your number, and adding web capture is all it takes to start catching every lead.",
    target: "cv-tour-activation",
  },
  {
    icon: "lightbulb",
    title: "This is a captured lead",
    body: "Here is an example of what a real lead looks like, with urgency, intent, and an estimated value. Your live leads will appear here in this same spot.",
    target: "cv-tour-example",
  },
  {
    icon: "insights",
    title: "Your numbers populate here",
    body: "Once leads start coming in, these cards and the conversion snapshot fill in with real captured value, won revenue, and callback times.",
    target: "cv-tour-metrics",
  },
];

const POPOVER_W = 340;
const GAP = 14;
const PAD = 8;

type Rect = { top: number; left: number; width: number; height: number };

export function DashboardTour() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState<Rect | null>(null);
  const [pop, setPop] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popRef = useRef<HTMLDivElement>(null);

  const step = STEPS[index];

  // Decide whether to auto-open on first visit to the zero-state.
  useEffect(() => {
    setMounted(true);
    let done = false;
    try {
      done = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage unavailable (private mode / blocked) — treat as not-done, still one-shot per session.
    }
    setDismissed(done);
    if (!done) {
      const t = setTimeout(() => setOpen(true), 450);
      return () => clearTimeout(t);
    }
  }, []);

  const measure = useCallback(() => {
    if (!step?.target) {
      setSpot(null);
      const el = popRef.current;
      const ph = el?.offsetHeight ?? 220;
      setPop({
        top: Math.max(GAP, window.innerHeight / 2 - ph / 2),
        left: Math.max(GAP, window.innerWidth / 2 - POPOVER_W / 2),
      });
      return;
    }
    const node = document.getElementById(step.target);
    if (!node) {
      // Target missing — degrade to a centered step rather than pointing at nothing.
      setSpot(null);
      const ph = popRef.current?.offsetHeight ?? 220;
      setPop({
        top: Math.max(GAP, window.innerHeight / 2 - ph / 2),
        left: Math.max(GAP, window.innerWidth / 2 - POPOVER_W / 2),
      });
      return;
    }
    const r = node.getBoundingClientRect();
    const s: Rect = {
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    };
    setSpot(s);

    const ph = popRef.current?.offsetHeight ?? 200;
    // Prefer below the target, flip above if it would overflow the viewport.
    let top = s.top + s.height + GAP;
    if (top + ph > window.innerHeight - GAP) {
      const above = s.top - GAP - ph;
      top = above > GAP ? above : Math.max(GAP, window.innerHeight - ph - GAP);
    }
    // Align near the target's left edge, clamped into the viewport.
    let left = s.left;
    if (left + POPOVER_W > window.innerWidth - GAP) left = window.innerWidth - POPOVER_W - GAP;
    if (left < GAP) left = GAP;
    setPop({ top, left });
  }, [step]);

  // Scroll the target into view, then measure. Re-measure on scroll/resize while open.
  useLayoutEffect(() => {
    if (!open) return;
    if (step?.target) {
      document.getElementById(step.target)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const raf = requestAnimationFrame(measure);
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, index, measure, step]);

  const finish = useCallback(() => {
    setOpen(false);
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Persisting the dismissal is best-effort; the session state above still hides it now.
    }
  }, []);

  const next = useCallback(() => {
    if (index >= STEPS.length - 1) finish();
    else setIndex((i) => i + 1);
  }, [index, finish]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Keyboard: Escape closes, arrows step.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, back, finish]);

  if (!mounted) return null;

  const reopen = () => {
    setIndex(0);
    setOpen(true);
  };

  return (
    <>
      {/* Subtle reopen affordance once the tour has been dismissed. */}
      {!open && dismissed && (
        <button
          type="button"
          onClick={reopen}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-1.5 rounded-full border border-cv-border bg-cv-surface px-3.5 py-2 text-xs font-bold text-cv-primary shadow-cv-md transition-colors hover:bg-cv-surface-blue"
        >
          <Icon name="map" className="!text-[16px]" />
          Take the tour
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Dashboard walkthrough">
          {/* Backdrop + spotlight. When a target exists, a single box-shadow dims
              everything except the highlighted element. Otherwise a flat dim. */}
          {spot ? (
            <div
              className="pointer-events-none absolute rounded-2xl ring-2 ring-cv-primary transition-all duration-300 ease-out"
              style={{
                top: spot.top,
                left: spot.left,
                width: spot.width,
                height: spot.height,
                boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-[rgba(15,23,42,0.55)]" />
          )}

          {/* Popover card */}
          <div
            ref={popRef}
            className="absolute w-[340px] max-w-[calc(100vw-28px)] rounded-2xl border border-cv-border bg-cv-surface p-5 shadow-cv-md transition-all duration-300 ease-out"
            style={{ top: pop.top, left: pop.left }}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cv-primary-soft text-cv-primary">
                <Icon name={step.icon} className="!text-[20px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-cv-heading text-base font-bold leading-snug text-cv-ink">{step.title}</h3>
              </div>
              <button
                type="button"
                onClick={finish}
                aria-label="Skip walkthrough"
                className="shrink-0 rounded-lg p-1 text-cv-muted transition-colors hover:bg-cv-surface-subtle hover:text-cv-ink"
              >
                <Icon name="close" className="!text-[18px]" />
              </button>
            </div>

            <p className="mt-2.5 text-[13px] leading-relaxed text-cv-muted">{step.body}</p>

            {/* Step dots */}
            <div className="mt-4 flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s.title}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === index ? "w-5 bg-cv-primary" : "w-1.5 bg-cv-border-strong"
                  }`}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="font-cv-mono text-[11px] font-bold text-cv-muted">
                {index + 1} / {STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    className="rounded-[9px] border border-cv-border px-3 py-2 text-xs font-bold text-cv-ink transition-colors hover:bg-cv-surface-subtle"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-[9px] bg-cv-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-cv-primary-dark"
                >
                  {index >= STEPS.length - 1 ? "Got it" : "Next"}
                  {index < STEPS.length - 1 && <Icon name="arrow_forward" className="!text-[15px]" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
