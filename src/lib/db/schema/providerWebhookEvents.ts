import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// Idempotency ledger for inbound provider webhooks (Twilio status/recording callbacks,
// and dormant Telnyx events). One row per delivered event; the unique constraint on
// (provider, providerEventId) lets handlers safely ignore duplicate deliveries.
export const providerWebhookEvents = pgTable(
  "provider_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    provider: text("provider").notNull(), // 'twilio' | 'telnyx'
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),

    payload: jsonb("payload"),
    processedAt: timestamp("processed_at").defaultNow().notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("provider_webhook_events_provider_event_unique").on(
      table.provider,
      table.providerEventId
    ),
  ]
);

export type ProviderWebhookEvent = typeof providerWebhookEvents.$inferSelect;
export type NewProviderWebhookEvent = typeof providerWebhookEvents.$inferInsert;
