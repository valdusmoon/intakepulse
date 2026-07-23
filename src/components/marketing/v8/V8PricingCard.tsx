"use client";

import Link from "next/link";
import { useState } from "react";

import { type Plan, MONTHLY_PRICE, ANNUAL_PRICE, ANNUAL_MONTHLY_EQUIV, ANNUAL_SAVINGS } from "@/lib/pricing";

/**
 * V8PricingCard — the one dominant pricing card for /v8. One product, two
 * cadences (monthly $149 / annual $1,499), 14-day trial. Imports the shared
 * @/lib/pricing constants (the number source of truth); the included-feature
 * copy follows the v8 spec's own list. Primary CTA: Start recovering leads.
 */

const INCLUDED = [
  "Missed-call intake",
  "Answered-call capture",
  "Website intake",
  "Qualification and scoring",
  "Ranked callback queue",
  "Alerts",
  "Weekly reporting",
  "Guided setup",
];

export function V8PricingCard() {
  const [plan, setPlan] = useState<Plan>("annual");
  const isAnnual = plan === "annual";

  return (
    <div className="rounded-3xl border border-[#e3e7ed] bg-white p-8 text-left shadow-[0_30px_70px_-30px_rgba(16,24,40,.35)]">
      {/* Billing toggle */}
      <div className="mb-6 inline-flex rounded-full border border-[#e3e7ed] bg-[#f2f4f7] p-1 text-sm font-semibold">
        <button type="button" onClick={() => setPlan("monthly")} className={`rounded-full px-4 py-1.5 transition-colors ${!isAnnual ? "bg-white text-landing-primary shadow-sm" : "text-[#667085]"}`}>
          Monthly
        </button>
        <button type="button" onClick={() => setPlan("annual")} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors ${isAnnual ? "bg-white text-landing-primary shadow-sm" : "text-[#667085]"}`}>
          Annual
          <span className="rounded-full bg-landing-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-landing-primary">Best value</span>
        </button>
      </div>

      {isAnnual ? (
        <>
          <p className="font-cv-heading text-5xl font-black tracking-tight">
            ${ANNUAL_MONTHLY_EQUIV}<span className="ml-1 text-base font-semibold text-[#98a2b3]">/mo</span>
          </p>
          <p className="mt-2 text-[13px] text-[#667085]">Billed annually at ${ANNUAL_PRICE.toLocaleString()}. Save ${ANNUAL_SAVINGS} a year vs monthly.</p>
        </>
      ) : (
        <>
          <p className="font-cv-heading text-5xl font-black tracking-tight">
            ${MONTHLY_PRICE}<span className="ml-1 text-base font-semibold text-[#98a2b3]">/mo</span>
          </p>
          <p className="mt-2 text-[13px] text-[#667085]">Everything included. No per-lead fees, no contracts.</p>
        </>
      )}

      <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {INCLUDED.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[#475467]">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <Link href="/sign-up" className="mt-7 block rounded-xl bg-landing-primary py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-600">
        Start recovering leads
      </Link>
      <p className="mt-3 text-center text-[12px] text-[#98a2b3]">
        {isAnnual ? "14 days free, then billed yearly. Cancel anytime in trial." : "14 days free, then $149/mo. Cancel anytime."}
      </p>
      <p className="mt-2 text-center text-[12px] text-[#98a2b3]">No card needed to test the call flow first.</p>
    </div>
  );
}
