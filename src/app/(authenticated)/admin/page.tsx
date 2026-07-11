import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { getAllBusinesses } from "@/lib/db/queries/businesses";
import { AdminBusinessActions } from "./_actions";

/** Minimal admin console: sales-assist grants for warm leads. Gated by
 *  ADMIN_CLERK_USER_IDS; anyone else gets a 404 (no hint the page exists). */
export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const businesses = await getAllBusinesses();
  const sorted = [...businesses].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  function fmt(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="min-h-screen bg-cv-bg font-cv-body text-cv-ink p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-cv-heading text-2xl font-bold mb-1">Admin</h1>
        <p className="text-sm text-cv-muted mb-6">{businesses.length} businesses. Sales-assist grants for warm leads.</p>

        <div className="overflow-x-auto rounded-xl border border-cv-border bg-cv-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cv-border text-left text-xs text-cv-muted">
                <th className="px-4 py-3 font-bold">Business</th>
                <th className="px-4 py-3 font-bold">Owner</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Trial ends</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => (
                <tr key={b.id} className="border-b border-cv-border last:border-b-0">
                  <td className="px-4 py-3 font-bold">{b.businessName}</td>
                  <td className="px-4 py-3 text-cv-muted">{b.ownerName}</td>
                  <td className="px-4 py-3">{b.subscriptionStatus ?? "none"}</td>
                  <td className="px-4 py-3 text-cv-muted font-cv-mono text-xs">{fmt(b.trialEndsAt)}</td>
                  <td className="px-4 py-3">
                    <AdminBusinessActions businessId={b.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
