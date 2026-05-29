import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { leads } from "./leads";

export const leadPhotos = pgTable("lead_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").notNull().references(() => leads.id),

  photoUrl: text("photo_url").notNull(), // Supabase storage URL (local path for now)
  photoType: text("photo_type").notNull().default("room"), // room, exterior, damage, other

  // Stored AI vision response for this photo (optional)
  aiAnalysis: jsonb("ai_analysis"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LeadPhoto = typeof leadPhotos.$inferSelect;
export type NewLeadPhoto = typeof leadPhotos.$inferInsert;
