"use client";

import Link from "next/link";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";

/**
 * Scoped Clerk island for the landing page nav — swaps "Log in" + "Start free
 * trial" for a single "Dashboard" link once a signed-in session resolves
 * client-side. Deliberately not using the root layout's ClerkProvider (there
 * isn't one — see middleware.ts, which excludes "/" from Clerk's server-side
 * auth check entirely for perf) so the rest of the landing page never pays
 * for Clerk on the anonymous common case; this component carries its own
 * provider so only this small island does.
 */
export function AuthAwareNavCta() {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <SignedIn>
        <Link
          href="/dashboard"
          className="text-sm font-semibold bg-landing-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Dashboard
        </Link>
      </SignedIn>
      <SignedOut>
        <Link href="/sign-in" className="text-sm text-white/60 hover:text-white transition-colors">Log in</Link>
        <Link
          href="/sign-up"
          className="text-sm font-semibold bg-landing-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Start free trial
        </Link>
      </SignedOut>
    </ClerkProvider>
  );
}
