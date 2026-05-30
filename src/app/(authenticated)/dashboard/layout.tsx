import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { SubscriptionBanner, type BannerState } from "@/components/dashboard/subscription-banner";
import { NavLinks } from "@/components/dashboard/NavLinks";
import { NewUserBanner } from "@/components/dashboard/new-user-banner";

function getBannerState(business: NonNullable<Awaited<ReturnType<typeof getBusinessByClerkId>>>): BannerState {
  const { subscriptionStatus, trialEndsAt, canceledAt } = business;
  const now = new Date();
  const GRACE_MS = 60 * 1000;

  if (!subscriptionStatus) return { type: "no_subscription" };

  if (subscriptionStatus === "trialing") {
    if (!trialEndsAt || trialEndsAt.getTime() + GRACE_MS <= now.getTime()) {
      return { type: "trial_expired" };
    }
    const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { type: "trialing", daysLeft };
  }

  if (subscriptionStatus === "active") {
    if (canceledAt && canceledAt <= now) return { type: "ended" };
    if (canceledAt && canceledAt > now) return { type: "canceled", accessUntil: canceledAt.toISOString() };
    return { type: "none" };
  }

  if (subscriptionStatus === "canceled") {
    if (canceledAt && canceledAt > now) return { type: "canceled", accessUntil: canceledAt.toISOString() };
    return { type: "ended" };
  }

  if (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid") {
    return { type: "payment_failed" };
  }

  return { type: "ended" };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business || !business.onboardingCompleted) {
    redirect("/onboarding");
  }

  const bannerState = getBannerState(business);

  return (
    <div className="min-h-screen" style={{ background: "#E8EAF0" }}>
      {/* Top nav */}
      <nav className="relative bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <img src="/icon-mark.svg" alt="IntakePulse" className="w-7 h-7 shrink-0" />
              <span className="text-sm font-semibold text-gray-900 hidden sm:block">{business.businessName}</span>
            </Link>
            <NavLinks />
          </div>
          <div className="flex items-center gap-3">
            <UserButton />
          </div>
        </div>
      </nav>

      <SubscriptionBanner state={bannerState} />
      <NewUserBanner businessCreatedAt={business.createdAt.toISOString()} />

      <main className="max-w-5xl mx-auto px-4 py-6 sm:p-6">{children}</main>
    </div>
  );
}
