import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { Check } from "lucide-react";
import { CallvertedLogo } from "@/components/CallvertedLogo";

const BULLETS = [
  "Run a test call before adding a card",
  "Your team rings first, always",
  "Go live only when you're ready",
  "14-day free trial",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/onboarding"
    >
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left: branded value panel — keeps the trust/momentum from the marketing
            page instead of dropping the visitor onto a blank auth box. Hidden on
            small screens where the Clerk card takes the full width. */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#0b1b3a] to-[#16305f] p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <CallvertedLogo className="h-9 w-9 rounded-[10px]" gradientId="cvLogoAuthPanel" />
            <span className="text-lg font-bold">Callverted</span>
          </Link>

          <div className="max-w-md">
            <h1 className="font-bold text-3xl leading-tight">Start recovering missed calls in minutes.</h1>
            <ul className="mt-8 space-y-4">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-3 text-white/90">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[15px]">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="max-w-md text-sm text-white/60">
            A real person helps you launch. You approve the intake and pricing, and nothing goes live until you&apos;re
            ready.
          </p>
        </div>

        {/* Right: the Clerk sign-in / sign-up widget, centered. */}
        <div className="flex items-center justify-center bg-white p-6">{children}</div>
      </div>
    </ClerkProvider>
  );
}
