"use client";

import { useState } from "react";

/**
 * Product showcase — REAL screenshots of the live dashboard (captured from the
 * running app, Blue Star's seeded data) shown in a browser frame with tabs.
 *
 * This replaces the previous hand-coded div approximations of the UI. Real
 * screenshots read as an actual product rather than a diagram of one, which is
 * the single biggest "is this real?" credibility lift on the page. Regenerate
 * the images with scripts (see /public/product) whenever the dashboard changes.
 */

const SHOTS = [
  {
    key: "dashboard",
    label: "Dashboard",
    src: "/product/home.jpg",
    alt: "Callverted dashboard: captured opportunity value, priority leads ranked by urgency, and a conversion snapshot.",
  },
  {
    key: "lead",
    label: "Lead detail",
    src: "/product/lead.jpg",
    alt: "A qualified lead with the AI opportunity summary, recommended actions, qualification answers, and outcome logging.",
  },
  {
    key: "reports",
    label: "Reports",
    src: "/product/reports.jpg",
    alt: "Reports: overflow calls captured, captured-vs-won chart, conversion funnel, and performance by channel.",
  },
] as const;

type Key = (typeof SHOTS)[number]["key"];

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-x-4 top-8 bottom-0 -z-10 rounded-[32px] opacity-40 blur-2xl"
        style={{ background: "radial-gradient(ellipse 65% 55% at 50% 100%, rgba(16,24,40,.4), transparent 75%)" }}
        aria-hidden
      />
      <div className="rounded-2xl border border-[#e3e7ed] bg-white overflow-hidden shadow-[0_36px_60px_-20px_rgba(16,24,40,.32),0_12px_24px_-10px_rgba(36,84,216,.16)]">
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-[#e3e7ed] bg-[#f9fafb]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e3e7ed]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#e3e7ed]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#e3e7ed]" />
          <span className="ml-3 font-mono text-[10.5px] text-[#98a2b3]">app.callverted.com/dashboard</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProductShowcase() {
  const [tab, setTab] = useState<Key>("dashboard");
  const active = SHOTS.find((s) => s.key === tab)!;

  return (
    <div>
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {SHOTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors border ${
              tab === s.key ? "bg-[#152033] text-white border-[#152033]" : "bg-white text-[#475467] border-[#e3e7ed] hover:border-[#98a2b3]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <BrowserFrame>
        {/* Real screenshot. Fixed aspect via the image's own ratio; the top of
            the shot is what matters, so we cap height and clip the overflow. */}
        <div className="max-h-[560px] overflow-hidden bg-[#f6f7f9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={active.src} alt={active.alt} className="block w-full" />
        </div>
      </BrowserFrame>
    </div>
  );
}
