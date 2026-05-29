"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, Lock, Trash2, Pencil, X } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface NotificationPreferences {
  newLead: boolean;
  newContact: boolean;
  quoteResponded: boolean;
  contractSigned: boolean;
  nudgeReminders: boolean;
  // SMS (all false by default — hidden until SMS_FEATURE_ENABLED)
  smsNewLead: boolean;
  smsQuoteResponded: boolean;
  smsContractSigned: boolean;
  smsSchedule: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface StaffEdit {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const DEFAULT_PREFS: NotificationPreferences = {
  newLead: true,
  newContact: true,
  quoteResponded: true,
  contractSigned: true,
  nudgeReminders: true,
  smsNewLead: false,
  smsQuoteResponded: false,
  smsContractSigned: false,
  smsSchedule: false,
};

const SMS_FEATURE_ENABLED = process.env.NEXT_PUBLIC_SMS_FEATURE_ENABLED === "true";

interface Company {
  id: string;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessPhone: string | null;
  businessEmail: string | null;
  serviceArea: string | null;
  websiteUrl: string | null;
  googleReviewUrl: string | null;
  defaultSqftRate: string | null;
  paintTier: string | null;
  notificationPreferences: NotificationPreferences | null;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  canceledAt: string | null;
}

export default function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<Partial<Company>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"business" | "notifications" | "share" | "staff">("business");
  const [copied, setCopied] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [widgetType, setWidgetType] = useState<"inline" | "badge" | "link">("badge");
  const [badgeText, setBadgeText] = useState("Get a Free Quote");
  const [shareActiveTab, setShareActiveTab] = useState<"link" | "qr" | "embed">("link");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffEdit | null>(null);
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then(async (data) => {
        setCompany(data);
        const url = `${APP_URL}/quote/${data.id}`;
        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 256,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        setQrDataUrl(dataUrl);
        setForm({
          businessName: data.businessName,
          ownerName: data.ownerName,
          ownerPhone: data.ownerPhone,
          businessPhone: data.businessPhone ?? "",
          businessEmail: data.businessEmail ?? "",
          serviceArea: data.serviceArea ?? "",
          websiteUrl: data.websiteUrl ?? "",
          googleReviewUrl: data.googleReviewUrl ?? "",
          defaultSqftRate: data.defaultSqftRate ?? "",
          paintTier: data.paintTier ?? "standard",
        });
        setPrefs({ ...DEFAULT_PREFS, ...(data.notificationPreferences ?? {}) });
      });

    fetch("/api/staff")
      .then((r) => r.ok ? r.json() : [])
      .then(setStaffList)
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    if (form.ownerPhone) {
      const phoneResult = validateAndNormalizePhone(form.ownerPhone);
      if (!phoneResult.isValid) { setSaveError(phoneResult.error ?? "Invalid phone number"); setSaving(false); return; }
      form.ownerPhone = phoneResult.normalized!;
    }

    if (form.businessPhone?.trim()) {
      const phoneResult = validateAndNormalizePhone(form.businessPhone);
      if (!phoneResult.isValid) { setSaveError(phoneResult.error ?? "Invalid business phone number"); setSaving(false); return; }
      form.businessPhone = phoneResult.normalized!;
    }

    if (form.businessEmail?.trim()) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail.trim());
      if (!emailOk) { setSaveError("Invalid business email address"); setSaving(false); return; }
    }

    const res = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: form.businessName?.trim(),
        ownerName: form.ownerName?.trim(),
        ownerPhone: form.ownerPhone?.trim(),
        businessPhone: form.businessPhone?.trim() || null,
        businessEmail: form.businessEmail?.trim() || null,
        serviceArea: form.serviceArea?.trim() || null,
        websiteUrl: form.websiteUrl?.trim() || null,
        googleReviewUrl: form.googleReviewUrl?.trim() || null,
        defaultSqftRate: form.defaultSqftRate?.trim() || null,
        paintTier: form.paintTier || "standard",
      }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  async function handleDownload(format: "png" | "pdf") {
    const res = await fetch(`/api/qr?format=${format}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-form-qr.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async function handleSavePrefs(key: keyof NotificationPreferences, value: boolean) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSavingPrefs(true);
    setSavedPrefs(false);
    await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationPreferences: updated }),
    });
    setSavingPrefs(false);
    setSavedPrefs(true);
    setTimeout(() => setSavedPrefs(false), 2000);
  }

  async function handleAddStaff() {
    if (!newStaffName.trim()) return;
    setAddingStaff(true);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newStaffName.trim(),
        email: newStaffEmail.trim() || null,
        phone: newStaffPhone.trim() || null,
      }),
    });
    if (res.ok) {
      const member = await res.json();
      setStaffList((prev) => [...prev, member]);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPhone("");
    }
    setAddingStaff(false);
  }

  async function handleRemoveStaff(id: string) {
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    setStaffList((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSaveStaffEdit() {
    if (!editingStaff) return;
    setSavingStaff(true);
    const res = await fetch(`/api/staff/${editingStaff.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingStaff.name.trim(),
        email: editingStaff.email.trim() || null,
        phone: editingStaff.phone.trim() || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setStaffList((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      setEditingStaff(null);
    }
    setSavingStaff(false);
  }

  function handleCopyLink() {
    if (!company) return;
    navigator.clipboard.writeText(`${APP_URL}/quote/${company.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopySnippet(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "2px solid #e5e7eb", borderTopColor: "#111827" }} />
      </div>
    );
  }

  const shareUrl = `${APP_URL}/quote/${company.id}`;

  const now = new Date();
  const GRACE_MS = 60 * 1000;
  const isActive = (() => {
    const { subscriptionStatus, trialEndsAt, canceledAt } = company;
    if (!subscriptionStatus) return false;
    if (subscriptionStatus === "active") return !(canceledAt && new Date(canceledAt) < now);
    if (subscriptionStatus === "trialing") return !!trialEndsAt && new Date(trialEndsAt).getTime() + GRACE_MS > now.getTime();
    if (subscriptionStatus === "canceled") return !!(canceledAt && new Date(canceledAt) > now);
    return false;
  })();

  const SETTINGS_TABS = [
    { key: "business"       as const, label: "Business" },
    { key: "notifications"  as const, label: "Notifications" },
    { key: "share"          as const, label: "Share & Widget" },
    { key: "staff"          as const, label: "Staff" },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="flex border-b border-gray-200 mt-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSettingsTab(tab.key)}
              className={`shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeSettingsTab === tab.key
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Share your form — Link / QR / Embed */}
      {activeSettingsTab === "share" && <>
      {company && (() => {
        const shareTab = (shareActiveTab as string) ?? "link";
        const widgetUrl = `${APP_URL}/widget.js`;
        const EMBED_TYPES = [
          { key: "inline" as const, label: "Inline embed",  sublabel: "Embeds the form directly on your page" },
          { key: "badge"  as const, label: "Popup widget",  sublabel: "Floating button that opens a popup" },
          { key: "link"   as const, label: "Popup text",    sublabel: "Trigger popup from any link or button" },
        ];
        const snippets: Record<string, string> = {
          inline: `<!-- CraftCapture inline widget begin -->\n<div class="craftcapture-inline-widget" data-company="${company.id}" style="min-width:320px;height:700px;"></div>\n<script src="${widgetUrl}" async></script>\n<!-- CraftCapture inline widget end -->`,
          badge:  `<!-- CraftCapture popup widget begin -->\n<script src="${widgetUrl}" async></script>\n<script>window.addEventListener('load',function(){CraftCapture.initBadgeWidget({companyId:'${company.id}',text:'${badgeText}'});});</script>\n<!-- CraftCapture popup widget end -->`,
          link:   `<!-- CraftCapture popup text begin -->\n<script src="${widgetUrl}" async></script>\n<a href="#" onclick="CraftCapture.openWidget('${company.id}');return false;">${badgeText}</a>\n<!-- CraftCapture popup text end -->`,
        };
        const embedCode = snippets[widgetType];
        const TABS = ["link", "qr", "embed"] as const;
        const TAB_LABELS: Record<string, string> = { link: "Link", qr: "QR Code", embed: "Embed" };
        return (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header + tabs */}
            <div className="px-5 pt-5 pb-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Share your form</p>
                  <p className="text-xs text-gray-400 mt-0.5">Share with homeowners or add to your website.</p>
                </div>
                {!isActive && <Lock className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
              </div>
              <div className="flex border-b border-gray-100">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setShareActiveTab(tab)}
                    className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${shareActiveTab === tab ? "border-orange-500 text-orange-500" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab: Link */}
            {shareActiveTab === "link" && (
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <input readOnly value={shareUrl} className={`flex-1 border rounded-lg px-3 py-2 text-xs focus:outline-none ${!isActive ? "border-gray-100 text-gray-300 bg-gray-50" : "border-gray-200 text-gray-600 bg-gray-50"}`} />
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={handleCopyLink} className="flex items-center justify-center w-9 h-9 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {!isActive && <p className="text-xs text-orange-500 font-medium">Inactive — <Link href="/dashboard/billing" className="underline hover:text-orange-600">start your free trial</Link> to go live.</p>}
              </div>
            )}

            {/* Tab: QR */}
            {shareActiveTab === "qr" && (
              <div className="p-5 flex flex-wrap items-start gap-4 sm:gap-6">
                <div className={`bg-white border rounded-xl p-3 flex-shrink-0 ${!isActive ? "border-gray-100" : "border-gray-200"}`}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Lead form QR code" className={`w-36 h-36 ${!isActive ? "opacity-25" : ""}`} />
                  ) : (
                    <div className="w-36 h-36 bg-gray-100 rounded-lg animate-pulse" />
                  )}
                </div>
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-gray-500">Homeowners scan this to reach your quote form directly.</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload("png")} className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">Download PNG</button>
                    <button onClick={() => handleDownload("pdf")} className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">Print PDF</button>
                  </div>
                  {!isActive && <p className="text-xs text-orange-500 font-medium">Inactive — <Link href="/dashboard/billing" className="underline hover:text-orange-600">start your free trial</Link> to go live.</p>}
                </div>
              </div>
            )}

            {/* Tab: Embed */}
            {shareActiveTab === "embed" && (
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <div className="sm:w-1/2 p-4 space-y-4">
                  <div className="space-y-1">
                    {EMBED_TYPES.map((t) => (
                      <button key={t.key} onClick={() => setWidgetType(t.key)} className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors border ${widgetType === t.key ? "bg-orange-50 border-orange-200" : "hover:bg-gray-50 border-transparent"}`}>
                        <p className={`text-xs font-semibold ${widgetType === t.key ? "text-orange-600" : "text-gray-700"}`}>{t.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{t.sublabel}</p>
                      </button>
                    ))}
                  </div>
                  {(widgetType === "badge" || widgetType === "link") && (
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <label className="text-xs font-medium text-gray-500">Button text</label>
                      <input type="text" value={badgeText} onChange={(e) => setBadgeText(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-400" />
                    </div>
                  )}
                </div>
                <div className="sm:w-1/2 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Embed Code</p>
                    <button onClick={() => handleCopySnippet(widgetType, embedCode)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors text-gray-500 hover:text-gray-800">
                      {copiedSnippet === widgetType ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copiedSnippet === widgetType ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">Place this code in your HTML where you want the widget to appear.</p>
                  <pre className="text-[10px] text-gray-500 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed flex-1">{embedCode}</pre>
                </div>
              </div>
            )}
          </div>
        );
      })()}
      </>}

      {/* Notification preferences */}
      {activeSettingsTab === "notifications" && <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            <p className="text-xs text-gray-400 mt-0.5">Control which alerts you receive. Homeowner confirmations always send.</p>
          </div>
          <div className="flex items-center gap-2">
            {savingPrefs && <span className="text-xs text-gray-400">Saving...</span>}
            {savedPrefs && <span className="text-xs text-green-600">Saved</span>}
          </div>
        </div>

        {/* ── Section 1: Your notifications ── */}
        {(() => {
          const notifRows: Array<{ emailKey: keyof NotificationPreferences | null; smsKey: keyof NotificationPreferences | null; label: string; description: string }> = [
            { emailKey: "newLead",        smsKey: "smsNewLead",        label: "New lead submitted",         description: "When a homeowner completes and submits their project details" },
            { emailKey: "quoteResponded", smsKey: "smsQuoteResponded", label: "Quote accepted or declined", description: "When a homeowner responds to a quote you sent" },
            { emailKey: "contractSigned", smsKey: "smsContractSigned", label: "Contract signed",            description: "When a homeowner signs a contract" },
            { emailKey: "nudgeReminders", smsKey: null,                label: "Follow-up reminders",        description: "Daily nudges for quotes unviewed 48h+ or contracts unsigned 72h+" },
            { emailKey: null,             smsKey: "smsSchedule",       label: "Job scheduled",              description: "When you set a schedule date for a job" },
          ];

          return (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your notifications</p>
              {/* Column headers */}
              <div className="flex items-center justify-end gap-6 pr-1 mb-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-9 text-center">Email</span>
                {SMS_FEATURE_ENABLED && <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-9 text-center">SMS</span>}
              </div>
              {notifRows
                .filter(({ emailKey, smsKey }) => emailKey !== null || (SMS_FEATURE_ENABLED && smsKey !== null))
                .map(({ emailKey, smsKey, label, description }) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-3 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="w-9 flex justify-center">
                        {emailKey ? (
                          <button
                            role="switch"
                            aria-checked={prefs[emailKey] as boolean}
                            onClick={() => handleSavePrefs(emailKey, !(prefs[emailKey] as boolean))}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${prefs[emailKey] ? "bg-gray-900" : "bg-gray-200"}`}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${prefs[emailKey] ? "translate-x-4" : "translate-x-0"}`} />
                          </button>
                        ) : <span className="w-9" />}
                      </div>
                      {SMS_FEATURE_ENABLED && (
                        <div className="w-9 flex justify-center">
                          {smsKey ? (
                            <button
                              role="switch"
                              aria-checked={prefs[smsKey] as boolean}
                              onClick={() => handleSavePrefs(smsKey, !(prefs[smsKey] as boolean))}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${prefs[smsKey] ? "bg-orange-500" : "bg-gray-200"}`}
                            >
                              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${prefs[smsKey] ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                          ) : <span className="w-9" />}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          );
        })()}

        {/* ── Section 2: Staff notifications ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Staff notifications</p>
          <div className="flex items-start justify-between gap-4 py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-800">Job assigned</p>
              <p className="text-xs text-gray-400 mt-0.5">Notify staff members when a job is assigned to them</p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="w-9 flex justify-center">
                <span className="text-[10px] text-gray-300 italic">Soon</span>
              </div>
              {SMS_FEATURE_ENABLED && <span className="w-9" />}
            </div>
          </div>
        </div>

        {/* ── Section 3: Homeowner notifications ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Homeowner notifications</p>
          <p className="text-xs text-gray-400 mb-2">Email always sends. SMS coming soon.</p>
          {[
            { label: "Form submission confirmation", description: "Sent when a homeowner submits your lead form" },
            { label: "Schedule confirmation",        description: "Sent when you schedule a job and notify the homeowner" },
          ].map(({ label, description }) => (
            <div key={label} className="flex items-start justify-between gap-4 py-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              </div>
              <div className="shrink-0 flex items-center gap-6">
                <div className="w-9 flex justify-center">
                  <Check className="w-4 h-4 text-gray-400" />
                </div>
                {SMS_FEATURE_ENABLED && (
                  <div className="w-9 flex justify-center">
                    <span className="text-[10px] text-gray-300 italic">Soon</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* Staff / Crew */}
      {activeSettingsTab === "staff" && <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Staff / Crew</p>
          <p className="text-xs text-gray-400 mt-0.5">Add crew members to assign to scheduled jobs.</p>
        </div>

        {staffList.length > 0 && (
          <div className="space-y-0">
            {staffList.map((member) => (
              <div key={member.id} className="py-3 border-t border-gray-100">
                {editingStaff?.id === member.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingStaff.name}
                      onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                      placeholder="Name *"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={editingStaff.email}
                        onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                        placeholder="Email"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      <input
                        type="tel"
                        value={editingStaff.phone}
                        onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                        placeholder="Phone"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveStaffEdit}
                        disabled={savingStaff || !editingStaff.name.trim()}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:opacity-80 disabled:opacity-40"
                      >
                        {savingStaff ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingStaff(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{member.name}</p>
                      {(member.phone || member.email) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[member.phone, member.email].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingStaff({ id: member.id, name: member.name, email: member.email ?? "", phone: member.phone ?? "" })}
                        className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveStaff(member.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 pt-1 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 pt-1">Add crew member</p>
          <input
            type="text"
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            placeholder="Name *"
            onKeyDown={(e) => e.key === "Enter" && handleAddStaff()}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              type="tel"
              value={newStaffPhone}
              onChange={(e) => setNewStaffPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button
            onClick={handleAddStaff}
            disabled={addingStaff || !newStaffName.trim()}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {addingStaff ? "Adding..." : "Add crew member"}
          </button>
        </div>
      </div>}

      {/* Business info form */}
      {activeSettingsTab === "business" && <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <p className="text-sm font-semibold text-gray-900">Business info</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
            <input
              type="text"
              value={form.businessName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner name</label>
            <input
              type="text"
              value={form.ownerName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner phone</label>
            <input
              type="tel"
              value={form.ownerPhone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ownerPhone: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-1">
            <p className="text-sm font-semibold text-gray-900">Customer-facing contact</p>
            <p className="text-xs text-gray-400">Shown on quotes and PDFs sent to homeowners. Leave blank to omit.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.businessPhone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, businessPhone: e.target.value }))}
                placeholder="e.g. (512) 555-0100"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={form.businessEmail ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, businessEmail: e.target.value }))}
                placeholder="e.g. hello@yourco.com"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service area <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.serviceArea ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, serviceArea: e.target.value }))}
              placeholder="e.g. Greater Austin area"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={form.websiteUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
              placeholder="https://yourbusiness.com"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Google Review URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={form.googleReviewUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, googleReviewUrl: e.target.value }))}
              placeholder="https://g.page/r/..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">Used to automatically send homeowners a review request when a job is marked Completed.</p>
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Estimate pricing</p>
            <p className="text-xs text-gray-400 mt-0.5">Used to calculate ballpark estimates on your quote form.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Labor rate <span className="text-gray-400 font-normal">($/sqft, good condition)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.25"
                  min="0.5"
                  max="10"
                  value={form.defaultSqftRate ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, defaultSqftRate: e.target.value }))}
                  placeholder="1.75"
                  className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave blank to use national average ($1.75)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paint quality</label>
              <select
                value={form.paintTier ?? "standard"}
                onChange={(e) => setForm((f) => ({ ...f, paintTier: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="budget">Budget ($20–$35/gal)</option>
                <option value="standard">Standard ($25–$55/gal)</option>
                <option value="premium">Premium ($55–$85/gal)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saved && <p className="text-sm text-green-600">Saved!</p>}
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-semibold text-gray-900 mb-1">Export your data</p>
          <p className="text-xs text-gray-400 mb-3">Download all your leads, quotes, contracts, and photos as a CSV.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/leads/export"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Download CSV
          </a>
        </div>
      </form>}
    </div>
  );
}
