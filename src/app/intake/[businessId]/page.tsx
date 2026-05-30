import { getBusinessById } from "@/lib/db/queries/businesses";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { IntakeForm } from "./_form";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Unavailable({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-500 text-lg">×</span>
        </div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

export default async function IntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ lead?: string; source?: string }>;
}) {
  const { businessId } = await params;
  const { lead: leadId, source } = await searchParams;

  if (!UUID_RE.test(businessId)) {
    return <Unavailable message="This intake form is no longer available." />;
  }

  const business = await getBusinessById(businessId);
  if (!business) {
    return <Unavailable message="This intake form is no longer available." />;
  }

  const config = await getVerticalConfig(business.vertical);
  if (!config) {
    return <Unavailable message="This form is temporarily unavailable. Please try again later." />;
  }

  return (
    <IntakeForm
      businessId={businessId}
      businessName={business.businessName}
      questions={config.questions}
      leadId={leadId}
      source={source}
    />
  );
}
