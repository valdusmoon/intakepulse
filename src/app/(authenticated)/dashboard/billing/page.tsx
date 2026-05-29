"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, XCircle, ExternalLink, Check } from "lucide-react";

const PLAN_PRICE = 79;

const PLAN_FEATURES = [
  "Homeowner lead capture form — shareable link, QR code, and website embed",
  "AI instant estimates based on your rates and home details",
  "Lead pipeline — kanban or list view with needs-attention alerts",
  "Quotes with line items, discounts, tax, and PDF download",
  "Contracts with electronic signature (ESIGN Act compliant)",
  "Scheduling and calendar view with staff assignment",
  "Before / progress / after job photo uploads",
  "Email + SMS notifications for new leads, quotes, contracts, and jobs",
  "Automated review request email when a job is marked complete",
  "Unlimited leads — no caps or overages",
];

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | "unpaid"
  | null;

interface CompanyBilling {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  stripeSubscriptionId: string | null;
}

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billing, setBilling] = useState<CompanyBilling | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/company");
        if (!res.ok) throw new Error("Failed to load billing data");
        const company = await res.json();
        setBilling({
          subscriptionStatus: company.subscriptionStatus,
          trialEndsAt: company.trialEndsAt,
          currentPeriodEnd: company.currentPeriodEnd,
          canceledAt: company.canceledAt,
          stripeSubscriptionId: company.stripeSubscriptionId,
        });
      } catch (err) {
        console.error("Error loading billing:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleStartTrial() {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session");
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setIsProcessing(false);
    }
  }

  async function handleManageSubscription() {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open portal");
      window.location.href = data.url;
    } catch (err) {
      console.error("Portal error:", err);
      setIsProcessing(false);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function getDaysRemaining(d: string | null) {
    if (!d) return 0;
    return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function getStatusBadge(status: SubscriptionStatus) {
    switch (status) {
      case "trialing":
        return <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200 text-blue-700 bg-blue-50"><Clock className="h-3 w-3" />Free Trial</span>;
      case "active":
        return <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3" />Active</span>;
      case "past_due":
        return <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700"><XCircle className="h-3 w-3" />Past Due</span>;
      case "canceled":
        return <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"><XCircle className="h-3 w-3" />Canceled</span>;
      default:
        return <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200 text-gray-500">No Subscription</span>;
    }
  }

  if (isLoading) {
    return <div className="py-10 text-sm text-gray-500">Loading billing information...</div>;
  }

  const hasSubscription = !!billing?.stripeSubscriptionId;
  const isTrialing = billing?.subscriptionStatus === "trialing";
  const isActive = billing?.subscriptionStatus === "active";
  const isCanceled = billing?.subscriptionStatus === "canceled";
  const GRACE_MS = 60 * 1000;

  const isTrialExpired =
    isTrialing && billing?.trialEndsAt &&
    new Date(billing.trialEndsAt).getTime() + GRACE_MS <= Date.now();

  const isTrialCanceled =
    isTrialing && billing?.canceledAt && new Date(billing.canceledAt) > new Date();

  const isCanceledButActive =
    isActive && billing?.canceledAt && new Date(billing.canceledAt) > new Date();

  const isExpiredButActive =
    isActive && billing?.canceledAt && new Date(billing.canceledAt) <= new Date();

  const daysRemaining = isTrialing ? getDaysRemaining(billing?.trialEndsAt ?? null) : 0;

  const displayStatus: SubscriptionStatus =
    isTrialExpired ? "past_due" :
    (isCanceledButActive || isExpiredButActive) ? "canceled" :
    billing?.subscriptionStatus ?? null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{!billing || !billing.stripeSubscriptionId ? "One last step" : "Billing"}</h1>
        <p className="text-sm text-gray-500 mt-1">{!billing || !billing.stripeSubscriptionId ? "Start your free trial to activate your quote link and go live." : "Manage your subscription and billing information."}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Your Plan</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {hasSubscription
                ? "Subscription details and billing"
                : "Start your 14-day free trial — no charge until the 14 days are up"}
            </p>
          </div>
          {getStatusBadge(displayStatus)}
        </div>

        {/* Plan summary */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
          <div className="flex items-end gap-1 mb-4">
            <span className="text-4xl font-extrabold text-gray-900">${PLAN_PRICE}</span>
            <span className="text-gray-400 pb-1">/month</span>
          </div>
          <ul className="space-y-2">
            {PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
                <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Status alerts */}
        {isTrialExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="w-full">
                <p className="font-semibold text-red-900 text-sm">Trial Expired</p>
                <p className="text-sm text-red-700 mt-1">
                  Your trial ended on <span className="font-semibold">{formatDate(billing?.trialEndsAt ?? null)}</span>.
                </p>
                <button onClick={handleManageSubscription} disabled={isProcessing} className="mt-3 text-sm font-medium text-red-700 underline disabled:opacity-50">
                  {isProcessing ? "Opening..." : "Update Payment Method"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isTrialing && !isTrialExpired && !isTrialCanceled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 text-sm">Free Trial Active</p>
                <p className="text-sm text-blue-700 mt-1">
                  <span className="font-semibold">{daysRemaining} days</span> remaining.
                  Card charged on <span className="font-semibold">{formatDate(billing?.trialEndsAt ?? null)}</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        {isTrialCanceled && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="w-full">
                <p className="font-semibold text-orange-900 text-sm">Trial Canceled</p>
                <p className="text-sm text-orange-700 mt-1">Access until <span className="font-semibold">{formatDate(billing?.canceledAt ?? null)}</span>.</p>
                <button onClick={handleManageSubscription} disabled={isProcessing} className="mt-3 text-sm font-medium text-orange-700 underline disabled:opacity-50">
                  {isProcessing ? "Opening..." : "Reactivate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isCanceledButActive && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="w-full">
                <p className="font-semibold text-orange-900 text-sm">Subscription Canceled</p>
                <p className="text-sm text-orange-700 mt-1">Access until <span className="font-semibold">{formatDate(billing?.canceledAt ?? null)}</span>.</p>
                <button onClick={handleManageSubscription} disabled={isProcessing} className="mt-3 text-sm font-medium text-orange-700 underline disabled:opacity-50">
                  {isProcessing ? "Opening..." : "Reactivate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {(isExpiredButActive || isCanceled) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-gray-500 mt-0.5 shrink-0" />
              <div className="w-full">
                <p className="font-semibold text-gray-900 text-sm">Subscription Ended</p>
                <p className="text-sm text-gray-600 mt-1">Resubscribe to continue using the app.</p>
                <button onClick={handleStartTrial} disabled={isProcessing} className="mt-3 text-sm font-medium text-gray-900 underline disabled:opacity-50">
                  {isProcessing ? "Processing..." : `Resubscribe — $${PLAN_PRICE}/mo`}
                </button>
              </div>
            </div>
          </div>
        )}

        {isActive && !isCanceledButActive && !isExpiredButActive && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-green-900 text-sm">Subscription Active</p>
                {billing?.currentPeriodEnd && (
                  <p className="text-sm text-green-700 mt-1">
                    Next billing date: <span className="font-semibold">{formatDate(billing.currentPeriodEnd)}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        {!hasSubscription ? (
          <div className="space-y-2">
            <button
              onClick={handleStartTrial}
              disabled={isProcessing}
              className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? "Processing..." : `Start 14-Day Free Trial — $${PLAN_PRICE}/mo after`}
            </button>
            <p className="text-xs text-center text-gray-400">No charge for 14 days. Cancel anytime before trial ends.</p>
          </div>
        ) : (
          <div className="border-t pt-4">
            <button
              onClick={handleManageSubscription}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              {isProcessing ? "Opening..." : "Manage Subscription"}
            </button>
            <p className="text-xs text-gray-400 mt-2">Update payment method, view invoices, or cancel in the Stripe portal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
