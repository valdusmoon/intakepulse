"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import QRCode from "qrcode";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  serviceArea: string;
  defaultSqftRate: string;
  paintTier: string;
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current ? "w-6 bg-orange-500 hover:bg-orange-600" : i === current ? "w-6 bg-orange-500 hover:bg-orange-600" : "w-4 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Step 1: Business Info ────────────────────────────────────────────────────

function StepBusinessInfo({
  data,
  onChange,
  onNext,
}: {
  data: FormData;
  onChange: (f: Partial<FormData>) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const canProceed = data.businessName.trim() && data.ownerName.trim() && data.ownerEmail.trim() && data.ownerPhone.trim();

  function handleContinue() {
    const emailResult = validateAndNormalizeEmail(data.ownerEmail);
    const phoneResult = validateAndNormalizePhone(data.ownerPhone);
    const newErrors: { email?: string; phone?: string } = {};
    if (!emailResult.isValid) newErrors.email = emailResult.error ?? "Invalid email address";
    if (!phoneResult.isValid) newErrors.phone = phoneResult.error ?? "Invalid phone number";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) onNext();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your account</h1>
        <p className="text-gray-500 mt-1 text-sm">Takes about 2 minutes.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            placeholder="e.g. Austin Pro Painters"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
          <input
            type="text"
            value={data.ownerName}
            onChange={(e) => onChange({ ownerName: e.target.value })}
            placeholder="e.g. Mike Johnson"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
          <input
            type="email"
            value={data.ownerEmail}
            onChange={(e) => { onChange({ ownerEmail: e.target.value }); setErrors((p) => ({ ...p, email: undefined })); }}
            placeholder="you@example.com"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.email ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
          <input
            type="tel"
            value={data.ownerPhone}
            onChange={(e) => { onChange({ ownerPhone: e.target.value }); setErrors((p) => ({ ...p, phone: undefined })); }}
            placeholder="(512) 555-0100"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.phone ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.phone
            ? <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            : <p className="text-xs text-gray-400 mt-1.5">Used for SMS notifications — must be a mobile number, not a landline.</p>
          }
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service area <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={data.serviceArea}
            onChange={(e) => onChange({ serviceArea: e.target.value })}
            placeholder="e.g. Greater Austin area"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!canProceed}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </div>
  );
}

// ─── Step 2: Rates ────────────────────────────────────────────────────────────

