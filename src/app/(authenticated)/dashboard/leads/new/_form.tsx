"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { Card, CardHeader, CardTitle, CardBody, FormGroup, Field, Select, TextArea, Button, Icon } from "@/components/dashboard/v2/primitives";

const SOURCES = [
  { value: "manual", label: "Manual entry" },
  { value: "email", label: "Email / referral" },
  { value: "website_widget", label: "Website form" },
];

// Same sentinel the public intake uses for the service question's "Something
// else" choice — stripped before submit and sent as free-text serviceRequested
// instead, so an off-list job entered by hand scores like one taken on the form.
const OTHER_SERVICE = "__other__";

export default function NewLeadForm({ questions }: { questions: VerticalQuestion[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [form, setForm] = useState({
    callerName: "",
    callerPhone: "",
    callerEmail: "",
    zip: "",
    source: "manual",
    notes: "",
  });
  // Keyed by question so this stays in step with whatever the vertical defines,
  // rather than hardcoding "service" and "urgency" here.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [serviceOther, setServiceOther] = useState("");

  const primaryKey = questions[0]?.key;

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

    // Off-list service: send what they described as free-text serviceRequested
    // and drop the sentinel so it never lands in answers as a bogus value.
    const outAnswers = { ...answers };
    let serviceRequested: string | undefined;
    if (primaryKey && outAnswers[primaryKey] === OTHER_SERVICE) {
      serviceRequested = serviceOther.trim() || undefined;
      delete outAnswers[primaryKey];
    }
    if (form.zip.trim()) outAnswers.zip_code = form.zip.trim();

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
          serviceRequested,
          intakeAnswers: outAnswers,
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

            <FormGroup label="ZIP code (optional)">
              <Field value={form.zip} onChange={(e) => update("zip", e.target.value)} placeholder="07030" />
            </FormGroup>

            {questions.map((q) => (
              <FormGroup key={q.key} label={q.label}>
                <Select
                  value={answers[q.key] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                >
                  <option value="">Not provided</option>
                  {q.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                  {/* Only the service question takes an off-list answer, same as
                      the public intake. */}
                  {q.key === primaryKey && <option value={OTHER_SERVICE}>Something else</option>}
                </Select>
                {q.key === primaryKey && answers[q.key] === OTHER_SERVICE && (
                  <div className="mt-2">
                    <Field
                      value={serviceOther}
                      onChange={(e) => setServiceOther(e.target.value)}
                      placeholder="What did they ask for?"
                    />
                  </div>
                )}
              </FormGroup>
            ))}

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
