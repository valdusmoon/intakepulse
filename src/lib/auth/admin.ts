import { auth } from "@clerk/nextjs/server";

/**
 * Admin access for sales-assist actions (extend a trial, comp an account) on the
 * handful of warm leads closed by phone. Self-serve stays the default; this is the
 * exception. Admins are named by Clerk user id in ADMIN_CLERK_USER_IDS
 * (comma-separated). Empty/unset means there are no admins.
 */
function adminIds(): string[] {
  return (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return adminIds().includes(userId);
}

/** Returns the admin's userId, or null if the caller is not a signed-in admin. */
export async function requireAdmin(): Promise<string | null> {
  const { userId } = await auth();
  return isAdminUserId(userId) ? userId : null;
}
