"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody, Icon } from "@/components/dashboard/v2/primitives";

function fmtNumber(e164: string | null) {
  if (!e164) return "your Callverted number";
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

/**
 * First-run activation checklist. Replaces the wall-of-zeros for a brand-new
 * account and falls away once the first lead lands. "Get your line live" is the
 * real commitment step: the owner forwards their existing/GBP number to their
 * Callverted number. That's carrier-level and external, so we can't detect it;
 * the owner self-confirms it (persists forwardingConfirmed), and we offer a
 * "book a setup call" escape for anyone who would rather not do it solo.
 */
export function ActivationChecklist({
  hasTestCall,
  forwardingConfirmed,
  widgetInstalled,
  callvertedNumber,
  assistedUrl,
}: {
  hasTestCall: boolean;
  forwardingConfirmed: boolean;
  widgetInstalled: boolean;
  callvertedNumber: string | null;
  assistedUrl: string | null;
}) {
  const router = useRouter();
  const [showGoLive, setShowGoLive] = useState(false);
  const [saving, setSaving] = useState(false);

  const steps = [
    { key: "test", done: hasTestCall },
    { key: "live", done: forwardingConfirmed },
    { key: "widget", done: widgetInstalled },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  async function confirmForwarding() {
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forwardingConfirmed: true }),
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
            <p className="text-[11px] text-cv-muted mt-1">A couple of steps and you are capturing every call</p>
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

          {/* 2. Get your line live (opens the forwarding guide) */}
          <button type="button" onClick={() => setShowGoLive(true)} className={`${rowBase} ${rowState(forwardingConfirmed)}`}>
            {bullet(forwardingConfirmed, 2)}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${forwardingConfirmed ? "text-cv-muted line-through" : "text-cv-ink"}`}>
                Get your line live
              </p>
              {!forwardingConfirmed && (
                <p className="text-xs text-cv-muted mt-0.5">Forward the calls you miss to Callverted so no lead slips through.</p>
              )}
            </div>
            {!forwardingConfirmed && <Icon name="arrow_forward" className="!text-[18px] text-cv-primary shrink-0" />}
          </button>

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
              The last step is routing the calls you miss to Callverted. Do this and you stop losing after-hours and
              overflow calls for good.
            </p>

            <div className="mt-4 rounded-xl bg-cv-surface-blue border border-[#dce5ff] p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cv-primary">Your Callverted number</p>
              <p className="font-cv-heading text-2xl font-bold text-cv-ink mt-1">{fmtNumber(callvertedNumber)}</p>
            </div>

            <div className="mt-4 space-y-2.5 text-sm text-cv-ink">
              <p className="font-bold">Two easy ways to route calls to it:</p>
              <div className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cv-primary" />
                <p className="text-cv-muted">
                  <span className="font-semibold text-cv-ink">Forward missed calls.</span> Set your business phone to
                  forward on no-answer or busy to the number above. Most carriers use a short code (often *71 or *61
                  followed by the number and #); the exact code varies by carrier.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cv-primary" />
                <p className="text-cv-muted">
                  <span className="font-semibold text-cv-ink">Or list it directly.</span> Show the number above on your
                  Google Business Profile, website, and social profiles so calls reach Callverted from the start.
                </p>
              </div>
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
                onClick={confirmForwarding}
                disabled={saving}
                className="flex-1 rounded-xl bg-cv-primary px-4 py-3 text-sm font-bold text-white hover:bg-cv-primary-dark disabled:opacity-60 transition-colors"
              >
                {saving ? "Saving..." : "I've set up forwarding"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
