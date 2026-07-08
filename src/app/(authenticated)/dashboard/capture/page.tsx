import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { Card, CardHeader, CardTitle, CardBody, Icon } from "@/components/dashboard/v2/primitives";
import { WidgetEmbed } from "@/components/dashboard/v2/WidgetEmbed";
import { CopyButton } from "@/components/dashboard/v2/CopyButton";

export default async function CapturePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await getBusinessByClerkId(userId);
  if (!business) redirect("/onboarding");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.callverted.com";
  const intakeUrl = `${appUrl}/intake/${business.id}`;

  return (
    <div className="font-cv-body text-cv-ink">
      <div className="mb-[22px]">
        <h1 className="font-cv-heading text-[34px] leading-[1.15] tracking-tight">Capture</h1>
        <p className="mt-[7px] text-cv-muted text-sm leading-relaxed">
          Use the same qualification and pricing rules across calls and your website.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 min-h-[260px] flex flex-col">
          <div className="w-11 h-11 grid place-items-center rounded-xl bg-cv-primary-soft text-cv-primary mb-[18px]">
            <Icon name="link" />
          </div>
          <h3 className="font-cv-heading text-[19px]">Direct intake link</h3>
          <p className="mt-2 text-cv-muted text-xs leading-relaxed">
            Share a public qualification form in ads, email signatures, or your Google Business Profile.
          </p>
          <div className="border border-cv-border rounded-[11px] p-3.5 my-4">
            <strong className="text-xs block break-all">{intakeUrl}</strong>
            <div className="border border-cv-border rounded-[7px] px-2.5 py-2 mt-[7px] text-[10px] text-[#475467]">
              Contact info → vertical Q&A → submitted
            </div>
          </div>
          <div className="mt-auto self-start">
            <CopyButton value={intakeUrl} />
          </div>
        </Card>

        <Card className="p-5 min-h-[260px] flex flex-col">
          <div className="w-11 h-11 grid place-items-center rounded-xl bg-cv-purple-soft text-cv-purple mb-[18px]">
            <Icon name="widgets" />
          </div>
          <h3 className="font-cv-heading text-[19px]">Website widget</h3>
          <p className="mt-2 text-cv-muted text-xs leading-relaxed">
            Add a lead-capture experience to your existing website without replacing it.
          </p>
          <div className="mt-4">
            <WidgetEmbed businessId={business.id} />
          </div>
        </Card>

        <Card className="p-5 min-h-[260px] flex flex-col">
          <div className="w-11 h-11 grid place-items-center rounded-xl bg-cv-green-soft text-cv-green mb-[18px]">
            <Icon name="phone_in_talk" />
          </div>
          <h3 className="font-cv-heading text-[19px]">Voice overflow</h3>
          <p className="mt-2 text-cv-muted text-xs leading-relaxed">
            Already live on your Callverted number — the same questions and pricing rules run on every missed call.
          </p>
          <div className="border border-cv-border rounded-[11px] p-3.5 my-4">
            <strong className="text-xs block">{business.twilioPhoneNumber ?? "Not yet provisioned"}</strong>
            <div className="border border-cv-border rounded-[7px] px-2.5 py-2 mt-[7px] text-[10px] text-[#475467]">
              New/existing → vertical Q&A → price guidance → callback
            </div>
          </div>
          <a href="/dashboard/settings" className="mt-auto text-cv-primary text-[13px] font-bold hover:underline">
            Configure call setup →
          </a>
        </Card>
      </section>

      <Card className="mt-4">
        <CardHeader>
          <div>
            <CardTitle className="!text-base">Customer intake preview</CardTitle>
            <p className="text-[11px] text-cv-muted mt-1">The live form your website visitors and callers both feed into.</p>
          </div>
          <a href={intakeUrl} target="_blank" rel="noopener noreferrer" className="text-cv-primary text-[13px] font-bold hover:underline whitespace-nowrap">
            Open live form ↗
          </a>
        </CardHeader>
        <CardBody>
          <div className="rounded-xl border border-cv-border overflow-hidden bg-gradient-to-br from-[#f7f9ff] to-[#f4f6f8]">
            <iframe src={`/intake/${business.id}`} className="w-full h-[650px] border-0" title="Intake form preview" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
