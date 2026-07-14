import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { businesses } from "./businesses";

// Web Push subscriptions for operator lead alerts (PWA push, push-primary /
// SMS-fallback). One row per browser/device endpoint. A business (operator) can
// have several — desktop Chrome, an installed iOS PWA, etc. — so we notify all of
// them. Keyed by the push `endpoint`, which is globally unique per subscription.
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  // The Clerk user that created the subscription — for attribution/debugging;
  // the business is the notification target.
  clerkUserId: text("clerk_user_id"),

  // The PushSubscription fields (from the browser Push API).
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),

  // Best-effort device label (navigator.userAgent) so an operator can tell which
  // device a subscription belongs to when managing/removing them.
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
