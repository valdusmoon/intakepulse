"use client";

import { useState } from "react";

const MIN = 1;
const MAX = 20;
const DEFAULT = 6;
const LOW_TICKET = 3000;
const HIGH_TICKET = 8000;

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function MissedCallCalculator() {
  const [calls, setCalls] = useState(DEFAULT);
  const low = calls * LOW_TICKET;
  const high = calls * HIGH_TICKET;

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

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5">At risk every month</div>
        <div className="font-cv-heading text-3xl sm:text-4xl font-bold text-white">
          {fmt(low)}–{fmt(high)}
        </div>
        <p className="text-xs text-white/40 mt-2">Based on typical $3,000–$8,000 service tickets, if none of it gets answered.</p>
      </div>
    </div>
  );
}
