import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema/leads";
import { companies } from "@/lib/db/schema/companies";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [row] = await db
    .select({ lead: leads, company: companies })
    .from(leads)
    .innerJoin(companies, eq(leads.companyId, companies.id))
    .where(eq(leads.reviewRequestToken, token));

  if (!row || !row.company.googleReviewUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Stamp clicked_at on first click only
  if (!row.lead.reviewRequestClickedAt) {
    await db
      .update(leads)
      .set({ reviewRequestClickedAt: new Date() })
      .where(eq(leads.reviewRequestToken, token));
  }

  return NextResponse.redirect(row.company.googleReviewUrl, 302);
}
