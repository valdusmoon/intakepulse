"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";

const SOURCES = [
  { value: "manual", label: "Manual entry" },
  { value: "email", label: "Email / referral" },
  { value: "embed", label: "Website form" },
];

const inputCls = "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";
const labelCls = "block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5";

export default function NewLeadForm({ businessName }: { businessName: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [form, setForm] = useState({
    callerName: "",
    callerPhone: "",
    callerEmail: "",
    source: "manual",
    notes: "",
    sendSms: false,
  });

  function update<K extends keyof typeof form>(field: K, value: typeof form[K]) {
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
          callerEmail: form.callerEmail.trim() || undefined,
          source: form.source,
          notes: form.notes || undefined,
          sendIntakeSms: form.sendSms,
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
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/dashboard/leads" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Leads
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-base font-semibold text-gray-900">New Lead</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Manual Lead Entry</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-5 space-y-4">

            <div>
              <label className={labelCls}>Caller Name</label>
              <input
                type="text"
                value={form.callerName}
                onChange={(e) => update("callerName", e.target.value)}
                placeholder="Full name"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Phone Number</label>
              <input
                type="tel"
                value={form.callerPhone}
                onChange={(e) => update("callerPhone", e.target.value)}
                placeholder="(305) 000-0000"
                className={`${inputCls} ${phoneError ? "border-red-400 focus:ring-red-300" : ""}`}
              />
              {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
            </div>

            <div>
              <label className={labelCls}>Email <span className="normal-case font-normal text-gray-400">(optional)</span></label>
              <input
                type="email"
                value={form.callerEmail}
                onChange={(e) => update("callerEmail", e.target.value)}
                placeholder="name@example.com"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Source</label>
              <select
                value={form.source}
                onChange={(e) => update("source", e.target.value)}
                className={inputCls}
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                placeholder="How did they reach out? What did they mention?"
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* SMS checkbox */}
            <label className="flex items-start gap-3 p-3.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={form.sendSms}
                onChange={(e) => update("sendSms", e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-orange-500 shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Send intake link via SMS immediately</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Lead receives: &ldquo;Hi, {businessName} here — tap here to tell us about your situation: [link]&rdquo;
                </p>
              </div>
            </label>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
            <Link
              href="/dashboard/leads"
              className="flex-1 text-center border border-gray-200 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
