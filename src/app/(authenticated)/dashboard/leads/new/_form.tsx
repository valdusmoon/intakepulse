"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";

const SERVICE_TYPES = [
  { value: "", label: "Select..." },
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "both", label: "Interior + Exterior" },
  { value: "other", label: "Other" },
];

const TIMELINES = [
  { value: "", label: "Select..." },
  { value: "asap", label: "ASAP" },
  { value: "within_2_weeks", label: "Within 2 weeks" },
  { value: "within_month", label: "Within a month" },
  { value: "flexible", label: "Flexible" },
];

interface FormErrors {
  homeownerName?: string;
  homeownerPhone?: string;
  homeownerEmail?: string;
}

export default function NewLeadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [generateSummary, setGenerateSummary] = useState(false);

  const [form, setForm] = useState({
    homeownerName: "",
    homeownerPhone: "",
    homeownerEmail: "",
    address: "",
    serviceType: "",
    description: "",
    timeline: "",
    notes: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotos(Array.from(e.target.files ?? []).slice(0, 5));
  }

  function validate(): boolean {
    const next: FormErrors = {};

    if (!form.homeownerName.trim()) next.homeownerName = "Name is required";

    const phoneResult = validateAndNormalizePhone(form.homeownerPhone);
    if (!phoneResult.isValid) next.homeownerPhone = phoneResult.error;

    if (!form.homeownerEmail.trim()) {
      next.homeownerEmail = "Email is required to send quotes and contracts";
    } else {
      const emailResult = validateAndNormalizeEmail(form.homeownerEmail);
      if (!emailResult.isValid) next.homeownerEmail = emailResult.error;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Upload photos to Supabase Storage first (we need a temp ID since lead doesn't exist yet)
      // Use a random UUID as the folder — the API will update lead_photos with the returned leadId
      // Photo upload removed — storage.ts deleted, not needed for IntakePulse V1
      const photoUrls: string[] = [];

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoUrls, generateSummary }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create lead");

      router.push(`/dashboard/leads/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const hasPhotos = photos.length > 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leads" className="text-sm text-gray-400 hover:text-gray-700">
          ← All leads
        </Link>
        <h1 className="text-[1.4rem] font-extrabold tracking-tight text-[#0F1628]" style={{ fontFamily: "var(--font-sora)" }}>Add lead manually</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-[14px] border border-[#E2E8F0] divide-y divide-[#E2E8F0]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.05)" }}>

        {/* Contact */}
        <div className="px-4 py-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                value={form.homeownerName}
                onChange={(e) => update("homeownerName", e.target.value)}
                placeholder="Jane Smith"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.homeownerName ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.homeownerName && <p className="mt-1 text-xs text-red-500">{errors.homeownerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.homeownerPhone}
                onChange={(e) => update("homeownerPhone", e.target.value)}
                placeholder="(512) 555-0100"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.homeownerPhone ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.homeownerPhone && <p className="mt-1 text-xs text-red-500">{errors.homeownerPhone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.homeownerEmail}
              onChange={(e) => update("homeownerEmail", e.target.value)}
              placeholder="jane@example.com"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.homeownerEmail ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.homeownerEmail
              ? <p className="mt-1 text-xs text-red-500">{errors.homeownerEmail}</p>
              : <p className="mt-1 text-xs text-gray-400">Required to send quotes and contracts.</p>
            }
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="123 Main St, Austin TX"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Job details */}
        <div className="px-4 py-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Details</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service type</label>
              <select
                value={form.serviceType}
                onChange={(e) => update("serviceType", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                {SERVICE_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
              <select
                value={form.timeline}
                onChange={(e) => update("timeline", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                {TIMELINES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="3 bedrooms, good condition, going from dark gray to white..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photos <span className="text-gray-400 font-normal">(optional, up to 5)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
            {photos.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
              >
                + Add photos
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {photos.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600">
                      <span>📷</span>
                      <span className="max-w-[120px] truncate">{f.name}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Change photos
                </button>
              </div>
            )}
          </div>

        </div>

        {/* AI photo summary */}
        <div className="px-4 py-4">
          <label className={`flex items-start gap-3 cursor-pointer ${!hasPhotos ? "opacity-40" : ""}`}>
            <input
              type="checkbox"
              checked={generateSummary}
              onChange={(e) => setGenerateSummary(e.target.checked)}
              disabled={!hasPhotos}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Generate AI photo notes</p>
              <p className="text-xs text-gray-400 mt-0.5">
                GPT-4o writes a condition assessment from the photos. Adds ~10 seconds.
                {!hasPhotos && " Add photos to enable."}
              </p>
            </div>
          </label>
        </div>

        {/* Notes */}
        <div className="px-4 py-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Private Notes</p>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            placeholder="Notes visible only to you..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="px-4 py-4 flex gap-3">
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
            {submitting
              ? generateSummary ? "Analyzing photos..." : "Saving..."
              : "Add lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
