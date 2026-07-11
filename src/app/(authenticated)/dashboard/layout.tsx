import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getNewLeadsCount, getLeadsByBusiness } from "@/lib/db/queries/leads";
import { type BannerState } from "@/components/dashboard/subscription-banner";
import { DashboardShell } from "@/components/dashboard/v2/Shell";
import { hasPaymentOnFile } from "@/lib/subscription";

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
  if (!business) {
    redirect("/onboarding");
  }

  const bannerState = getBannerState(business);
  const [newLeadsCount, recentNewLeads] = await Promise.all([
    getNewLeadsCount(business.id),
    getLeadsByBusiness(business.id, { leadStatus: "new", limit: 5 }),
  ]);
  const isVoiceLive = Boolean(
    business.twilioPhoneNumber && !business.isPaused && hasPaymentOnFile(business)
  );

  return (
    <DashboardShell
      businessName={business.businessName}
      serviceArea={business.serviceArea}
      vertical={business.vertical}
      isVoiceLive={isVoiceLive}
      newLeadsCount={newLeadsCount}
      recentNewLeads={recentNewLeads}
      bannerState={bannerState}
    >
      {children}
    </DashboardShell>
  );
}
