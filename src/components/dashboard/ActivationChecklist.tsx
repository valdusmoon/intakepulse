"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody, Icon } from "@/components/dashboard/v2/primitives";
import type { SetupStage } from "@/lib/subscription";

function fmtNumber(e164: string | null) {
  if (!e164) return "your Callverted number";
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

// Where the owner should publish their Callverted number so calls actually route
// through it. Listing it as the public business number is the real go-live action.
const LISTING_CHANNELS: { icon: string; label: string }[] = [
  { icon: "business", label: "Google Business Profile" },
  { icon: "thumb_up", label: "Facebook page" },
  { icon: "public", label: "Your website + contact page" },
  { icon: "menu_book", label: "Yelp, Yellow Pages, Angi, etc." },
];

/**
 * First-run activation checklist. Replaces the wall-of-zeros for a brand-new
 * account and falls away once the first lead lands. "Get your line live" is the
 * real commitment step: the owner publishes their Callverted (Twilio) number as
 * their public business number so calls come into it. Callverted then rings the
 * owner's real line first and the AI only answers if no one picks up. That listing
 * update is external, so we can't detect it; the owner self-confirms it (persists
 * numberPublished), and we offer a "book a setup call" escape.
 *
 * Model B: before a card is on file (setupStage === "needs_payment") there is no
 * real Twilio number to publish yet, so the second step becomes the "Add payment
 * & go live" commitment instead of the publish-your-number guide. Once payment is
 * on file it reverts to the publish flow below.
 */
export function ActivationChecklist({
  hasTestCall,
  numberPublished,
  widgetInstalled,
  callvertedNumber,
  assistedUrl,
  setupStage,
}: {
  hasTestCall: boolean;
  numberPublished: boolean;
  widgetInstalled: boolean;
  callvertedNumber: string | null;
  assistedUrl: string | null;
  setupStage: SetupStage;
}) {
  const router = useRouter();
  const [showGoLive, setShowGoLive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [goingLive, setGoingLive] = useState(false);
  const [goLiveError, setGoLiveError] = useState("");

  const needsPayment = setupStage === "needs_payment";

  // PHASE 1 STUB: stands in for real Stripe Checkout. Flips the existing business
  // to trialing so the setup-mode → live transition is testable now. Phase 2
  // swaps this single call for POST /api/stripe/checkout + redirect.
  async function startGoLive() {
    setGoingLive(true);
    setGoLiveError("");
    try {
      const res = await fetch("/api/onboarding/mock-subscribe", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setGoLiveError("Couldn't start your trial. Please try again.");
      setGoingLive(false);
    }
  }

  async function copyNumber() {
    if (!callvertedNumber) return;
    try {
      await navigator.clipboard.writeText(fmtNumber(callvertedNumber));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions) — no-op, the number is on screen.
    }
  }

  // Before a card, step 2 is "add payment" (never "done" while shown — the moment
  // payment lands, setupStage advances and this variant is replaced). After a
  // card, step 2 is "publish your number", done when numberPublished.
  const step2Done = needsPayment ? false : numberPublished;
  const steps = [
    { key: "test", done: hasTestCall },
    { key: "live", done: step2Done },
    { key: "widget", done: widgetInstalled },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  async function confirmPublished() {
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberPublished: true }),
      });
      if (!res.ok) throw new Error("failed");
      setShowGoLive(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const rowBase = "flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-colors w-full text-left";
  const rowState = (done: boolean) =>
    done ? "border-cv-border bg-cv-surface-subtle" : "border-cv-border hover:border-cv-primary hover:bg-cv-surface-blue";
  const bullet = (done: boolean, n: number) => (
    <div
      className={`w-8 h-8 rounded-full grid place-items-center shrink-0 text-xs font-extrabold ${
        done ? "bg-cv-green text-white" : "bg-cv-primary-soft text-cv-primary"
      }`}
    >
      {done ? <Icon name="check" className="!text-[17px]" /> : n}
    </div>
  );

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <div>
            <CardTitle>Finish setting up</CardTitle>
            <p className="text-[11px] text-cv-muted mt-1">
              {needsPayment
                ? "You're in setup mode — test freely, then add a card to go live"
                : "A couple of steps and you are capturing every call"}
            </p>
          </div>
          <span className="font-cv-mono text-xs font-bold text-cv-muted">{doneCount}/3 done</span>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">
          {/* 1. Test call */}
          <Link href="/dashboard/test-call" className={`${rowBase} ${rowState(hasTestCall)}`}>
            {bullet(hasTestCall, 1)}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${hasTestCall ? "text-cv-muted line-through" : "text-cv-ink"}`}>
                Make your first test call
              </p>
              {!hasTestCall && (
                <p className="text-xs text-cv-muted mt-0.5">Hear the AI answer and watch it qualify a lead in real time.</p>
              )}
            </div>
            {!hasTestCall && <Icon name="arrow_forward" className="!text-[18px] text-cv-primary shrink-0" />}
          </Link>

          {/* 2. Go live — before a card, this is the payment commitment; after a
              card, it's the publish-your-number guide. */}
          {needsPayment ? (
            <button
              type="button"
              onClick={startGoLive}
              disabled={goingLive}
              className={`${rowBase} border-cv-primary bg-cv-surface-blue hover:bg-cv-primary-soft disabled:opacity-70`}
            >
              {bullet(false, 2)}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-cv-ink">Add payment &amp; go live</p>
                <p className="text-xs text-cv-muted mt-0.5">
                  {goLiveError
                    ? goLiveError
                    : "Add a card to get your live number and start capturing real calls. No charge for 14 days."}
                </p>
              </div>
              {goingLive ? (
                <span className="text-xs font-bold text-cv-primary shrink-0">Starting…</span>
              ) : (
                <Icon name="arrow_forward" className="!text-[18px] text-cv-primary shrink-0" />
              )}
            </button>
          ) : (
            <button type="button" onClick={() => setShowGoLive(true)} className={`${rowBase} ${rowState(numberPublished)}`}>
              {bullet(numberPublished, 2)}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${numberPublished ? "text-cv-muted line-through" : "text-cv-ink"}`}>
                  Get your line live
                </p>
                {!numberPublished && (
                  <p className="text-xs text-cv-muted mt-0.5">Publish your Callverted number so new callers route through it.</p>
                )}
              </div>
              {!numberPublished && <Icon name="arrow_forward" className="!text-[18px] text-cv-primary shrink-0" />}
            </button>
          )}

          {/* 3. Website capture */}
          <Link href="/dashboard/capture" className={`${rowBase} ${rowState(widgetInstalled)}`}>
            {bullet(widgetInstalled, 3)}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${widgetInstalled ? "text-cv-muted line-through" : "text-cv-ink"}`}>
                Set up website capture
              </p>
              {!widgetInstalled && (
                <p className="text-xs text-cv-muted mt-0.5">Add the widget or share your intake link to catch web leads too.</p>
              )}
            </div>
            {!widgetInstalled && <Icon name="arrow_forward" className="!text-[18px] text-cv-primary shrink-0" />}
          </Link>
        </CardBody>
      </Card>

      {showGoLive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-cv-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-cv-heading text-lg font-bold text-cv-ink">Get your line live</h3>
            <p className="text-sm text-cv-muted mt-1">
              Put your Callverted number where new customers find you. It rings your own phone first and only steps in
              when you cannot pick up, so you stop losing after-hours and overflow calls.
            </p>

            {/* How a call flows once the number is published */}
            <div className="mt-4 rounded-xl bg-cv-surface-blue border border-[#dce5ff] p-4">
              <div className="flex items-stretch justify-between gap-1.5 text-center">
                {[
                  { icon: "call", label: "Caller dials your Callverted number", tint: "text-cv-ink" },
                  { icon: "phone_forwarded", label: "It rings your line first", tint: "text-cv-primary" },
                  { icon: "bolt", label: "No answer? AI qualifies the lead", tint: "text-cv-primary" },
                  { icon: "sms", label: "You get a ready lead", tint: "text-cv-green" },
                ].map((node, i, arr) => (
                  <div key={node.label} className="flex items-center gap-1.5 flex-1">
                    <div className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className="cv-flow-node grid h-9 w-9 place-items-center rounded-full bg-white shadow-cv-sm"
                        style={{ animationDelay: `${i * 0.6}s` }}
                      >
                        <Icon name={node.icon} className={`!text-[19px] ${node.tint}`} />
                      </div>
                      <p className="text-[10px] leading-tight text-cv-muted">{node.label}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <Icon
                        name="arrow_forward"
                        className="cv-flow-arrow !text-[15px] text-cv-primary shrink-0 self-start mt-2.5"
                        style={{ animationDelay: `${i * 0.6 + 0.3}s` }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* The number to publish, with copy */}
            <div className="mt-4 rounded-xl bg-cv-surface-blue border border-[#dce5ff] p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cv-primary">Your Callverted number</p>
              <p className="font-cv-heading text-2xl font-bold text-cv-ink mt-1">{fmtNumber(callvertedNumber)}</p>
              {callvertedNumber && (
                <button
                  type="button"
                  onClick={copyNumber}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-cv-primary hover:underline"
                >
                  <Icon name={copied ? "check" : "content_copy"} className="!text-[15px]" />
                  {copied ? "Copied" : "Copy number"}
                </button>
              )}
            </div>

            {/* Where to list it */}
            <div className="mt-4">
              <p className="text-sm font-bold text-cv-ink">List it as your business number on:</p>
              <div className="mt-2.5 grid grid-cols-1 gap-2">
                {LISTING_CHANNELS.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center gap-2.5 rounded-xl border border-cv-border bg-cv-surface-subtle px-3.5 py-2.5"
                  >
                    <Icon name={c.icon} className="!text-[18px] text-cv-primary shrink-0" />
                    <span className="text-sm text-cv-ink">{c.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-cv-muted">
                <span className="font-semibold text-cv-ink">Your old number still works.</span> Anyone who already has it
                reaches you directly, exactly as before. Callverted only catches the calls to your new public number.
              </p>
            </div>

            {assistedUrl && (
              <a
                href={assistedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-cv-border px-4 py-2.5 text-sm font-bold text-cv-primary hover:bg-cv-surface-subtle transition-colors"
              >
                <Icon name="calendar_month" className="!text-[18px]" />
                Rather have us set it up? Book a 15 min call
              </a>
            )}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowGoLive(false)}
                className="flex-1 rounded-xl border border-cv-border px-4 py-3 text-sm font-bold text-cv-ink hover:bg-cv-surface-subtle transition-colors"
              >
                I&apos;ll do this later
              </button>
              <button
                type="button"
                onClick={confirmPublished}
                disabled={saving}
                className="flex-1 rounded-xl bg-cv-primary px-4 py-3 text-sm font-bold text-white hover:bg-cv-primary-dark disabled:opacity-60 transition-colors"
              >
                {saving ? "Saving..." : "I've listed my number"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
