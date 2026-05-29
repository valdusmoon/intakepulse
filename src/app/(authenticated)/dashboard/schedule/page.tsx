import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import ScheduleWrapper from "./schedule-wrapper";

export default async function SchedulePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const company = await getCompanyByClerkId(userId);
  if (!company) redirect("/onboarding");

  return <ScheduleWrapper />;
}
