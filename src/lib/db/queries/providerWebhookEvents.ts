import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { providerWebhookEvents, type NewProviderWebhookEvent } from "../schema/providerWebhookEvents";

export async function hasProcessedEvent(provider: string, providerEventId: string): Promise<boolean> {
  const existing = await db.query.providerWebhookEvents.findFirst({
    where: and(
      eq(providerWebhookEvents.provider, provider),
      eq(providerWebhookEvents.providerEventId, providerEventId)
    ),
  });
  return !!existing;
}

/**
 * Record a webhook event as processed. Returns false without throwing if the event
 * was already recorded (duplicate delivery) — callers should skip processing in that case.
 */
export async function recordProcessedEvent(data: NewProviderWebhookEvent): Promise<boolean> {
  try {
    await db.insert(providerWebhookEvents).values(data);
    return true;
  } catch (err) {
    // Unique constraint violation on (provider, providerEventId) = duplicate delivery
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "23505") {
      return false;
    }
    throw err;
  }
}
