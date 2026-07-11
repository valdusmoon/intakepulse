import { inArray } from "drizzle-orm";
import { db } from "../index";
import { emailSuppressions } from "../schema/emailSuppressions";

function normalize(email: string) {
  return email.trim().toLowerCase();
}

/** True if this address has opted out of commercial email. */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const rows = await db
    .select({ email: emailSuppressions.email })
    .from(emailSuppressions)
    .where(inArray(emailSuppressions.email, [normalize(email)]))
    .limit(1);
  return rows.length > 0;
}

/** Return the subset of the given addresses that are suppressed (lowercased). */
export async function getSuppressedSet(emails: string[]): Promise<Set<string>> {
  const normalized = emails.map(normalize);
  if (normalized.length === 0) return new Set();
  const rows = await db
    .select({ email: emailSuppressions.email })
    .from(emailSuppressions)
    .where(inArray(emailSuppressions.email, normalized));
  return new Set(rows.map((r) => r.email));
}

/** Record an opt-out. Idempotent — a repeat unsubscribe is a no-op. */
export async function suppressEmail(email: string, source = "unsubscribe_link"): Promise<void> {
  await db
    .insert(emailSuppressions)
    .values({ email: normalize(email), source })
    .onConflictDoNothing({ target: emailSuppressions.email });
}
