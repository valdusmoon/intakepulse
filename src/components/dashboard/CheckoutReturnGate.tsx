"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Shown right after Stripe redirects back to /dashboard?checkout_success=true
 * while the business is still in `needs_payment` — i.e. the checkout.session
 * webhook hasn't written the subscription yet. It refreshes the server
 * component on an interval until the stage advances (at which point the parent
 * stops rendering this and the number-selection step appears), so the user
 * never sees the stale "add payment" screen a beat after they just paid.
 */
export function CheckoutReturnGate() {
  const router = useRouter();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const poll = setInterval(() => router.refresh(), 2500);
    const slowTimer = setTimeout(() => setSlow(true), 20000);
    return () => {
      clearInterval(poll);
      clearTimeout(slowTimer);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm p-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-[3px] border-cv-border border-t-cv-primary" />
        <h2 className="font-cv-heading text-xl font-bold text-cv-ink">Starting your free trial…</h2>
        <p className="mt-2 text-sm text-cv-muted">
          One moment while we confirm your payment. Next, you&apos;ll pick your Callverted number. No charge for 14 days.
        </p>
        {slow && (
          <p className="mt-4 text-xs text-cv-muted">
            Taking longer than usual.{" "}
            <button type="button" onClick={() => router.refresh()} className="font-bold text-cv-primary hover:underline">
              Refresh
            </button>{" "}
            or{" "}
            <Link href="/dashboard/billing" className="font-bold text-cv-primary hover:underline">
              check billing
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
