import { NextResponse } from "next/server";
import { requireTelnyxSignature } from "@/lib/telnyx/webhooks";
import { getBusinessByTelnyxNumber } from "@/lib/db/queries/businesses";
import { getLeadByPhoneAndBusiness } from "@/lib/db/queries/leads";
import { createSmsEvent, updateSmsEventStatus } from "@/lib/db/queries/smsEvents";
import { cancelFollowupsForLead } from "@/lib/db/queries/followups";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const { rawBody, error } = await requireTelnyxSignature(req);
  if (error) return error;

  const payload = JSON.parse(rawBody);
  const eventType: string = payload?.data?.event_type ?? "";
  const data = payload?.data?.payload ?? {};

  // ── Outbound delivery status updates ─────────────────────────────────────
  if (eventType === "message.sent" || eventType === "message.delivered" || eventType === "message.failed") {
    const messageId: string = data.id ?? "";
    const status = eventType === "message.delivered" ? "delivered"
      : eventType === "message.failed" ? "failed"
      : "sent";
    if (messageId) await updateSmsEventStatus(messageId, status);
    return NextResponse.json({ ok: true });
  }

  // ── Inbound SMS (prospect texting back) ───────────────────────────────────
  if (eventType === "message.received") {
    const fromPhone: string = data.from?.phone_number ?? "";
    const toPhone: string = data.to?.[0]?.phone_number ?? "";
    const body: string = data.text ?? "";

    logger.info("Inbound SMS", { fromPhone, toPhone, body: body.slice(0, 80) });

    const business = await getBusinessByTelnyxNumber(toPhone);
    if (!business) {
      logger.warn("Inbound SMS: no business for number", { toPhone });
      return NextResponse.json({ ok: true });
    }

    const lead = await getLeadByPhoneAndBusiness(fromPhone, business.id);

    await createSmsEvent({
      businessId: business.id,
      leadId: lead?.id ?? null,
      direction: "inbound",
      fromPhone,
      toPhone,
      body,
      status: "delivered",
      rawPayload: data,
    });

    // Cancel any pending follow-ups — they replied, no need to nudge again
    if (lead) {
      await cancelFollowupsForLead(lead.id, "replied");
      logger.info("Follow-ups cancelled — lead replied via SMS", { leadId: lead.id });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
