"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Phone, Building2, Droplets } from "lucide-react";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";

interface FormData {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  serviceArea: string;
  vertical: string;
  forwardingNumber: string;
  callTimeoutSeconds: number;
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-10">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`rounded-full transition-all duration-300 ${
            s === current
              ? "w-8 h-2 bg-orange-500"
              : s < current
              ? "w-2 h-2 bg-orange-300"
              : "w-2 h-2 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{children}</label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    />
  );
}

// ─── Step 1: Business Info ────────────────────────────────────────────────────

function Step1({
  form,
  update,
  onNext,
}: {
  form: FormData;
  update: (k: keyof FormData, v: string | number) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState("");

  function validate() {
    if (!form.businessName.trim()) return "Business name is required.";
    if (!form.ownerName.trim()) return "Your name is required.";
    return "";
  }

  function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    onNext();
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Step 1 of 3</p>
        <h1 className="text-2xl font-bold text-gray-900">Tell us about your business</h1>
        <p className="text-sm text-gray-500 mt-1">This appears on lead notifications and SMS messages.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Business name</Label>
          <Input
            value={form.businessName}
            onChange={(v) => update("businessName", v)}
            placeholder="Metro Restoration Co."
          />
        </div>
        <div>
          <Label>Your name</Label>
          <Input
            value={form.ownerName}
            onChange={(v) => update("ownerName", v)}
            placeholder="Mike Johnson"
          />
        </div>
        <div>
          <Label>Service area <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input
            value={form.serviceArea}
            onChange={(v) => update("serviceArea", v)}
            placeholder="Greater Chicago Area"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={handleNext}
        className="mt-8 w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Step 2: Vertical ─────────────────────────────────────────────────────────

const VERTICALS = [
  {
    key: "restoration",
    icon: Droplets,
    label: "Water / Fire / Mold Restoration",
    description: "Emergency remediation, drying, structural restoration.",
    available: true,
  },
  {
    key: "pi_law",
    icon: Building2,
    label: "Personal Injury Law",
    description: "Auto accidents, slip and fall, workers' comp.",
    available: false,
  },
  {
    key: "hvac",
    icon: Phone,
    label: "HVAC Services",
    description: "Emergency repairs, installs, maintenance calls.",
    available: false,
  },
];

function Step2({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Step 2 of 3</p>
        <h1 className="text-2xl font-bold text-gray-900">What type of business?</h1>
        <p className="text-sm text-gray-500 mt-1">Your vertical determines the intake questions and scoring model.</p>
      </div>

      <div className="space-y-3">
        {VERTICALS.map(({ key, icon: Icon, label, description, available }) => (
          <div
            key={key}
            className={`relative rounded-xl border-2 p-4 transition-colors ${
              available
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 bg-white opacity-60"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${available ? "bg-orange-100" : "bg-gray-100"}`}>
                <Icon className={`w-5 h-5 ${available ? "text-orange-600" : "text-gray-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  {available && (
                    <span className="text-xs font-medium bg-orange-500 text-white px-2 py-0.5 rounded-full">Selected</span>
                  )}
                  {!available && (
                    <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Coming soon</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
              {available && (
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">More verticals coming soon. Each uses the same infrastructure — just different intake questions and scoring logic.</p>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Phone Config ──────────────────────────────────────────────────────

function Step3({
  form,
  update,
  onBack,
  onSubmit,
  loading,
  error,
}: {
  form: FormData;
  update: (k: keyof FormData, v: string | number) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}) {
  const [phoneError, setPhoneError] = useState("");

  function handleSubmit() {
    if (form.forwardingNumber) {
      const ph = validateAndNormalizePhone(form.forwardingNumber);
      if (!ph.isValid) { setPhoneError(ph.error ?? "Invalid phone number."); return; }
    }
    setPhoneError("");
    onSubmit();
  }

  const timeoutLabel =
    form.callTimeoutSeconds <= 15
      ? "Quick (15s) — aggressive missed-call recovery"
      : form.callTimeoutSeconds <= 25
      ? "Standard (20s) — recommended"
      : "Patient (45s) — more rings before recovery";

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Step 3 of 3</p>
        <h1 className="text-2xl font-bold text-gray-900">Phone setup</h1>
        <p className="text-sm text-gray-500 mt-1">Configure how calls flow through IntakePulse.</p>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Forwarding number</Label>
          <Input
            value={form.forwardingNumber}
            onChange={(v) => { setPhoneError(""); update("forwardingNumber", v); }}
            placeholder="+1 (555) 000-0000"
            type="tel"
          />
          <p className="text-xs text-gray-400 mt-1">
            Your IntakePulse number forwards calls here. If unanswered, the missed-call recovery fires.
          </p>
          {phoneError && <p className="text-sm text-red-600 mt-1">{phoneError}</p>}
        </div>

        <div>
          <Label>Missed-call timeout</Label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={10}
              max={45}
              step={5}
              value={form.callTimeoutSeconds}
              onChange={(e) => update("callTimeoutSeconds", parseInt(e.target.value))}
              className="flex-1 accent-orange-500"
            />
            <span className="text-sm font-semibold text-gray-900 w-10 text-right">{form.callTimeoutSeconds}s</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{timeoutLabel}</p>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">Your IntakePulse number</p>
          <p className="text-xs text-blue-600">
            After setup, email <span className="font-semibold">setup@intakepulse.com</span> and we'll provision your dedicated number within 1 business day. Paste it in Settings once you receive it.
          </p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          {loading ? "Saving…" : (<>Finish setup <ArrowRight className="w-4 h-4" /></>)}
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Done ─────────────────────────────────────────────────────────────

function Step4({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h1>
      <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
        Your account is configured. Once IntakePulse provisions your dedicated number, you'll start recovering missed calls automatically.
      </p>

      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-left mb-8">
        <p className="text-sm font-semibold text-gray-800 mb-3">Next steps</p>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="font-semibold text-orange-500 shrink-0">1.</span>
            Email <span className="font-semibold">setup@intakepulse.com</span> to request your number.
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-500 shrink-0">2.</span>
            Paste your assigned number into <span className="font-semibold">Settings → Phone Setup</span>.
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-500 shrink-0">3.</span>
            Forward your business line to your IntakePulse number.
          </li>
        </ol>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors"
      >
        Go to dashboard <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    businessName: "",
    ownerName: "",
    ownerEmail: "",
    serviceArea: "",
    vertical: "restoration",
    forwardingNumber: "",
    callTimeoutSeconds: 20,
  });

  function update(field: keyof FormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail || undefined,
          serviceArea: form.serviceArea || undefined,
          vertical: form.vertical,
          forwardingNumber: form.forwardingNumber || undefined,
          callTimeoutSeconds: form.callTimeoutSeconds,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save. Please try again.");
      }
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4 pb-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2">
            <img src="/icon-mark.svg" alt="IntakePulse" className="w-8 h-8" />
            <span className="text-lg font-bold text-gray-900">IntakePulse</span>
          </div>
        </div>

        {step < 4 && <StepDots current={step} total={3} />}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
          {step === 1 && <Step1 form={form} update={update} onNext={() => setStep(2)} />}
          {step === 2 && <Step2 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && (
            <Step3
              form={form}
              update={update}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
            />
          )}
          {step === 4 && <Step4 router={router} />}
        </div>
      </div>
    </div>
  );
}
