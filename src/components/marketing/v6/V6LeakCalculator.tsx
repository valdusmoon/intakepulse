"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

/**
 * V6LeakCalculator — page-scoped fork of MissedCallCalculator, reworked to the
 * three-input LEAK model from the locked copy (§8 "The leak is already costing
 * you"):
 *
 *   inputs  → inbound opportunities / month · % currently lost or delayed · avg job value
 *   outputs → estimated revenue leaking · recovered jobs needed to cover Callverted
 *             · potential recovered revenue (annualized ceiling)
 *
 * It sizes the cost of the leak; it does not promise every opportunity converts.
 * Callverted's price ($149/mo) drives the "jobs to cover" math. Dark-on-dark to
 * sit inside /v6's landing-ink card. Forked so /v6 can iterate independently.
 */

const CALLVERTED_MONTHLY = 149;

/** Ease the displayed value toward a target so totals roll up as you drag,
 *  rather than snapping. Snaps instantly for reduced-motion visitors. */
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

// inbound opportunities / month
const OPPS_MIN = 5;
const OPPS_MAX = 200;
const OPPS_DEFAULT = 60;

// % currently lost or delayed
const LOST_MIN = 5;
const LOST_MAX = 60;
const LOST_DEFAULT = 25;

// average job value
const VALUE_MIN = 250;
const VALUE_MAX = 15000;
const VALUE_STEP = 250;
const VALUE_DEFAULT = 2500;

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function V6LeakCalculator() {
  const [opps, setOpps] = useState(OPPS_DEFAULT);
  const [lostPct, setLostPct] = useState(LOST_DEFAULT);
  const [jobValue, setJobValue] = useState(VALUE_DEFAULT);

  const lostOpps = Math.round(opps * (lostPct / 100));
  const monthlyLeak = lostOpps * jobValue;
  const annualLeak = monthlyLeak * 12;
  const jobsToCover = Math.max(1, Math.ceil(CALLVERTED_MONTHLY / jobValue));

  const animatedLeak = useCountUp(monthlyLeak);

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
          source: "roi_leak_calculator",
          context: { opportunities: opps, lostPct, jobValue, monthlyLeak, annualLeak },
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
      {/* Input 1 — inbound opportunities / month */}
      <label className="flex items-baseline justify-between gap-4 mb-3">
        <span className="text-sm text-white/60">Inbound opportunities per month</span>
        <span className="font-cv-mono text-lg font-bold text-white">{opps}</span>
      </label>
      <input
        type="range"
        min={OPPS_MIN}
        max={OPPS_MAX}
        value={opps}
        onChange={(e) => setOpps(Number(e.target.value))}
        className="w-full accent-landing-primary-glow"
        aria-label="Inbound opportunities per month"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1.5 font-cv-mono">
        <span>{OPPS_MIN}</span>
        <span>{OPPS_MAX}+</span>
      </div>

      {/* Input 2 — % currently lost or delayed */}
      <label className="flex items-baseline justify-between gap-4 mb-3 mt-5">
        <span className="text-sm text-white/60">% currently lost or delayed</span>
        <span className="font-cv-mono text-lg font-bold text-white">{lostPct}%</span>
      </label>
      <input
        type="range"
        min={LOST_MIN}
        max={LOST_MAX}
        value={lostPct}
        onChange={(e) => setLostPct(Number(e.target.value))}
        className="w-full accent-landing-primary-glow"
        aria-label="Percent of opportunities currently lost or delayed"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1.5 font-cv-mono">
        <span>{LOST_MIN}%</span>
        <span>{LOST_MAX}%</span>
      </div>

      {/* Input 3 — average job value */}
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

      {/* Primary output — the monthly leak */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5">Estimated revenue leaking every month</div>
        <div className="font-cv-heading text-3xl sm:text-4xl font-bold text-white tabular-nums">{fmt(animatedLeak)}</div>
        <p className="text-xs text-white/40 mt-2">
          About {lostOpps} of {opps} opportunities a month go uncaptured, undocumented, or unprioritized, at {fmt(jobValue)}{" "}
          each. It sizes the leak, it does not promise every opportunity converts.
        </p>
      </div>

      {/* Secondary outputs — jobs to cover + annual ceiling */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Recovered jobs to cover Callverted</div>
          <div className="font-cv-heading text-2xl font-bold text-landing-primary-glow tabular-nums">
            {jobsToCover} {jobsToCover === 1 ? "job" : "jobs"}
          </div>
          <p className="text-[11px] text-white/40 mt-1.5">
            Win {jobsToCover === 1 ? "one job" : `${jobsToCover} jobs`} back and Callverted (${CALLVERTED_MONTHLY}/mo) pays
            for itself.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Potential recovered revenue / year</div>
          <div className="font-cv-heading text-2xl font-bold text-white tabular-nums">{fmt(annualLeak)}</div>
          <p className="text-[11px] text-white/40 mt-1.5">
            The ceiling on the table over a year. Recover even a fraction and it covers the cost many times over.
          </p>
        </div>
      </div>

      {status === "sent" ? (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-landing-primary-glow">Sent. Check your inbox.</p>
          <p className="mt-1 text-xs text-white/50">Not there in a minute? Check your spam or promotions folder.</p>
        </div>
      ) : (
        <form onSubmit={handleCapture} className="mt-5">
          <label htmlFor="leak-email" className="block text-xs text-white/50 mb-2">
            Want it in writing? We&apos;ll email you the numbers.
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="leak-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="Email address"
              className="flex-1 rounded-xl border border-white/20 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-landing-primary-glow focus:bg-white/10 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="shrink-0 rounded-xl bg-landing-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
            >
              {status === "sending" ? "Sending..." : "Email me the numbers"}
            </button>
          </div>
          {status === "error" && <p className="mt-2 text-xs text-red-400">Something went wrong. Please try again.</p>}
        </form>
      )}
    </div>
  );
}
