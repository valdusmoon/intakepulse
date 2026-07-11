"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

/** Ease the displayed value toward a target so the total rolls up as you drag,
 *  rather than snapping — motion tied to the interaction, not decoration.
 *  Snaps instantly for reduced-motion visitors. */
function useCountUp(target: number, durationMs = 450) {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    const from = displayRef.current;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const val = from + (target - from) * eased;
      displayRef.current = val;
      setDisplay(val);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return display;
}

const MIN = 1;
const MAX = 20;
const DEFAULT = 6;

const VALUE_MIN = 500;
const VALUE_MAX = 15000;
const VALUE_STEP = 250;
const VALUE_DEFAULT = 3000;

const RATE_MIN = 10;
const RATE_MAX = 60;
const RATE_DEFAULT = 30;

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function MissedCallCalculator() {
  const [calls, setCalls] = useState(DEFAULT);
  const [jobValue, setJobValue] = useState(VALUE_DEFAULT);
  const [closeRate, setCloseRate] = useState(RATE_DEFAULT);
  const atRisk = calls * jobValue * (closeRate / 100);
  const animatedRisk = useCountUp(atRisk);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleCapture(e: FormEvent) {
    e.preventDefault();
    if (status === "sending" || status === "sent") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "roi_calculator",
          context: { missedCalls: calls, jobValue, closeRate, atRisk: Math.round(atRisk) },
        }),
      });
      if (!res.ok) throw new Error("capture failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <label className="flex items-baseline justify-between gap-4 mb-3">
        <span className="text-sm text-white/60">Missed calls per month</span>
        <span className="font-cv-mono text-lg font-bold text-white">{calls}</span>
      </label>
      <input
        type="range"
        min={MIN}
        max={MAX}
        value={calls}
        onChange={(e) => setCalls(Number(e.target.value))}
        className="w-full accent-landing-primary-glow"
        aria-label="Missed calls per month"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1.5 font-cv-mono">
        <span>{MIN}</span>
        <span>{MAX}</span>
      </div>

      <label className="flex items-baseline justify-between gap-4 mb-3 mt-5">
        <span className="text-sm text-white/60">Average job value</span>
        <span className="font-cv-mono text-lg font-bold text-white">{fmt(jobValue)}</span>
      </label>
      <input
        type="range"
        min={VALUE_MIN}
        max={VALUE_MAX}
        step={VALUE_STEP}
        value={jobValue}
        onChange={(e) => setJobValue(Number(e.target.value))}
        className="w-full accent-landing-primary-glow"
        aria-label="Average job value"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1.5 font-cv-mono">
        <span>{fmt(VALUE_MIN)}</span>
        <span>{fmt(VALUE_MAX)}+</span>
      </div>

      <label className="flex items-baseline justify-between gap-4 mb-3 mt-5">
        <span className="text-sm text-white/60">Est. % that would&apos;ve booked</span>
        <span className="font-cv-mono text-lg font-bold text-white">{closeRate}%</span>
      </label>
      <input
        type="range"
        min={RATE_MIN}
        max={RATE_MAX}
        value={closeRate}
        onChange={(e) => setCloseRate(Number(e.target.value))}
        className="w-full accent-landing-primary-glow"
        aria-label="Estimated close rate"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1.5 font-cv-mono">
        <span>{RATE_MIN}%</span>
        <span>{RATE_MAX}%</span>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5">At risk every month</div>
        <div className="font-cv-heading text-3xl sm:text-4xl font-bold text-white tabular-nums">{fmt(animatedRisk)}</div>
        <p className="text-xs text-white/40 mt-2">
          {calls} missed {calls === 1 ? "call" : "calls"} a month at {fmt(jobValue)} per job, assuming {closeRate}% would
          have booked. A rough estimate, not a promise.
        </p>
      </div>

      {status === "sent" ? (
        <p className="mt-4 text-center text-sm font-medium text-landing-primary-glow">
          Sent. Check your inbox for the breakdown.
        </p>
      ) : (
        <form onSubmit={handleCapture} className="mt-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="Email address"
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-landing-primary-glow focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-xl bg-landing-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
            >
              {status === "sending" ? "Sending..." : "Email me this breakdown"}
            </button>
          </div>
          {status === "error" && (
            <p className="mt-2 text-xs text-red-400">Something went wrong. Please try again.</p>
          )}
        </form>
      )}
    </div>
  );
}
