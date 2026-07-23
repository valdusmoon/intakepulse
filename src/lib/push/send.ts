import webpush from "web-push";

import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsForBusiness,
} from "@/lib/db/queries/pushSubscriptions";
import { env, serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

let configured = false;

// web-push needs the VAPID keys set once per process. Returns false (and logs)
// when keys are missing so callers can no-op instead of throwing on every lead.
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !serverEnv.VAPID_PRIVATE_KEY) {
    return false;
  }
  webpush.setVapidDetails(
    serverEnv.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    serverEnv.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

// The JSON the service worker receives in its `push` event (see public/sw.js).
export interface LeadPushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

/**
 * Fan a push notification out to every device an operator has subscribed. Best
 * effort: individual failures are logged, and endpoints the push service reports
 * as gone (404/410) are pruned so we stop trying them. Never throws — it's called
 * fire-and-forget from the lead-ready path, alongside the email.
 *
 * Returns the number of notifications successfully accepted by push services.
 */
export async function sendLeadPushNotification(
  businessId: string,
  payload: LeadPushPayload,
): Promise<number> {
  if (!ensureConfigured()) {
    logger.warn("push: VAPID keys not configured, skipping", { businessId });
    return 0;
  }

  const subs = await getPushSubscriptionsForBusiness(businessId);
  if (subs.length === 0) return 0;

  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body,
        {
          // A lead alert is worth waking a dozing phone for — "high" tells
          // FCM/APNs to deliver immediately instead of batching.
          urgency: "high",
          // If the device stays unreachable this long, the moment has passed —
          // the email and dashboard carry it from there. Also keeps rotted
          // endpoints from accumulating a queue of ancient alerts.
          TTL: 60 * 60,
        },
      ),
    ),
  );

  let delivered = 0;
  let pruned = 0;
  let failed = 0;
  await Promise.all(
    results.map(async (result, i) => {
      if (result.status === "fulfilled") {
        delivered += 1;
        return;
      }
      const err = result.reason as { statusCode?: number } | undefined;
      const status = err?.statusCode;
      // 404 Not Found / 410 Gone → subscription is dead, remove it.
      if (status === 404 || status === 410) {
        pruned += 1;
        await deletePushSubscriptionByEndpoint(subs[i].endpoint).catch(() => {});
        logger.info("push: pruned expired subscription", { businessId, status });
      } else {
        failed += 1;
        logger.error("push: send failed", {
          businessId,
          status,
          error: String(result.reason),
        });
      }
    }),
  );

  // Always log the fan-out outcome — a silent success is exactly how the
  // stale-endpoint blackhole hid (201s to a dead endpoint, nothing in the logs).
  logger.info("push: lead notification fan-out", {
    businessId,
    devices: subs.length,
    delivered,
    pruned,
    failed,
  });

  return delivered;
}
