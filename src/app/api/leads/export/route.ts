import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema/leads";
import { quotes } from "@/lib/db/schema/quotes";
import { contracts } from "@/lib/db/schema/contracts";
import { leadPhotos } from "@/lib/db/schema/lead-photos";
import { eq } from "drizzle-orm";

function esc(val: string | null | undefined): string {
  if (!val) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function fmtCents(cents: number | null | undefined): string {
  if (!cents) return "";
  return `$${cents.toLocaleString("en-US")}`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US");
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  // Fetch all data in parallel
  const [allLeads, allQuotes, allContracts, allPhotos] = await Promise.all([
    db.select().from(leads).where(eq(leads.companyId, company.id)).orderBy(leads.createdAt),
    db.select().from(quotes).where(eq(quotes.companyId, company.id)),
    db.select().from(contracts).where(eq(contracts.companyId, company.id)),
    db.select().from(leadPhotos),
  ]);

  // Index by leadId for fast lookup
  const quotesByLead = new Map<string, typeof allQuotes[0]>();
  for (const q of allQuotes) {
    if (q.leadId && !quotesByLead.has(q.leadId)) quotesByLead.set(q.leadId, q);
  }

  const contractsByLead = new Map<string, typeof allContracts[0]>();
  for (const c of allContracts) {
    if (c.leadId && !contractsByLead.has(c.leadId)) contractsByLead.set(c.leadId, c);
  }

  const photosByLead = new Map<string, string[]>();
  for (const p of allPhotos) {
    const existing = photosByLead.get(p.leadId) ?? [];
    existing.push(p.photoUrl);
    photosByLead.set(p.leadId, existing);
  }

  const headers = [
    // Contact
    "Name", "Phone", "Email",
    // Location
    "Address", "City", "State", "Zip",
    // Job
    "Service", "Status", "Timeline", "Description",
    // Estimate
    "Estimate Low", "Estimate High",
    // Quote
    "Quote #", "Quote Status", "Quote Total", "Quote Sent", "Quote Accepted",
    // Contract
    "Contract Status", "Contract Signed", "Signer Name", "Signer Email",
    // Schedule
    "Scheduled Start", "Scheduled End",
    // Photos
    "Photo URLs",
    // Meta
    "Notes", "Created",
  ];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.craftcapture.com";

  const csvRows = allLeads.map((l) => {
    const quote = quotesByLead.get(l.id);
    const contract = contractsByLead.get(l.id);
    const photos = photosByLead.get(l.id) ?? [];

    return [
      esc(l.homeownerName),
      esc(l.homeownerPhone),
      esc(l.homeownerEmail),
      esc(l.address),
      esc(l.city),
      esc(l.state),
      esc(l.zip),
      esc(l.serviceType),
      esc(l.status),
      esc(l.preferredTimeline),
      esc(l.description),
      fmtCents(l.aiEstimateLow),
      fmtCents(l.aiEstimateHigh),
      esc(quote?.quoteNumber),
      esc(quote?.status),
      fmtCents(quote?.totalCents),
      fmtDate(quote?.sentAt),
      fmtDate(quote?.acceptedAt),
      esc(contract?.status),
      fmtDate(contract?.signedAt),
      esc(contract?.signerName),
      esc(contract?.signerEmail),
      fmtDate(l.scheduledAt),
      fmtDate(l.scheduledEndAt),
      esc(photos.join(" | ")),
      esc(l.notes),
      fmtDate(l.createdAt),
    ].join(",");
  });

  const csv = [headers.join(","), ...csvRows].join("\n");
  const filename = `craftcapture-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
