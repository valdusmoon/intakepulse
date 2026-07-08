import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { businesses } from "./businesses";

// 'fixed': fixedAmount is the exact price (e.g. diagnostic fee)
// 'preliminary_range': minimumAmount–maximumAmount, final price depends on inspection
// 'starting': startingAmount is a "starting at" floor (e.g. installation work)
// 'inspection_required': no caller-facing number at all — team must review first
export type PricingType = "fixed" | "preliminary_range" | "starting" | "inspection_required";

export const pricingRules = pgTable("pricing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),

  vertical: text("vertical").notNull(),
  // Must match a serviceCategory the AI can classify calls into for this vertical
  serviceCategory: text("service_category").notNull(),

  pricingType: text("pricing_type").notNull().$type<PricingType>(),

  // All amounts in cents
  minimumAmount: integer("minimum_amount"),
  maximumAmount: integer("maximum_amount"),
  fixedAmount: integer("fixed_amount"),
  startingAmount: integer("starting_amount"),

  // The exact, business-approved sentence the AI reads verbatim — the AI never composes pricing itself
  approvedCustomerMessage: text("approved_customer_message").notNull(),
  disclaimer: text("disclaimer"),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PricingRule = typeof pricingRules.$inferSelect;
export type NewPricingRule = typeof pricingRules.$inferInsert;
