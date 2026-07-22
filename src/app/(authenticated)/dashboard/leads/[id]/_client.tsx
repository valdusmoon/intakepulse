"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardBody, FormGroup, Field, Select, TextArea, Button } from "@/components/dashboard/v2/primitives";

// Intake progress (not_started/started/completed/abandoned) is system-derived
// and shown as a read-only indicator elsewhere on this page — only sales
// progress is something the business manually sets.
const STATUSES = [
  { value: "new", label: "New — awaiting callback" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "booked", label: "Appointment booked" },
  { value: "estimate_sent", label: "Estimate sent" },
  { value: "converted", label: "Won" },
  { value: "lost", label: "Lost" },
];

interface Props {
  lead: {
    id: string;
    leadStatus: string;
    leadType: string;
    notes: string | null;
    callerPhone: string;
    confirmedValue: number | null;
  };
  hasPendingFollowup: boolean;
}

export function LeadDetailClient({ lead, hasPendingFollowup }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.leadStatus);
  const [confirmedValue, setConfirmedValue] = useState(lead.confirmedValue != null ? String(lead.confirmedValue / 100) : "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [cancelingFollowup, setCancelingFollowup] = useState(false);
  const [followupCanceled, setFollowupCanceled] = useState(false);
  const [reclassifying, setReclassifying] = useState(false);

  const isMessage = lead.leadType === "message";

  async function saveOutcome() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const dollars = parseFloat(confirmedValue);
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadStatus: status,
          notes,
          confirmedValue: !isNaN(dollars) ? Math.round(dollars * 100) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to save — please try again.");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelFollowup() {
    setCancelingFollowup(true);
    try {
      await fetch(`/api/leads/${lead.id}/followup`, { method: "DELETE" });
      setFollowupCanceled(true);
    } finally {
      setCancelingFollowup(false);
    }
  }

  // Flip the lead's TYPE (docs/callverted-standard.md §7). Promotion leaves the
  // job unscored (nothing to score on); demotion keeps it out of job metrics.
  async function reclassify() {
    const confirmMsg = isMessage
      ? "Convert this message into a job? It joins your pipeline unscored, and you manage it from there."
      : "File this job as a message? It leaves the ranked queue and your job metrics.";
    if (!window.confirm(confirmMsg)) return;
    setReclassifying(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadType: isMessage ? "job" : "message" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to reclassify. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to reclassify. Check your connection and try again.");
    } finally {
      setReclassifying(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="!text-base">Update outcome</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <FormGroup label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Confirmed job value" help="Actual reported value — separate from the AI's estimated range.">
            <Field
              inputMode="decimal"
              placeholder="$0.00"
              value={confirmedValue}
              onChange={(e) => setConfirmedValue(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Internal note">
            <TextArea placeholder="Add a note for your team" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormGroup>
          {error && <p className="text-sm text-cv-red">{error}</p>}
          <Button variant="primary" onClick={saveOutcome} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save outcome"}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-cv-muted">
              {isMessage ? "Turned into a real job?" : "Not actually a job?"}
            </p>
            <p className="text-xs text-cv-muted mt-1">
              {isMessage
                ? "Convert it to track this work in your pipeline."
                : "File it as a message to keep your job metrics clean."}
            </p>
          </div>
          <Button size="sm" onClick={reclassify} disabled={reclassifying}>
            {reclassifying ? "Working…" : isMessage ? "Convert to job" : "File as message"}
          </Button>
        </CardBody>
      </Card>

      {hasPendingFollowup && !followupCanceled && (
        <Card className="!border-cv-amber/30 bg-cv-amber-soft">
          <CardBody className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-cv-amber">Follow-up pending</p>
              <p className="text-xs text-cv-muted mt-1">Cancel if you&apos;ve already spoken with this lead.</p>
            </div>
            <Button size="sm" variant="danger" onClick={cancelFollowup} disabled={cancelingFollowup}>
              {cancelingFollowup ? "Canceling…" : "Cancel"}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
