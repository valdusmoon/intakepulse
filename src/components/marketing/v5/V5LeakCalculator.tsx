"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { MONTHLY_PRICE } from "@/lib/pricing";

/**
 * V5LeakCalculator — the §8 "The leak is already costing you" ROI tool for /v5.
 *
 * Reworked from MissedCallCalculator to the locked three-input LEAK model:
 *   inputs  → inbound opportunities per month · % currently lost or delayed · average job value
 *   outputs → estimated revenue leaking · recovered jobs needed to cover Callverted · potential recovered revenue
 *
 * Honest by construction: it sizes the value at stake in the opportunities that
 * currently leak, it does not promise every opportunity converts. Dark-styled to
 * sit inside the section's `bg-landing-ink` card.
 */

/** Ease the displayed value toward a target so totals roll up as you drag, rather
 *  than snapping. Snaps instantly for reduced-motion visitors. */
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

// Inbound opportunities per month (across every channel).
const OPP_MIN = 10;
const OPP_MAX = 300;
const OPP_STEP = 5;
const OPP_DEFAULT = 60;

// % of those currently lost or delayed.
const LOST_MIN = 5;
const LOST_MAX = 60;
const LOST_STEP = 5;
const LOST_DEFAULT = 25;

// Average job value.
const VALUE_MIN = 300;
const VALUE_MAX = 15000;
const VALUE_STEP = 100;
const VALUE_DEFAULT = 3000;

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function V5LeakCalculator() {
  const [opps, setOpps] = useState(OPP_DEFAULT);
  const [lostPct, setLostPct] = useState(LOST_DEFAULT);
  const [jobValue, setJobValue] = useState(VALUE_DEFAULT);

  const lostOpps = Math.round(opps * (lostPct / 100));
  const leakMonthly = lostOpps * jobValue;
  const recoveredAnnual = leakMonthly * 12;
  const jobsToCover = Math.max(1, Math.ceil(MONTHLY_PRICE / jobValue));

  const animatedLeak = useCountUp(leakMonthly);
  const animatedAnnual = useCountUp(recoveredAnnual);

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
          context: {
            opportunities: opps,
            lostPct,
            jobValue,
            leakMonthly: Math.round(leakMonthly),
            recoveredAnnual: Math.round(recoveredAnnual),
          },
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
      {/* Input 1 — inbound opportunities per month */}
      <label className="mb-3 flex items-baseline justify-between gap-4">
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
      <div className="font-cv-mono mt-1.5 flex justify-between text-[10px] text-white/30">
        <span>{OPP_MIN}</span>
        <span>{OPP_MAX}+</span>
      </div>

      {/* Input 2 — % currently lost or delayed */}
      <label className="mb-3 mt-5 flex items-baseline justify-between gap-4">
        <span className="text-sm text-white/60">% currently lost or delayed</span>
        <span className="font-cv-mono text-lg font-bold text-white">{lostPct}%</span>
      </label>
      <input
        type="range"
        min={LOST_MIN}
        max={LOST_MAX}
        step={LOST_STEP}
        value={lostPct}
        onChange={(e) => setLostPct(Number(e.target.value))}
        className="w-full accent-landing-primary-glow"
        aria-label="Percent currently lost or delayed"
      />
      <div className="font-cv-mono mt-1.5 flex justify-between text-[10px] text-white/30">
        <span>{LOST_MIN}%</span>
        <span>{LOST_MAX}%</span>
      </div>

      {/* Input 3 — average job value */}
      <label className="mb-3 mt-5 flex items-baseline justify-between gap-4">
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
      <div className="font-cv-mono mt-1.5 flex justify-between text-[10px] text-white/30">
        <span>{fmt(VALUE_MIN)}</span>
        <span>{fmt(VALUE_MAX)}+</span>
      </div>

      {/* Output — estimated revenue leaking */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <div className="mb-1.5 text-[11px] uppercase tracking-widest text-white/40">Estimated revenue leaking / month</div>
        <div className="font-cv-heading text-3xl font-bold tabular-nums text-white sm:text-4xl">{fmt(animatedLeak)}</div>
        <p className="mt-2 text-xs text-white/40">
          {lostOpps} of {opps} opportunities a month at {fmt(jobValue)} each. This sizes the value at stake, it does not
          promise every opportunity converts.
        </p>
      </div>

      {/* Outputs — jobs to cover + potential recovered revenue */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <div className="font-cv-heading text-2xl font-bold text-white">
            {jobsToCover} {jobsToCover === 1 ? "job" : "jobs"}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-white/45">
            recovered pays for Callverted at {fmt(MONTHLY_PRICE)}/mo
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <div className="font-cv-heading text-2xl font-bold tabular-nums text-landing-primary-glow">
            {fmt(animatedAnnual)}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-white/45">potential recovered revenue / year</p>
        </div>
      </div>

      {status === "sent" ? (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-landing-primary-glow">Sent. Check your inbox.</p>
          <p className="mt-1 text-xs text-white/50">Not there in a minute? Check your spam or promotions folder.</p>
        </div>
      ) : (
        <form onSubmit={handleCapture} className="mt-5">
          <label htmlFor="v5-roi-email" className="mb-2 block text-xs text-white/50">
            Want it in writing? We&apos;ll email you the numbers.
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="v5-roi-email"
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
