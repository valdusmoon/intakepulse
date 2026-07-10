import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { TestCallClient } from "./_client";

export default async function TestCallPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  return (
    <div className="font-cv-body text-cv-ink">
      <div className="mb-[22px]">
        <h1 className="font-cv-heading text-[34px] leading-[1.15] tracking-tight">Test call</h1>
        <p className="mt-[7px] text-cv-muted text-sm leading-relaxed">
          Run through the voice intake flow by typing what a caller would say — no phone call needed. Runs the exact
          same conversation logic and scoring as a real call.
        </p>
      </div>
      <TestCallClient businessName={business.businessName} />
    </div>
  );
}
