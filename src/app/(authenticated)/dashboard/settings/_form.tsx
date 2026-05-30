"use client";

import { useState } from "react";
import type { Business } from "@/lib/db/schema/businesses";

type Section = "profile" | "phone" | "sms";

interface FieldGroupProps {
  title: string;
  children: React.ReactNode;
}

function FieldGroup({ title, children }: FieldGroupProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1.5">{children}</label>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${readOnly ? "bg-gray-50 text-gray-500 cursor-default" : ""}`}
    />
  );
}

function SaveButton({ loading, saved, onClick }: { loading: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
    >
      {loading ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
    </button>
  );
}

function useSave(section: Section) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(data: Record<string, string | number | null>) {
    setLoading(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save.");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, saved, error, save };
}

export function SettingsForm({ business }: { business: Business }) {
  // ── Profile ──────────────────────────────────────────────────────────────
  const [businessName, setBusinessName] = useState(business.businessName);
  const [ownerName, setOwnerName] = useState(business.ownerName);
  const [serviceArea, setServiceArea] = useState(business.serviceArea ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(business.websiteUrl ?? "");
  const profile = useSave("profile");

  // ── Phone ─────────────────────────────────────────────────────────────────
  const [telnyxPhoneNumber, setTelnyxPhoneNumber] = useState(business.telnyxPhoneNumber ?? "");
  const [forwardingNumber, setForwardingNumber] = useState(business.forwardingNumber ?? "");
  const phone = useSave("phone");

  // ── SMS ───────────────────────────────────────────────────────────────────
  const defaultTemplate = `Hi! We missed your call at ${business.businessName}. To help us get back to you quickly, please fill out this brief form: {intake_url}`;
  const [smsTemplate, setSmsTemplate] = useState(business.missedCallSmsTemplate ?? defaultTemplate);
  const sms = useSave("sms");

  return (
    <div className="space-y-5">

      {/* Business Profile */}
      <FieldGroup title="Business Profile">
        <div className="space-y-4">
          <div>
            <Label>Business name</Label>
            <Input value={businessName} onChange={setBusinessName} placeholder="Metro Restoration Co." />
          </div>
          <div>
            <Label>Owner name</Label>
            <Input value={ownerName} onChange={setOwnerName} placeholder="Mike Johnson" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Service area</Label>
              <Input value={serviceArea} onChange={setServiceArea} placeholder="Greater Chicago Area" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://example.com" type="url" />
            </div>
          </div>
        </div>
        {profile.error && <p className="mt-2 text-sm text-red-600">{profile.error}</p>}
        <SaveButton
          loading={profile.loading}
          saved={profile.saved}
          onClick={() => profile.save({ businessName, ownerName, serviceArea: serviceArea || null, websiteUrl: websiteUrl || null })}
        />
      </FieldGroup>

      {/* Phone & Call Settings */}
      <FieldGroup title="Phone & Call Settings">
        <div className="space-y-4">
          <div>
            <Label>Your IntakePulse number</Label>
            <Input
              value={telnyxPhoneNumber}
              onChange={setTelnyxPhoneNumber}
              placeholder="+1 (555) 000-0000"
              type="tel"
            />
            <p className="text-xs text-gray-400 mt-1">
              Paste the number assigned by IntakePulse. Email <span className="font-medium">setup@intakepulse.com</span> to request one.
            </p>
          </div>
          <div>
            <Label>Forwarding number</Label>
            <Input
              value={forwardingNumber}
              onChange={setForwardingNumber}
              placeholder="+1 (555) 000-0000"
              type="tel"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your IntakePulse number forwards calls here. If unanswered, missed-call recovery fires.
            </p>
          </div>
        </div>
        {phone.error && <p className="mt-2 text-sm text-red-600">{phone.error}</p>}
        <SaveButton
          loading={phone.loading}
          saved={phone.saved}
          onClick={() => phone.save({
            telnyxPhoneNumber: telnyxPhoneNumber || null,
            forwardingNumber: forwardingNumber || null,
          })}
        />
      </FieldGroup>

      {/* SMS Template */}
      <FieldGroup title="Missed-Call SMS Template">
        <div>
          <Label>Message body</Label>
          <textarea
            value={smsTemplate}
            onChange={(e) => setSmsTemplate(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Use <code className="bg-gray-100 px-1 rounded">{"{"}{"{"}intake_url{"}"}{"}"}  </code> where the intake form link should appear. Keep under 160 characters to avoid multi-part SMS.
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Characters: <span className={smsTemplate.length > 160 ? "text-orange-500 font-semibold" : ""}>{smsTemplate.length}</span> / 160
          </p>
        </div>
        {sms.error && <p className="mt-2 text-sm text-red-600">{sms.error}</p>}
        <SaveButton
          loading={sms.loading}
          saved={sms.saved}
          onClick={() => sms.save({ missedCallSmsTemplate: smsTemplate })}
        />
      </FieldGroup>

      {/* Vertical — read-only */}
      <FieldGroup title="Vertical">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Water / Fire / Mold Restoration</p>
            <p className="text-xs text-gray-500 mt-0.5">More verticals coming soon — contact us to discuss your use case.</p>
          </div>
          <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">Active</span>
        </div>
      </FieldGroup>

    </div>
  );
}
