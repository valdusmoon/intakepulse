"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody, Icon } from "@/components/dashboard/v2/primitives";

function fmtNumber(e164: string | null) {
  if (!e164) return "your Callverted number";
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

// 10-digit national number, used to build the carrier dial codes.
function nationalDigits(e164: string | null) {
  const m = e164?.match(/^\+1(\d{10})$/);
  return m ? m[1] : (e164 ?? "").replace(/\D/g, "");
}

// Conditional-call-forwarding (forward-on-no-answer/busy) codes for the major US
// carriers. These leave the phone ringing on the owner's end first and only send
// unanswered/busy calls to Callverted, so it never hijacks calls they can take.
// Codes do vary by plan/region, hence the caveat + "book a call" escape in the UI.
const CARRIERS: {
  id: string;
  name: string;
  activate: (n: string) => string;
  deactivate: string;
}[] = [
  { id: "verizon", name: "Verizon", activate: (n) => `*71${n}`, deactivate: "*73" },
  { id: "att", name: "AT&T", activate: (n) => `*004*${n}#`, deactivate: "##004#" },
  { id: "tmobile", name: "T-Mobile", activate: (n) => `**004*${n}#`, deactivate: "##004#" },
  { id: "other", name: "Other / GSM", activate: (n) => `**004*${n}#`, deactivate: "##004#" },
];

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
  const [carrierId, setCarrierId] = useState("verizon");
  const [copied, setCopied] = useState(false);

  const carrier = CARRIERS.find((c) => c.id === carrierId) ?? CARRIERS[0];
  const dialDigits = nationalDigits(callvertedNumber);
  const activateCode = carrier.activate(dialDigits);

  const stepsText = useMemo(
    () =>
      [
        `Get your line live on ${carrier.name}:`,
        `1. Open your phone's dialer.`,
        `2. Dial ${activateCode} and press call.`,
        `3. Wait for the confirmation tone, then hang up.`,
        ``,
        `Missed and busy calls now route to Callverted at ${fmtNumber(callvertedNumber)}.`,
        `To turn it off later, dial ${carrier.deactivate}.`,
      ].join("\n"),
    [carrier, activateCode, callvertedNumber]
  );

  async function copySteps() {
    try {
      await navigator.clipboard.writeText(stepsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions) — no-op, the steps are on screen.
    }
  }

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

            {/* Routing diagram: caller -> missed -> Callverted -> text back to owner */}
            <div className="mt-4 rounded-xl bg-cv-surface-blue border border-[#dce5ff] p-4">
              <div className="flex items-stretch justify-between gap-1.5 text-center">
                {[
                  { icon: "call", label: "Caller rings your line", tint: "text-cv-ink" },
                  { icon: "phone_missed", label: "You can't pick up", tint: "text-cv-muted" },
                  { icon: "bolt", label: "Callverted answers & qualifies", tint: "text-cv-primary" },
                  { icon: "sms", label: "You get a ready lead", tint: "text-cv-green" },
                ].map((node, i, arr) => (
                  <div key={node.label} className="flex items-center gap-1.5 flex-1">
                    <div className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-cv-sm">
                        <Icon name={node.icon} className={`!text-[19px] ${node.tint}`} />
                      </div>
                      <p className="text-[10px] leading-tight text-cv-muted">{node.label}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <Icon name="arrow_forward" className="!text-[15px] text-cv-primary/50 shrink-0 self-start mt-2.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-cv-surface-blue border border-[#dce5ff] p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cv-primary">Your Callverted number</p>
              <p className="font-cv-heading text-2xl font-bold text-cv-ink mt-1">{fmtNumber(callvertedNumber)}</p>
            </div>

            {/* Carrier-specific conditional-forwarding walkthrough */}
            <div className="mt-4">
              <p className="text-sm font-bold text-cv-ink">Forward the calls you miss</p>
              <p className="text-xs text-cv-muted mt-0.5">
                This rings your phone first and only sends unanswered or busy calls to Callverted. Pick your carrier:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {CARRIERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCarrierId(c.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      c.id === carrierId
                        ? "bg-cv-primary text-white"
                        : "border border-cv-border text-cv-ink hover:bg-cv-surface-subtle"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-cv-border bg-cv-surface-subtle p-3.5">
                <ol className="space-y-1.5 text-sm text-cv-ink">
                  <li className="flex gap-2">
                    <span className="font-bold text-cv-primary">1.</span> Open your phone's dialer.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-cv-primary">2.</span>
                    <span>
                      Dial{" "}
                      <code className="rounded bg-white border border-cv-border px-1.5 py-0.5 font-cv-mono text-[13px] font-bold text-cv-primary-dark">
                        {activateCode}
                      </code>{" "}
                      and press call.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-cv-primary">3.</span> Wait for the confirmation tone, then hang up.
                  </li>
                </ol>
                <p className="mt-2.5 text-[11px] text-cv-muted">
                  To turn it off later, dial{" "}
                  <code className="font-cv-mono font-bold">{carrier.deactivate}</code>. Codes can vary by plan, so if it
                  does not take, we will set it up with you.
                </p>
                <button
                  type="button"
                  onClick={copySteps}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-cv-primary hover:underline"
                >
                  <Icon name={copied ? "check" : "content_copy"} className="!text-[15px]" />
                  {copied ? "Copied" : "Copy these steps"}
                </button>
              </div>

              <p className="mt-3 text-xs text-cv-muted">
                <span className="font-semibold text-cv-ink">Prefer not to forward?</span> List the number above on your
                Google Business Profile, website, and socials so calls reach Callverted from the start.
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
