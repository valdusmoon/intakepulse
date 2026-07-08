"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { Card, CardHeader, CardTitle, CardBody, FormGroup, Field, Select, TextArea, Button, Icon } from "@/components/dashboard/v2/primitives";

const SOURCES = [
  { value: "manual", label: "Manual entry" },
  { value: "email", label: "Email / referral" },
  { value: "website_widget", label: "Website form" },
];

export default function NewLeadForm() {
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
  });

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
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
    <div className="font-cv-body text-cv-ink max-w-lg">
      <Link href="/dashboard/leads" className="inline-flex items-center gap-1.5 text-cv-muted text-xs font-bold mb-3 hover:text-cv-ink transition-colors">
        <Icon name="arrow_back" className="!text-base" />
        Back to leads
      </Link>
      <h1 className="font-cv-heading text-[28px] leading-[1.15] tracking-tight mb-4">Add a lead</h1>

      {error && <div className="bg-cv-red-soft border border-[#f3c9c3] rounded-[10px] px-4 py-3 text-sm text-cv-red mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="!text-base">Manual lead entry</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-4">
            <FormGroup label="Caller name">
              <Field value={form.callerName} onChange={(e) => update("callerName", e.target.value)} placeholder="Full name" />
            </FormGroup>

            <FormGroup label="Phone number">
              <Field
                type="tel"
                value={form.callerPhone}
                onChange={(e) => update("callerPhone", e.target.value)}
                placeholder="(305) 000-0000"
                className={phoneError ? "!border-cv-red" : ""}
              />
              {phoneError && <p className="mt-1.5 text-xs text-cv-red">{phoneError}</p>}
            </FormGroup>

            <FormGroup label="Email (optional)">
              <Field type="email" value={form.callerEmail} onChange={(e) => update("callerEmail", e.target.value)} placeholder="name@example.com" />
            </FormGroup>

            <FormGroup label="Source">
              <Select value={form.source} onChange={(e) => update("source", e.target.value)}>
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Notes">
              <TextArea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="How did they reach out? What did they mention?" />
            </FormGroup>
          </CardBody>

          <div className="px-5 py-4 border-t border-cv-border flex gap-2.5">
            <Link href="/dashboard/leads" className="flex-1 text-center border border-cv-border-strong rounded-[9px] py-2.5 text-[13px] font-bold text-cv-ink hover:bg-cv-surface-subtle transition-colors">
              Cancel
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
              {submitting ? "Saving…" : "Save lead"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
