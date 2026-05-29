import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NewLeadForm from "./_form";

export default async function NewLeadPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <NewLeadForm />;
}
