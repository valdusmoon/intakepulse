import { NextResponse } from "next/server";
import { requireTelnyxSignature } from "@/lib/telnyx/webhooks";
import { transferCall } from "@/lib/telnyx/client";
import { getBusinessByTelnyxNumber, getBusinessById } from "@/lib/db/queries/businesses";
import { createCall, getCallByControlId, updateCall } from "@/lib/db/queries/calls";
import { createLead } from "@/lib/db/queries/leads";
import { createSmsEvent } from "@/lib/db/queries/smsEvents";
import { createFollowup } from "@/lib/db/queries/followups";
import { sendSms, smsMissedCallRecovery } from "@/lib/sms";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.callverted.com";

// How long to wait before the follow-up SMS fires (picked up by the cron)
const FOLLOWUP_DELAY_HOURS = 3;

export async function POST(req: Request) {
  const { rawBody, error } = await requireTelnyxSignature(req);
  if (error) return error;

  const payload = JSON.parse(rawBody);
  const eventType: string = payload?.data?.event_type ?? "";
  const data = payload?.data?.payload ?? {};

  const callControlId: string = data.call_control_id ?? "";
  const callLegId: string = data.call_leg_id ?? "";
  const callerPhone: string = data.from ?? "";
  const calledNumber: string = data.to ?? "";

  logger.info("Telnyx call event", { eventType, callControlId, callerPhone, calledNumber });

  if (eventType === "call.initiated") {
    return handleInitiated({ callControlId, callLegId, callerPhone, calledNumber });
  }
  if (eventType === "call.answered") {
    return handleAnswered({ callControlId });
  }
  if (eventType === "call.hangup") {
    return handleHangup({ callControlId, callerPhone });
  }

  return NextResponse.json({ ok: true });
}

async function handleInitiated({
  callControlId, callLegId, callerPhone, calledNumber,
}: {
  callControlId: string;
  callLegId: string;
  callerPhone: string;
  calledNumber: string;
}) {
  const business = await getBusinessByTelnyxNumber(calledNumber);
  if (!business) {
    logger.warn("call.initiated: no business for number", { calledNumber });
    return NextResponse.json({ ok: true });
  }

  await createCall({
    businessId: business.id,
    telnyxCallControlId: callControlId,
    telnyxCallLegId: callLegId,
    callerPhone,
    calledNumber,
    status: "ringing",
    rawPayload: { callControlId, callLegId, callerPhone, calledNumber },
  });

  if (business.forwardingNumber) {
    try {
      await transferCall(callControlId, business.forwardingNumber);
    } catch (err) {
      logger.error("call.initiated: transfer failed", { callControlId, err: String(err) });
    }
  } else {
    logger.warn("call.initiated: no forwardingNumber", { businessId: business.id });
  }

  return NextResponse.json({ ok: true });
}

async function handleAnswered({ callControlId }: { callControlId: string }) {
  const call = await getCallByControlId(callControlId);
  if (!call) {
    logger.warn("call.answered: no record found", { callControlId });
    return NextResponse.json({ ok: true });
  }

  await updateCall(call.id, { status: "answered", answeredAt: new Date() });
  return NextResponse.json({ ok: true });
}

async function handleHangup({
  callControlId,
  callerPhone,
}: {
  callControlId: string;
  callerPhone: string;
}) {
  const call = await getCallByControlId(callControlId);
  if (!call) {
    logger.warn("call.hangup: no record found", { callControlId });
    return NextResponse.json({ ok: true });
  }

  const now = new Date();

  if (call.answeredAt) {
    await updateCall(call.id, { endedAt: now });
    return NextResponse.json({ ok: true });
  }

  // ── Missed call ───────────────────────────────────────────────────────────
  await updateCall(call.id, { status: "missed", missedAt: now, endedAt: now });

  const lead = await createLead({
    businessId: call.businessId,
    callerPhone,
    source: "missed_call",
    callStatus: "missed",
    status: "sms_sent",
    smsConsent: false,
  });

  await updateCall(call.id, { leadId: lead.id });

  // Fetch business for SMS content and Telnyx number
  const business = await getBusinessById(call.businessId);
  if (!business?.telnyxPhoneNumber) {
    logger.warn("handleHangup: business missing telnyxPhoneNumber", { businessId: call.businessId });
    return NextResponse.json({ ok: true });
  }

  // Build the intake URL — includes leadId so the form pre-links to this lead
  const intakeUrl = `${APP_URL}/intake/${business.id}?lead=${lead.id}&source=missed_call`;
  const smsBody = smsMissedCallRecovery(business.businessName, intakeUrl);

  // Send initial SMS directly — no queue needed, fires immediately
  const messageId = await sendSms(business.telnyxPhoneNumber, callerPhone, smsBody);

  await createSmsEvent({
    businessId: business.id,
    leadId: lead.id,
    direction: "outbound",
    fromPhone: business.telnyxPhoneNumber,
    toPhone: callerPhone,
    body: smsBody,
    telnyxMessageId: messageId ?? undefined,
    status: "sent",
  });

  // Schedule a follow-up row — the cron (0 16,20,23 * * *) picks this up
  const scheduledAt = new Date(now.getTime() + FOLLOWUP_DELAY_HOURS * 60 * 60 * 1000);
  await createFollowup({
    leadId: lead.id,
    businessId: business.id,
    sequence: 1,
    scheduledAt,
  });

  logger.info("Missed call handled", { leadId: lead.id, businessId: business.id, callerPhone });

  return NextResponse.json({ ok: true });
}
