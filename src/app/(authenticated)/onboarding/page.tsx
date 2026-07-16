import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { OnboardingForm } from "./_form";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (business) redirect("/dashboard");

  // Prefill from the Clerk identity (Google sign-in already gives us a verified
  // email + name) so the form doesn't ask for what we already have.
  const user = await currentUser();
  const initialEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const initialName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return <OnboardingForm initialEmail={initialEmail} initialName={initialName} />;
}
