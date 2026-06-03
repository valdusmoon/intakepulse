"use client";

import { useState } from "react";
import type { Business } from "@/lib/db/schema/businesses";

const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://app.callverted.com";

type Section = "profile" | "phone";

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
            <Label>Your Callverted number</Label>
            <Input
              value={telnyxPhoneNumber}
              onChange={setTelnyxPhoneNumber}
              placeholder="+1 (555) 000-0000"
              type="tel"
            />
            <p className="text-xs text-gray-400 mt-1">
              Paste the number assigned by Callverted. Email <span className="font-medium">setup@callverted.com</span> to request one.
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
              Your Callverted number forwards calls here. If unanswered, missed-call recovery fires.
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

      {/* Embeddable Widget */}
      <FieldGroup title="Website Widget">
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Add a floating intake button to your website. Paste this script tag before{" "}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{"</body>"}</code>.
        </p>
        <WidgetEmbed businessId={business.id} />
      </FieldGroup>

    </div>
  );
}

const WIDGET_MODES = [
  { key: "popup", label: "Popup" },
  { key: "inline", label: "Inline embed" },
  { key: "button", label: "Button link" },
] as const;

type WidgetMode = (typeof WIDGET_MODES)[number]["key"];

function WidgetEmbed({ businessId }: { businessId: string }) {
  const [mode, setMode] = useState<WidgetMode>("popup");
  const [copied, setCopied] = useState(false);

  const intakeUrl = `${APP_URL}/intake/${businessId}`;

  const snippets: Record<WidgetMode, string> = {
    popup: `<script src="${APP_URL}/api/widget/${businessId}" defer></script>`,
    inline: `<div data-ip-embed></div>\n<script src="${APP_URL}/api/widget/${businessId}?mode=inline" defer></script>`,
    button: `<div data-ip-button></div>\n<script src="${APP_URL}/api/widget/${businessId}?mode=button" defer></script>`,
  };

  const descriptions: Record<WidgetMode, string> = {
    popup: "Adds a floating orange button to your site. Clicking it opens the intake form in a modal overlay.",
    inline: "Embeds the intake form directly on the page inside the div. Add the div wherever you want the form.",
    button: "Injects a styled button that opens the intake form in a new tab. Drop the div anywhere on your page.",
  };

  const snippet = snippets[mode];

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {WIDGET_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setCopied(false); }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === m.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Snippet box */}
      <div className="bg-gray-900 rounded-lg px-4 py-3 text-xs font-mono text-green-400 whitespace-pre-wrap break-all leading-relaxed">
        {snippet}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={copy}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <a
          href={intakeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-orange-500 font-medium hover:text-orange-600"
        >
          Preview form ↗
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-3 leading-relaxed">{descriptions[mode]}</p>
    </div>
  );
}
