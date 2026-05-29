import { notFound } from "next/navigation";
import { getContractByToken, updateContract } from "@/lib/db/queries/contracts";
import { getCompanyById } from "@/lib/db/queries/companies";
import { getLeadById } from "@/lib/db/queries/leads";
import ContractSignForm from "./ContractSignForm";

export default async function PublicContractPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const contract = await getContractByToken(token);
  if (!contract) notFound();

  const [company, lead] = await Promise.all([
    getCompanyById(contract.companyId),
    contract.leadId ? getLeadById(contract.leadId) : null,
  ]);

  if (!company) notFound();

  // Track first view
  if (!contract.viewedAt) {
    updateContract(contract.id, { viewedAt: new Date() }).catch(() => {});
  }

  const homeownerName = lead?.homeownerName ?? "Homeowner";
  const isSigned = !!contract.signedAt;
  const isVoid = contract.status === "void";
  const canSign = !isSigned && !isVoid && contract.status === "sent";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Status banners */}
        {isSigned && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-center">
            <p className="text-green-800 font-semibold text-sm">Contract Signed</p>
            <p className="text-green-600 text-xs mt-0.5">
              Signed by {contract.signerName} on{" "}
              {new Date(contract.signedAt!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        )}
        {isVoid && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-center">
            <p className="text-gray-700 font-semibold text-sm">This contract has been voided</p>
            <p className="text-gray-400 text-xs mt-0.5">Contact {company.businessName} for more information.</p>
          </div>
        )}

        {/* Contract card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

          {/* Header */}
          <div className="px-4 sm:px-7 pt-7 pb-5 border-b border-gray-100">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-gray-900">{company.businessName}</p>
                {company.businessPhone && <p className="text-sm text-gray-500 mt-0.5">{company.businessPhone}</p>}
                {company.businessEmail && <p className="text-sm text-gray-500">{company.businessEmail}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[.6rem] font-bold text-gray-400 uppercase tracking-widest">Service Agreement</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(contract.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Prepared for */}
          <div className="px-4 sm:px-7 py-5 border-b border-gray-100">
            <p className="text-[.65rem] font-semibold text-gray-400 uppercase tracking-wide mb-1">Prepared for</p>
            <p className="text-base font-semibold text-gray-900">{homeownerName}</p>
            {lead?.address && <p className="text-sm text-gray-500 mt-0.5">{lead.address}</p>}
            {lead?.homeownerPhone && <p className="text-sm text-gray-500">{lead.homeownerPhone}</p>}
            {lead?.homeownerEmail && <p className="text-sm text-gray-500">{lead.homeownerEmail}</p>}
          </div>

          {/* Contract body */}
          <div className="px-4 sm:px-7 py-6 border-b border-gray-100">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
              {contract.contractBody}
            </pre>
          </div>

          {/* Sign section */}
          <div className="px-4 sm:px-7 py-6">
            {canSign ? (
              <ContractSignForm
                contractId={contract.id}
                token={token}
                homeownerName={homeownerName}
              />
            ) : isSigned ? (
              <div className="text-center py-2">
                <p className="text-sm font-semibold text-green-700">Signed by {contract.signerName}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(contract.signedAt!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ) : (
              <button disabled className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-xl opacity-40 cursor-not-allowed">
                Sign Contract
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">Powered by CraftCapture</p>
      </div>
    </div>
  );
}