function StepRates({
  data,
  onChange,
  onNext,
  onBack,
  loading,
}: {
  data: FormData;
  onChange: (f: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your default rate</h1>
        <p className="text-gray-500 mt-1 text-sm">Used as a baseline for AI estimates. You can change this anytime.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Labor rate per sq ft <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            step="0.25"
            min="0"
            value={data.defaultSqftRate}
            onChange={(e) => onChange({ defaultSqftRate: e.target.value })}
            placeholder="1.75"
            className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-gray-400">Industry average $1.50–$3.50. Skip if unsure.</p>
          {!data.defaultSqftRate && (
            <button
              type="button"
              onClick={() => onChange({ defaultSqftRate: "1.75" })}
              className="text-xs text-orange-500 hover:underline font-medium"
            >
              Use $1.75 default
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Paint quality you typically use</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "budget",   label: "Budget",   sub: "$20–$35/gal" },
            { value: "standard", label: "Standard", sub: "$25–$55/gal" },
            { value: "premium",  label: "Premium",  sub: "$55–$85/gal" },
          ].map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => onChange({ paintTier: tier.value })}
              className={`border-[1.5px] rounded-xl px-3 py-3 text-left transition-all ${
                data.paintTier === tier.value
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className={`text-sm font-semibold ${data.paintTier === tier.value ? "text-orange-500" : "text-gray-800"}`}>{tier.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{tier.sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 border border-gray-300 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {loading ? "Setting up..." : "Finish setup →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Ready ────────────────────────────────────────────────────────────

function StepReady({ companyId }: { companyId: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activating, setActivating] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const quoteUrl = `${appUrl}/quote/${companyId}`;
  const embedCode = `<div class="craftcapture-inline-widget" data-company="${companyId}" style="min-width:320px;height:700px;"></div>\n<script src="${appUrl}/widget.js" async></script>`;

  useEffect(() => {
    QRCode.toDataURL(quoteUrl, { width: 200, margin: 2 }).then(setQrDataUrl);
  }, [quoteUrl]);

  function copyLink() {
    navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyEmbed() {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "quote-qr-code.png";
    a.click();
  }

  async function handleActivate() {
    setActivating(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start trial");
      window.location.href = data.url;
    } catch {
      setActivating(false);
    }
  }

  return (
    <div className="space-y-5 text-center">
      <div>
        <div className="text-4xl mb-3">✅</div>
        <h1 className="text-2xl font-bold text-gray-900">Account created!</h1>
        <p className="text-gray-500 mt-1 text-sm">One last step — start your free trial to make your quote link live.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left">
        <p className="text-xs font-semibold text-amber-800 mb-0.5">Your link isn&apos;t live yet</p>
        <p className="text-xs text-amber-700">Start your free trial below to activate it. Don&apos;t share it until then — homeowners will see &ldquo;temporarily unavailable.&rdquo;</p>
      </div>

      {qrDataUrl && (
        <div className="flex justify-center">
          <img src={qrDataUrl} alt="QR code" className="w-36 h-36 rounded-xl opacity-50" />
        </div>
      )}

      {/* Share options */}
      <div className="grid grid-cols-2 gap-3 text-left">
        {/* Quote link */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-700">🔗 Quote link</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Share via text, email, or social media.</p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={copyLink}
              className="flex-1 text-[11px] font-semibold border border-gray-300 rounded-lg py-1.5 text-gray-700 hover:bg-white transition-colors"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={downloadQr}
              disabled={!qrDataUrl}
              className="flex-1 text-[11px] font-semibold border border-gray-300 rounded-lg py-1.5 text-gray-700 hover:bg-white transition-colors disabled:opacity-40"
            >
              Save QR
            </button>
          </div>
        </div>

        {/* Website embed */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-700">&lt;/&gt; Website embed</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Add the form directly to your website.</p>
          </div>
          <button
            onClick={copyEmbed}
            className="w-full text-[11px] font-semibold border border-gray-300 rounded-lg py-1.5 text-gray-700 hover:bg-white transition-colors"
          >
            {copiedEmbed ? "Copied!" : "Copy embed code"}
          </button>
          <p className="text-[10px] text-gray-400">More options in Settings →</p>
        </div>
      </div>

      {/* GBP tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-left">
        <p className="text-xs font-semibold text-blue-800 mb-0.5">📍 Quickest way to get your first lead</p>
        <p className="text-xs text-blue-700">
          Add your quote link to your{" "}
          <a
            href="https://business.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            Google Business Profile
          </a>
          . Homeowners searching for painters near you will land directly on your quote form.
        </p>
      </div>

      <button
        onClick={handleActivate}
        disabled={activating}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
      >
        {activating ? "Opening checkout..." : "Start free 14-day trial →"}
      </button>
      <p className="text-xs text-center text-gray-400">No charge for 14 days. Cancel anytime before trial ends.</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    serviceArea: "",
    defaultSqftRate: "",
    paintTier: "standard",
  });

  // Pre-fill from Clerk user if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        ownerName: prev.ownerName || user.fullName || "",
        ownerEmail: prev.ownerEmail || user.primaryEmailAddress?.emailAddress || "",
        ownerPhone: prev.ownerPhone || user.primaryPhoneNumber?.phoneNumber || "",
      }));
    }
  }, [user]);

  function updateForm(fields: Partial<FormData>) {
    setFormData((prev) => ({ ...prev, ...fields }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const phoneResult = validateAndNormalizePhone(formData.ownerPhone);
    if (!phoneResult.isValid) { setError(phoneResult.error ?? "Invalid phone number"); setLoading(false); return; }

    const emailResult = validateAndNormalizeEmail(formData.ownerEmail);
    if (!emailResult.isValid) { setError(emailResult.error ?? "Invalid email address"); setLoading(false); return; }

    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          ownerEmail: emailResult.normalized,
          ownerPhone: phoneResult.normalized,
          serviceArea: formData.serviceArea || null,
          defaultSqftRate: formData.defaultSqftRate ? parseFloat(formData.defaultSqftRate) : null,
          paintTier: formData.paintTier,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create company");
      }

      const company = await res.json();
      setCompanyId(company.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {step < 2 && <StepDots current={step} total={2} />}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {step === 0 && (
          <StepBusinessInfo
            data={formData}
            onChange={updateForm}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <StepRates
            data={formData}
            onChange={updateForm}
            onNext={handleSubmit}
            onBack={() => setStep(0)}
            loading={loading}
          />
        )}

        {step === 2 && companyId && (
          <StepReady
            companyId={companyId}
          />
        )}
      </div>
    </div>
  );
}
