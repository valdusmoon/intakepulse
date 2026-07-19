import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import NewLeadForm from "./_form";

export default async function NewLeadPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  // Same two questions the public intake asks, so a hand-entered lead scores and
  // ranks alongside every other source instead of sitting outside the queue.
  const config = await getVerticalConfig(business.vertical);
  const questions = (config?.questions ?? []).filter((q) => !q.voiceExtractOnly);

  return <NewLeadForm questions={questions} />;
}
