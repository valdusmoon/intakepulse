"use client";

import { useEffect, useRef, useState } from "react";

/**
 * V8TradeShowcase — the dark "Built for your trade" showcase for /v8.
 *
 * A large split: a selectable/auto-rotating trade list on the left, and on the
 * right a big cross-fading trade photo with one realistic call scenario, the
 * trade-specific details Callverted captures, and a sample priority result.
 * Feels enterprise, not four identical small cards. Clicking a trade selects it;
 * left alone it auto-advances. Scripted content — no real customer data.
 */

type Tier = "Hot" | "Warm";
type Trade = {
  name: string;
  blurb: string;
  img: string;
  pos: string;
  scenario: string;
  captured: string[];
  result: { tier: Tier; score: number; action: string };
};

const TRADES: Trade[] = [
  {
    name: "Restoration",
    blurb: "Water, fire, and mold mitigation",
    img: "/industries/restoration.jpg",
    pos: "50% 45%",
    scenario: "A pipe burst overnight and there's two inches of water across the finished basement.",
    captured: ["Water loss", "Source contained?", "Rooms affected", "Standing water", "After-hours"],
    result: { tier: "Hot", score: 92, action: "Call back now" },
  },
  {
    name: "HVAC",
    blurb: "No-heat, no-cool, and replacements",
    img: "/industries/hvac.jpg",
    pos: "50% 40%",
    scenario: "The AC is out, it is 91 degrees outside, and the system is twelve years old.",
    captured: ["No-cool", "Occupied home", "System age", "Service timing", "Repair vs. replace"],
    result: { tier: "Warm", score: 54, action: "Follow up today" },
  },
  {
    name: "Plumbing",
    blurb: "Burst lines, backups, no-water",
    img: "/industries/plumbing.jpg",
    pos: "50% 42%",
    scenario: "Sewage is backing up into the downstairs bathroom and it will not stop.",
    captured: ["Sewage backup", "Shutoff status", "Fixtures affected", "Water spreading", "Urgency"],
    result: { tier: "Hot", score: 88, action: "Call back now" },
  },
  {
    name: "Electrical",
    blurb: "Panels, outages, and hazards",
    img: "/industries/electrical.jpg",
    pos: "50% 42%",
    scenario: "There's a burning smell from the breaker panel and half the house has no power.",
    captured: ["Burning smell", "Panel involved", "Partial outage", "Hazard flag", "On-call routing"],
    result: { tier: "Hot", score: 90, action: "Call back now" },
  },
];

const ROTATE_MS = 5200;

function TierBadge({ tier, score }: { tier: Tier; score: number }) {
  const cls =
    tier === "Hot"
      ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
      : "border-sky-400/30 bg-sky-500/15 text-sky-300";
  const dot = tier === "Hot" ? "bg-amber-400" : "bg-sky-400";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-bold ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {tier} · {score}
    </span>
  );
}

export function V8TradeShowcase() {
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;
    timer.current = setInterval(() => setActive((a) => (a + 1) % TRADES.length), ROTATE_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  function select(i: number) {
    setActive(i);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setActive((a) => (a + 1) % TRADES.length), ROTATE_MS);
  }

  const t = TRADES[active];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.35fr] lg:gap-8">
      {/* Selector — horizontal scroller on mobile, vertical list on desktop */}
      <div className="flex flex-row gap-3 overflow-x-auto pb-1 lg:flex-col lg:gap-2.5 lg:overflow-visible lg:pb-0">
        {TRADES.map((trade, i) => {
          const on = i === active;
          return (
            <button
              key={trade.name}
              type="button"
              onClick={() => select(i)}
              className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition-colors lg:shrink lg:px-5 lg:py-4 ${
                on ? "border-white/20 bg-white/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-6 w-1 rounded-full transition-colors ${on ? "bg-landing-primary-glow" : "bg-white/15"}`} />
                <div>
                  <p className={`font-cv-heading text-[15px] font-bold ${on ? "text-white" : "text-white/70"}`}>{trade.name}</p>
                  <p className="hidden text-[12px] text-white/45 lg:block">{trade.blurb}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
        {/* Cross-fading photo */}
        <div className="relative h-[220px] sm:h-[280px]">
          {TRADES.map((trade, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={trade.name}
              src={trade.img}
              alt={trade.name}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ objectPosition: trade.pos, opacity: i === active ? 1 : 0 }}
            />
          ))}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,15,28,0.15) 0%, rgba(10,15,28,0.35) 55%, rgba(10,15,28,0.92) 100%)" }} aria-hidden />
          <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1 font-cv-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur">
            {t.name}
          </span>
          <p className="absolute inset-x-5 bottom-5 font-cv-heading text-[19px] font-semibold leading-snug text-white sm:text-[22px]">
            &ldquo;{t.scenario}&rdquo;
          </p>
        </div>

        {/* Captured details + result */}
        <div className="p-5 sm:p-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">What it captures on this call</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {t.captured.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white/80">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="text-landing-primary-glow"><path d="M20 6 9 17l-5-5" /></svg>
                {c}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Sample priority result</p>
              <p className="mt-0.5 text-[14px] font-bold text-white">{t.result.action}</p>
            </div>
            <TierBadge tier={t.result.tier} score={t.result.score} />
          </div>
        </div>
      </div>
    </div>
  );
}
