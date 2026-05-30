"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";

export default function NewLeadForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [form, setForm] = useState({
    callerName: "",
    callerPhone: "",
    notes: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "callerPhone") setPhoneError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.callerPhone.trim()) {
      setPhoneError("Phone number is required.");
      return;
    }
    const phoneResult = validateAndNormalizePhone(form.callerPhone);
    if (!phoneResult.isValid) {
      setPhoneError(phoneResult.error ?? "Invalid phone number.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerName: form.callerName || undefined,
          callerPhone: phoneResult.normalized,
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create lead");

      router.push(`/dashboard/leads/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/leads" className="text-sm text-gray-400 hover:text-gray-600">
          ← Leads
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Add lead manually</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.callerName}
              onChange={(e) => update("callerName", e.target.value)}
              placeholder="Jane Smith"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
            <input
              type="tel"
              value={form.callerPhone}
              onChange={(e) => update("callerPhone", e.target.value)}
              placeholder="+1 (555) 000-0000"
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${phoneError ? "border-red-400" : "border-gray-200"}`}
            />
            {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes</p>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            placeholder="Any context about this lead…"
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        <div className="px-5 py-4 flex gap-3">
          <Link
            href="/dashboard/leads"
            className="flex-1 text-center border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
