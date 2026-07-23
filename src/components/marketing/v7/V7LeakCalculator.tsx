"use client";

import { useEffect, useRef, useState } from "react";

import { MONTHLY_PRICE } from "@/lib/pricing";

/**
 * V7LeakCalculator — page-scoped, reworked from the shared MissedCallCalculator
 * into the §8 "leak" model. Three inputs (inbound opportunities/mo, % currently
 * lost or delayed, average job value) size the cost of the leak, not a promise
 * that every opportunity converts. Outputs: estimated revenue leaking, recovered
 * jobs needed to cover Callverted (at $149/mo), and the yearly potential.
 * Renders white-on-dark to sit inside the dark ROI card.
 */

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

// Inbound opportunities per month.
const OPP_MIN = 5;
const OPP_MAX = 200;
const OPP_STEP = 5;
const OPP_DEFAULT = 40;

// % currently lost or delayed.
const LOSS_MIN = 5;
const LOSS_MAX = 70;
const LOSS_DEFAULT = 30;

// Average job value.
const VALUE_MIN = 500;
const VALUE_MAX = 15000;
const VALUE_STEP = 250;
const VALUE_DEFAULT = 3000;

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function V7LeakCalculator() {
  const [opps, setOpps] = useState(OPP_DEFAULT);
  const [lossPct, setLossPct] = useState(LOSS_DEFAULT);
  const [jobValue, setJobValue] = useState(VALUE_DEFAULT);

  const lostOpps = opps * (lossPct / 100);
  const monthlyLeak = lostOpps * jobValue;
  const yearlyLeak = monthlyLeak * 12;
  const jobsToCover = Math.max(1, Math.ceil(MONTHLY_PRICE / jobValue));

  const animatedLeak = useCountUp(monthlyLeak);
  const animatedYear = useCountUp(yearlyLeak);

  return (
    <div>
      {/* Inbound opportunities per month */}
      <label className="flex items-baseline justify-between gap-4 mb-3">
        <span className="text-sm text-white/60">Inbound opportunities per month</span>
        <span className="font-cv-mono text-lg font-bold text-white">{opps}</span>
      </label>
      <input
        type="range"
        min={OPP_MIN}
        max={OPP_MAX}
        step={OPP_STEP}
        value={opps}
        onChange={(e) => setOpps(Number(e.target.value))}
        className="w-full accent-landing-primary-glow"
        aria-label="Inbound opportunities per month"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1.5 font-cv-mono">
        <span>{OPP_MIN}</span>
        <span>{OPP_MAX}+</span>
      </div>

      {/* % currently lost or delayed */}
      <label className="flex items-baseline justify-between gap-4 mb-3 mt-5">
        <span className="text-sm text-white/60">% currently lost or delayed</span>
        <span className="font-cv-mono text-lg font-bold text-white">{lossPct}%</span>
      </label>
      <input
        type="range"
        min={LOSS_MIN}
        max={LOSS_MAX}
        value={lossPct}
        onChange={(e) => setLossPct(Number(e.target.value))}
        className="w-full accent-landing-primary-glow"
        aria-label="Percent currently lost or delayed"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1.5 font-cv-mono">
        <span>{LOSS_MIN}%</span>
        <span>{LOSS_MAX}%</span>
      </div>

      {/* Average job value */}
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

      {/* Headline output — estimated revenue leaking */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5">Estimated revenue leaking / month</div>
        <div className="font-cv-heading text-3xl sm:text-4xl font-bold text-white tabular-nums">{fmt(animatedLeak)}</div>
        <p className="text-xs text-white/40 mt-2">
          Roughly {Math.round(lostOpps)} of {opps} opportunities a month slipping at {fmt(jobValue)} each. It sizes the
          leak, it doesn&apos;t promise every one converts.
        </p>
      </div>

      {/* Two supporting outputs */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10.5px] uppercase tracking-widest text-white/40 mb-1">Jobs to cover Callverted</div>
          <div className="font-cv-heading text-2xl font-bold text-landing-primary-glow tabular-nums">
            {jobsToCover}
            <span className="text-sm font-semibold text-white/40 ml-1">/mo</span>
          </div>
          <p className="text-[11px] text-white/40 mt-1.5">Recover {jobsToCover === 1 ? "one job" : `${jobsToCover} jobs`} and the ${MONTHLY_PRICE}/mo pays for itself.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[10.5px] uppercase tracking-widest text-white/40 mb-1">Potential recovered / year</div>
          <div className="font-cv-heading text-2xl font-bold text-white tabular-nums">{fmt(animatedYear)}</div>
          <p className="text-[11px] text-white/40 mt-1.5">The yearly value at stake if the leak stays open.</p>
        </div>
      </div>
    </div>
  );
}
