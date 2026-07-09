import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getPricingRulesByBusiness } from "@/lib/db/queries/pricingRules";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { withCustomServiceOptions } from "@/lib/verticals/customOptions";
import { SettingsTabs } from "./_form";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const sp = await searchParams;
  const [pricingRules, verticalConfig] = await Promise.all([
    getPricingRulesByBusiness(business.id),
    getVerticalConfig(business.vertical),
  ]);

  return (
    <div className="font-cv-body text-cv-ink">
      <div className="mb-[22px]">
        <h1 className="font-cv-heading text-[34px] leading-[1.15] tracking-tight">Settings</h1>
        <p className="mt-[7px] text-cv-muted text-sm leading-relaxed">
          Configure how Callverted captures, qualifies, prices, and delivers opportunities.
        </p>
      </div>
      <SettingsTabs
        business={business}
        pricingRules={pricingRules}
        serviceOptions={
          verticalConfig ? withCustomServiceOptions(verticalConfig.questions, business.customServiceOptions)[0]?.options ?? [] : []
        }
        initialTab={sp.tab}
      />
    </div>
  );
}
