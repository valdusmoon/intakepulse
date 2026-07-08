"use client";

import Link from "next/link";
import { Icon } from "./primitives";
import type { BannerState } from "@/components/dashboard/subscription-banner";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const TONE = {
  blue: "bg-cv-primary-soft border-cv-primary/20 text-cv-primary-dark",
  amber: "bg-cv-amber-soft border-[#f3d99d] text-cv-amber",
  red: "bg-cv-red-soft border-[#f3c9c3] text-cv-red",
};

function Banner({ tone, icon, message, cta, href }: { tone: keyof typeof TONE; icon: string; message: string; cta: string; href: string }) {
  return (
    <div className={`border-b px-4 py-2.5 ${TONE[tone]}`}>
      <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Icon name={icon} className="!text-base shrink-0" />
          <span>{message}</span>
        </div>
        <Link href={href} className="text-sm font-semibold underline whitespace-nowrap">
          {cta}
        </Link>
      </div>
    </div>
  );
}

export function SubscriptionBannerV2({ state }: { state: BannerState }) {
  if (state.type === "none" || state.type === "no_subscription") return null;

  if (state.type === "trialing") {
    const urgent = state.daysLeft <= 3;
    return (
      <Banner
        tone={urgent ? "amber" : "blue"}
        icon="schedule"
        message={
          state.daysLeft <= 0
            ? "Your trial expires today — subscribe to keep recovering missed calls."
            : `${state.daysLeft} day${state.daysLeft === 1 ? "" : "s"} left in your free trial.`
        }
        cta="Manage billing"
        href="/dashboard/settings?tab=billing"
      />
    );
  }

  if (state.type === "trial_expired") {
    return (
      <Banner tone="red" icon="cancel" message="Your free trial has ended. Subscribe to restore full access." cta="Subscribe now" href="/dashboard/settings?tab=billing" />
    );
  }

  if (state.type === "canceled") {
    return (
      <Banner
        tone="amber"
        icon="warning"
        message={`Subscription canceled — access until ${formatDate(state.accessUntil)}.`}
        cta="Reactivate"
        href="/dashboard/settings?tab=billing"
      />
    );
  }

  if (state.type === "ended") {
    return <Banner tone="red" icon="cancel" message="Your subscription has ended. Resubscribe to restore full access." cta="Resubscribe" href="/dashboard/settings?tab=billing" />;
  }

  if (state.type === "payment_failed") {
    return <Banner tone="red" icon="cancel" message="Payment failed — please update your payment method." cta="Update payment" href="/dashboard/settings?tab=billing" />;
  }

  return null;
}
