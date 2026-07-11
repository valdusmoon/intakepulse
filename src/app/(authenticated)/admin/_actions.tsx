"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Per-row sales-assist controls: extend the trial or comp the account. */
export function AdminBusinessActions({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function grant(body: Record<string, unknown>, label: string) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setMsg(label);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={busy}
        onClick={() => grant({ action: "extend_trial", days: 14 }, "Trial +14d")}
        className="rounded-lg border border-cv-border px-2.5 py-1 text-xs font-bold text-cv-ink hover:bg-cv-surface-subtle disabled:opacity-50"
      >
        +14d trial
      </button>
      <button
        disabled={busy}
        onClick={() => grant({ action: "comp" }, "Comped")}
        className="rounded-lg border border-cv-border px-2.5 py-1 text-xs font-bold text-cv-ink hover:bg-cv-surface-subtle disabled:opacity-50"
      >
        Comp
      </button>
      {msg && <span className="text-xs font-bold text-cv-green">{msg}</span>}
    </div>
  );
}
