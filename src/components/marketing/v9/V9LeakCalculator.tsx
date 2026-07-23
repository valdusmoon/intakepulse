"use client";

import { useEffect, useRef, useState } from "react";

import { MONTHLY_PRICE } from "@/lib/pricing";

/**
 * V9LeakCalculator — the three-input ROI calculator for /v9. Forked from
 * v8/V8LeakCalculator.tsx (unchanged mechanic). It sizes the opportunity and does
 * NOT assume every lead books:
 *   inputs  → inbound opportunities/mo · % currently lost or delayed · avg job value
 *   outputs → estimated monthly revenue leaking · recovered jobs needed to cover
 *             Callverted ($149/mo) · potential recovered revenue (yearly ceiling)
 * Conservative defaults. Renders white-on-dark to sit inside the dark ROI card on
 * the otherwise-light /v9 page.
 */

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
      const p = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = from + (target - from) * eased;
      displayRef.current = val;
      setDisplay(val);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return display;
}

// Conservative defaults.
const OPP_MIN = 5, OPP_MAX = 200, OPP_STEP = 5, OPP_DEFAULT = 40;
const LOSS_MIN = 5, LOSS_MAX = 60, LOSS_DEFAULT = 25;
const VALUE_MIN = 250, VALUE_MAX = 15000, VALUE_STEP = 250, VALUE_DEFAULT = 2500;

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function V9LeakCalculator() {
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
      <label className="mb-3 flex items-baseline justify-between gap-4">
        <span className="text-sm text-white/60">Inbound opportunities per month</span>
        <span className="font-cv-mono text-lg font-bold text-white">{opps}</span>
      </label>
      <input type="range" min={OPP_MIN} max={OPP_MAX} step={OPP_STEP} value={opps} onChange={(e) => setOpps(Number(e.target.value))} className="w-full accent-landing-primary-glow" aria-label="Inbound opportunities per month" />
      <div className="mt-1.5 flex justify-between font-cv-mono text-[10px] text-white/30">
        <span>{OPP_MIN}</span><span>{OPP_MAX}+</span>
      </div>

      {/* % currently lost or delayed */}
      <label className="mb-3 mt-5 flex items-baseline justify-between gap-4">
        <span className="text-sm text-white/60">% currently lost or delayed</span>
        <span className="font-cv-mono text-lg font-bold text-white">{lossPct}%</span>
      </label>
      <input type="range" min={LOSS_MIN} max={LOSS_MAX} value={lossPct} onChange={(e) => setLossPct(Number(e.target.value))} className="w-full accent-landing-primary-glow" aria-label="Percent currently lost or delayed" />
      <div className="mt-1.5 flex justify-between font-cv-mono text-[10px] text-white/30">
        <span>{LOSS_MIN}%</span><span>{LOSS_MAX}%</span>
      </div>

      {/* Average job value */}
      <label className="mb-3 mt-5 flex items-baseline justify-between gap-4">
        <span className="text-sm text-white/60">Average job value</span>
        <span className="font-cv-mono text-lg font-bold text-white">{fmt(jobValue)}</span>
      </label>
      <input type="range" min={VALUE_MIN} max={VALUE_MAX} step={VALUE_STEP} value={jobValue} onChange={(e) => setJobValue(Number(e.target.value))} className="w-full accent-landing-primary-glow" aria-label="Average job value" />
      <div className="mt-1.5 flex justify-between font-cv-mono text-[10px] text-white/30">
        <span>{fmt(VALUE_MIN)}</span><span>{fmt(VALUE_MAX)}+</span>
      </div>

      {/* Headline output */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <div className="mb-1.5 text-[11px] uppercase tracking-widest text-white/40">Estimated revenue leaking / month</div>
        <div className="font-cv-heading text-3xl font-bold tabular-nums text-white sm:text-4xl">{fmt(animatedLeak)}</div>
        <p className="mt-2 text-xs text-white/40">
          Roughly {Math.round(lostOpps)} of {opps} opportunities a month slipping at {fmt(jobValue)} each.
        </p>
      </div>

      {/* Supporting outputs */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-white/40">Recovered jobs to cover Callverted</div>
          <div className="font-cv-heading text-2xl font-bold tabular-nums text-landing-primary-glow">
            {jobsToCover}<span className="ml-1 text-sm font-semibold text-white/40">/mo</span>
          </div>
          <p className="mt-1.5 text-[11px] text-white/40">Win {jobsToCover === 1 ? "one job" : `${jobsToCover} jobs`} back and the ${MONTHLY_PRICE}/mo pays for itself.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-1 text-[10px] uppercase tracking-widest text-white/40">Potential recovered revenue / year</div>
          <div className="font-cv-heading text-2xl font-bold tabular-nums text-white">{fmt(animatedYear)}</div>
          <p className="mt-1.5 text-[11px] text-white/40">The yearly value at stake if the leak stays open.</p>
        </div>
      </div>

      <p className="mt-4 text-[11.5px] leading-relaxed text-white/45">
        This estimates the size of the opportunity. It does not assume every lead becomes a booked job.
      </p>
    </div>
  );
}
