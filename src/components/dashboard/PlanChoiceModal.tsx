"use client";

import { useState } from "react";
import { Icon } from "@/components/dashboard/v2/primitives";
import {
  type Plan,
  MONTHLY_PRICE,
  ANNUAL_PRICE,
  ANNUAL_MONTHLY_EQUIV,
  ANNUAL_SAVINGS,
} from "@/lib/pricing";

/**
 * Shared "pick monthly or annual, then go to checkout" modal. Used by both
 * go-live entry points (ActivationChecklist "Add payment & go live" and the
 * Settings → Billing card). Annual is preselected (the value option) and
 * badged; both carry the same 14-day trial. onConfirm receives the chosen plan
 * and is expected to create the Stripe Checkout session and redirect.
 */
export function PlanChoiceModal({
  open,
  onClose,
  onConfirm,
  processing,
  defaultPlan = "monthly",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (plan: Plan) => void;
  processing: boolean;
  // Which plan is preselected. Defaults to monthly so a cold user isn't shown a
  // $1,499/yr line in Stripe before they've seen the product. Annual stays the
  // badged "Best value" option, and an annual-specific CTA can pass "annual".
  defaultPlan?: Plan;
}) {
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  if (!open) return null;

  const Option = ({ value, title, price, sub, badge }: { value: Plan; title: string; price: string; sub: string; badge?: string }) => {
    const active = plan === value;
    return (
      <button
        type="button"
        onClick={() => setPlan(value)}
        className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
          active ? "border-cv-primary bg-cv-surface-blue" : "border-cv-border hover:bg-cv-surface-subtle"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-5 w-5 place-items-center rounded-full border ${active ? "border-cv-primary" : "border-cv-border-strong"}`}>
              {active && <span className="h-2.5 w-2.5 rounded-full bg-cv-primary" />}
            </span>
            <span className="text-sm font-bold text-cv-ink">{title}</span>
            {badge && (
              <span className="rounded-full bg-cv-primary-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cv-primary">
                {badge}
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-cv-ink">{price}</span>
        </div>
        <p className="mt-1 pl-7 text-xs text-cv-muted">{sub}</p>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-cv-md">
        <h3 className="font-cv-heading text-lg font-bold text-cv-ink">Add payment &amp; go live</h3>
        <p className="text-sm text-cv-muted mt-1">Pick a plan to start your 14-day free trial. No charge for 14 days — cancel anytime.</p>

        <div className="mt-4 flex flex-col gap-2.5">
          <Option
            value="annual"
            title="Annual"
            price={`$${ANNUAL_MONTHLY_EQUIV}/mo`}
            sub={`Billed $${ANNUAL_PRICE.toLocaleString()}/yr — save $${ANNUAL_SAVINGS} a year.`}
            badge="Best value"
          />
          <Option value="monthly" title="Monthly" price={`$${MONTHLY_PRICE}/mo`} sub="Cancel anytime. No contract." />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="flex-1 rounded-xl border border-cv-border px-4 py-3 text-sm font-bold text-cv-ink hover:bg-cv-surface-subtle transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(plan)}
            disabled={processing}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-cv-primary px-4 py-3 text-sm font-bold text-white hover:bg-cv-primary-dark transition-colors disabled:opacity-60"
          >
            {processing ? "Starting…" : "Start free trial"}
            {!processing && <Icon name="arrow_forward" className="!text-[18px]" />}
          </button>
        </div>
      </div>
    </div>
  );
}
