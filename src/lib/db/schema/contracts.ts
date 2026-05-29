import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { quotes } from "./quotes";
import { leads } from "./leads";

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),

  // draft | sent | signed | void
  status: text("status").notNull().default("draft"),

  // Full contract text (painter edits this before sending)
  contractBody: text("contract_body").notNull().default(""),

  // Filled on signing
  signerName: text("signer_name"),
  signerEmail: text("signer_email"),
  signerIp: text("signer_ip"),

  // Public link token (for /contract/[token])
  publicToken: text("public_token").notNull().unique(),

  // Lifecycle timestamps
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  signedAt: timestamp("signed_at"),
  nudgeSentAt: timestamp("nudge_sent_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
