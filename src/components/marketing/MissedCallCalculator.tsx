"use client";

import { useState } from "react";

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
        <div className="font-cv-heading text-3xl sm:text-4xl font-bold text-white">{fmt(atRisk)}</div>
        <p className="text-xs text-white/40 mt-2">
          {calls} missed {calls === 1 ? "call" : "calls"} a month at {fmt(jobValue)} per job, assuming {closeRate}% would
          have booked. A rough estimate, not a promise.
        </p>
      </div>
    </div>
  );
}
