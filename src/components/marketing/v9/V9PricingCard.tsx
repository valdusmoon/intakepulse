import Link from "next/link";

import { MONTHLY_PRICE, ANNUAL_PRICE, ANNUAL_SAVINGS } from "@/lib/pricing";

/**
 * V9PricingCard — the one dominant, lean pricing card for /v9. Forked from
 * v8/V8PricingCard.tsx but simplified to the blunt-simplicity brief: no billing
 * toggle. The single flat monthly price is the hero; annual appears only as a quiet
 * secondary line. The four spec bullets (free trial · no per-lead fees · no
 * contracts · we set it up with you) carry the card, with an "everything included"
 * one-liner underneath. Numbers come from the shared @/lib/pricing source of truth.
 * A server component — nothing interactive here.
 */

const BULLETS = [
  "14-day free trial",
  "No per-lead fees",
  "No contracts",
  "We set it up with you",
];

const INCLUDED =
  "Missed-call intake · answered-call capture · website intake · scoring · ranked callback queue · alerts · weekly reports";

export function V9PricingCard() {
  return (
    <div className="rounded-3xl border border-[#e3e7ed] bg-white p-8 text-left shadow-[0_30px_70px_-30px_rgba(16,24,40,.35)] sm:p-9">
      <span className="inline-flex items-center gap-2 rounded-full border border-[#e3e7ed] bg-[#f9fafb] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#344054]">
        <span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />
        One plan
      </span>

      <p className="font-cv-heading mt-5 text-6xl font-black tracking-tight text-[#0a0f1c]">
        ${MONTHLY_PRICE}
        <span className="ml-1.5 align-baseline text-lg font-semibold text-[#98a2b3]">/month</span>
      </p>
      <p className="mt-2 text-[13.5px] text-[#667085]">
        Or ${ANNUAL_PRICE.toLocaleString()}/year — save ${ANNUAL_SAVINGS}. Everything included.
      </p>

      <ul className="mt-6 space-y-3">
        {BULLETS.map((b) => (
          <li key={b} className="flex items-center gap-3 text-[15px] font-semibold text-[#152033]">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-landing-primary/10 text-landing-primary">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            {b}
          </li>
        ))}
      </ul>

      <Link
        href="/sign-up"
        className="mt-7 block rounded-xl bg-landing-primary py-3.5 text-center text-[15px] font-semibold text-white shadow-[0_12px_34px_-8px_rgba(36,84,216,0.55)] transition-colors hover:bg-blue-600"
      >
        Start recovering leads
      </Link>
      <p className="mt-3 text-center text-[12px] text-[#98a2b3]">
        14 days free, then ${MONTHLY_PRICE}/mo. Cancel anytime.
      </p>

      <div className="mt-6 border-t border-[#eef1f4] pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#98a2b3]">Everything included</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#667085]">{INCLUDED}</p>
      </div>
    </div>
  );
}
