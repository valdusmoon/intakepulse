"use client";

import Link from "next/link";
import { useState } from "react";

import {
  type Plan,
  MONTHLY_PRICE,
  ANNUAL_PRICE,
  ANNUAL_MONTHLY_EQUIV,
  ANNUAL_SAVINGS,
  PLAN_FEATURES,
} from "@/lib/pricing";

/**
 * V6PricingCard — page-scoped fork of the shared PricingCard for /v6.
 *
 * Monthly | Annual billing toggle. One product, two cadences — no feature tiers,
 * so the feature list is identical and only the price/framing swaps. Prices
 * ($149/mo · $1,499/yr · 14-day trial) come from the shared @/lib/pricing data
 * module, which stays shared (a low-level constant source of truth, not a visual
 * component to iterate on). Forked so /v6 can restyle the card independently.
 */
export function V6PricingCard() {
  const [plan, setPlan] = useState<Plan>("annual");
  const isAnnual = plan === "annual";

  return (
    <div className="rounded-3xl border border-[#e3e7ed] bg-white p-8 shadow-[0_24px_60px_-30px_rgba(16,24,40,.3)] text-left">
      {/* Billing toggle */}
      <div className="mb-6 inline-flex rounded-full border border-[#e3e7ed] bg-[#f2f4f7] p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setPlan("monthly")}
          className={`rounded-full px-4 py-1.5 transition-colors ${!isAnnual ? "bg-white text-landing-primary shadow-sm" : "text-[#667085]"}`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setPlan("annual")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors ${isAnnual ? "bg-white text-landing-primary shadow-sm" : "text-[#667085]"}`}
        >
          Annual
          <span className="rounded-full bg-landing-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-landing-primary">
            Best value
          </span>
        </button>
      </div>

      {isAnnual ? (
        <>
          <p className="font-cv-heading text-5xl font-black tracking-tight">
            ${ANNUAL_MONTHLY_EQUIV}
            <span className="text-base font-semibold text-[#98a2b3] ml-1">/mo</span>
          </p>
          <p className="text-[13px] text-[#667085] mt-2">
            Billed annually at ${ANNUAL_PRICE.toLocaleString()}. Save ${ANNUAL_SAVINGS} a year vs monthly.
          </p>
        </>
      ) : (
        <>
          <p className="font-cv-heading text-5xl font-black tracking-tight">
            ${MONTHLY_PRICE}
            <span className="text-base font-semibold text-[#98a2b3] ml-1">/mo</span>
          </p>
          <p className="text-[13px] text-[#667085] mt-2">Everything included. No per-lead fees, no contracts.</p>
        </>
      )}

      <ul className="mt-6 space-y-2.5">
        {PLAN_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[#475467]">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/sign-up"
        className="mt-7 block text-center font-semibold bg-landing-primary text-white py-3 rounded-xl hover:bg-blue-600 transition-colors text-sm"
      >
        Start 14-day free trial
      </Link>
      <p className="mt-3 text-center text-[12px] text-[#98a2b3]">
        {isAnnual ? "14 days free, then billed yearly. Cancel anytime in trial." : "14 days free, then $149/mo. Cancel anytime."}
      </p>
      <p className="mt-2 text-center text-[12px] text-[#98a2b3]">
        No card needed to test the call flow first.
      </p>
    </div>
  );
}
