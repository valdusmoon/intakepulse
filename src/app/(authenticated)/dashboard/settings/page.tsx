import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { SettingsForm } from "./_form";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your business profile, phone config, and notifications.</p>
      </div>
      <SettingsForm business={business} />
    </div>
  );
}
