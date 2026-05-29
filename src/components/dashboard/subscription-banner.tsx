"use client";

import Link from "next/link";
import { XCircle, Clock, AlertTriangle } from "lucide-react";

export type BannerState =
  | { type: "none" }
  | { type: "no_subscription" }
  | { type: "trialing"; daysLeft: number }
  | { type: "trial_expired" }
  | { type: "canceled"; accessUntil: string }
  | { type: "ended" }
  | { type: "payment_failed" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function SubscriptionBanner({ state }: { state: BannerState }) {
  if (state.type === "none") return null;

  if (state.type === "no_subscription") {
    return null;
  }

  if (state.type === "trialing") {
    const urgent = state.daysLeft <= 3;
    return (
      <div className={`border-b px-4 py-2.5 ${urgent ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className={`flex items-center gap-2 text-sm ${urgent ? "text-orange-700" : "text-blue-700"}`}>
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {state.daysLeft <= 0
                ? "Your trial expires today."
                : `${state.daysLeft} day${state.daysLeft === 1 ? "" : "s"} left in your free trial.`}
            </span>
          </div>
          <Link href="/dashboard/billing" className={`text-sm font-medium underline whitespace-nowrap ${urgent ? "text-orange-700" : "text-blue-700"}`}>
            Manage billing
          </Link>
        </div>
      </div>
    );
  }

  if (state.type === "trial_expired") {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>Your free trial has ended. Subscribe to restore full access.</span>
          </div>
          <Link href="/dashboard/billing" className="text-sm font-medium text-red-700 underline whitespace-nowrap">
            Subscribe now
          </Link>
        </div>
      </div>
    );
  }

  if (state.type === "canceled") {
    return (
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Subscription canceled — access until {formatDate(state.accessUntil)}.</span>
          </div>
          <Link href="/dashboard/billing" className="text-sm font-medium text-orange-700 underline whitespace-nowrap">
            Reactivate
          </Link>
        </div>
      </div>
    );
  }

  if (state.type === "ended") {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>Your subscription has ended. Resubscribe to restore full access.</span>
          </div>
          <Link href="/dashboard/billing" className="text-sm font-medium text-red-700 underline whitespace-nowrap">
            Resubscribe
          </Link>
        </div>
      </div>
    );
  }

  if (state.type === "payment_failed") {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>Payment failed — please update your payment method.</span>
          </div>
          <Link href="/dashboard/billing" className="text-sm font-medium text-red-700 underline whitespace-nowrap">
            Update payment
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
