import { redirect } from "next/navigation";

// Billing now lives as a Settings tab (see the mockup's information architecture —
// there's no standalone "Billing" nav item). This route stays alive only because
// Stripe checkout's cancelUrl and the billing portal's returnUrl still point here.
export default async function BillingRedirectPage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const sp = await searchParams;
  redirect(`/dashboard/settings?tab=billing${sp?.canceled ? "&canceled=true" : ""}`);
}
