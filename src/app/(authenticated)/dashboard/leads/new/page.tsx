import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import NewLeadForm from "./_form";

export default async function NewLeadPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  return <NewLeadForm />;
}
