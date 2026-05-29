import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { leads } from "./leads";

// Line items stored as JSONB — no separate table needed
export interface QuoteLineItemData {
  id: string;
  sortOrder: number;
  name: string;
  description: string;
  quantity: string;
  unit: string; // sqft | lf | hr | flat | ea
  unitPrice: string; // dollar string e.g. "1.50"
  totalCents: number;
}

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),

  // Sequential number per company: CC-0001
  quoteNumber: text("quote_number").notNull(),

  // interior | exterior | both | custom
  quoteType: text("quote_type").notNull().default("interior"),

  // draft | sent | accepted | declined | expired
  status: text("status").notNull().default("draft"),

  // Dates stored as YYYY-MM-DD strings (no timezone issues)
  issueDate: text("issue_date").notNull(),
  validUntil: text("valid_until").notNull(),

  // Line items (array of QuoteLineItemData)
  lineItems: jsonb("line_items").notNull().$type<QuoteLineItemData[]>().default([]),

  // Financials (all in cents)
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  discountType: text("discount_type"), // flat | percent | null
  discountCents: integer("discount_cents").notNull().default(0),
  taxRateBps: integer("tax_rate_bps").notNull().default(0), // basis points e.g. 875 = 8.75%
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),

  // Content
  homeownerMessage: text("homeowner_message"),
  depositNote: text("deposit_note"),
  internalNotes: text("internal_notes"),

  // Public view token (random string, used for /q/[token] URL later)
  publicToken: text("public_token").notNull().unique(),

  // Lifecycle timestamps
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  nudgeSentAt: timestamp("nudge_sent_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
