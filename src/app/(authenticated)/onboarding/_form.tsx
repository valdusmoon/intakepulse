"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Wind, Building2, Droplets } from "lucide-react";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";
import { Field, Icon } from "@/components/dashboard/v2/primitives";

interface FormData {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  serviceArea: string;
  vertical: string;
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-10">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`rounded-full transition-all duration-300 ${
            s === current ? "w-8 h-2 bg-cv-primary" : s < current ? "w-2 h-2 bg-cv-primary/40" : "w-2 h-2 bg-cv-border-strong"
          }`}
        />
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[13px] font-bold text-[#475467] mb-1.5">{children}</label>;
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
    if (form.ownerEmail) {
      const emailResult = validateAndNormalizeEmail(form.ownerEmail);
      if (!emailResult.isValid) return emailResult.error ?? "Invalid email.";
    }
    if (form.ownerPhone) {
      const phoneResult = validateAndNormalizePhone(form.ownerPhone);
      if (!phoneResult.isValid) return phoneResult.error ?? "Invalid phone number.";
    }
    return "";
  }

  function handleNext() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    onNext();
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold text-cv-primary uppercase tracking-widest mb-1">Step 1 of 3</p>
        <h1 className="font-cv-heading text-2xl font-bold text-cv-ink">Tell us about your business</h1>
        <p className="text-sm text-cv-muted mt-1">This appears on lead notifications and the AI's greeting.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <Label>Business name</Label>
          <Field value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Blue Star Restoration" />
        </div>
        <div>
          <Label>Your name</Label>
          <Field value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="Jordan Blake" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Your email</Label>
            <Field type="email" value={form.ownerEmail} onChange={(e) => update("ownerEmail", e.target.value)} placeholder="jordan@example.com" />
          </div>
          <div>
            <Label>Your phone number</Label>
            <Field type="tel" value={form.ownerPhone} onChange={(e) => update("ownerPhone", e.target.value)} placeholder="+1 (555) 000-0000" />
          </div>
        </div>
        <div>
          <Label>
            Service area <span className="font-normal text-cv-muted normal-case">(optional)</span>
          </Label>
          <Field value={form.serviceArea} onChange={(e) => update("serviceArea", e.target.value)} placeholder="Greater Chicago Area" />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-cv-red">{error}</p>}

      <button
        onClick={handleNext}
        className="mt-8 w-full flex items-center justify-center gap-2 bg-cv-primary text-white font-bold py-3 rounded-xl hover:bg-cv-primary-dark transition-colors"
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
    icon: Wind,
    label: "HVAC Services",
    description: "Emergency repairs, installs, maintenance calls.",
    available: false,
  },
];

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold text-cv-primary uppercase tracking-widest mb-1">Step 2 of 3</p>
        <h1 className="font-cv-heading text-2xl font-bold text-cv-ink">What type of business?</h1>
        <p className="text-sm text-cv-muted mt-1">Your vertical determines the intake questions and scoring model.</p>
      </div>

      <div className="flex flex-col gap-3">
        {VERTICALS.map(({ key, icon: VertIcon, label, description, available }) => (
          <div
            key={key}
            className={`relative rounded-xl border-2 p-4 transition-colors ${
              available ? "border-cv-primary bg-cv-surface-blue" : "border-cv-border bg-white opacity-60"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${available ? "bg-cv-primary-soft" : "bg-cv-gray-soft"}`}>
                <VertIcon className={`w-5 h-5 ${available ? "text-cv-primary" : "text-cv-muted-2"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-cv-ink">{label}</p>
                  {available && <span className="text-xs font-bold bg-cv-primary text-white px-2 py-0.5 rounded-full">Selected</span>}
                  {!available && <span className="text-xs font-bold bg-cv-gray-soft text-cv-muted px-2 py-0.5 rounded-full">Coming soon</span>}
                </div>
                <p className="text-xs text-cv-muted mt-0.5">{description}</p>
              </div>
              {available && (
                <div className="w-5 h-5 rounded-full bg-cv-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-cv-muted mt-4 text-center">More verticals coming soon. Each uses the same infrastructure — just different intake questions and scoring logic.</p>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-cv-border text-cv-ink text-sm font-bold hover:bg-cv-surface-subtle transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 bg-cv-primary text-white font-bold py-3 rounded-xl hover:bg-cv-primary-dark transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Call setup preview ─────────────────────────────────────────────────

function Step3({
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
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold text-cv-primary uppercase tracking-widest mb-1">Step 3 of 3</p>
        <h1 className="font-cv-heading text-2xl font-bold text-cv-ink">One last thing</h1>
        <p className="text-sm text-cv-muted mt-1">How your Callverted number works.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-cv-surface-subtle border border-cv-border p-4 flex flex-col gap-3">
          {[
            ["Missed call detected", "A prospect calls your Callverted number. If unanswered after ~20 seconds, the AI answers automatically."],
            ["AI qualifies the caller", "Callverted asks a few quick questions and gives a price range if you've configured one."],
            ["You get notified", "Once the call ends, you receive an email with the scored lead and a recommended next step."],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cv-primary mt-2 shrink-0" />
              <div>
                <p className="text-sm font-bold text-cv-ink">{title}</p>
                <p className="text-xs text-cv-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-cv-surface-blue border border-[#dce5ff] p-4">
          <p className="text-sm font-bold text-cv-primary-dark mb-1">Getting your number</p>
          <p className="text-xs text-cv-primary-dark/80">
            Email <span className="font-bold">setup@callverted.com</span> after finishing — we&apos;ll provision your dedicated number within 1 business day. Paste it in Settings once you have it.
          </p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-cv-red">{error}</p>}

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-cv-border text-cv-ink text-sm font-bold hover:bg-cv-surface-subtle transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-cv-primary text-white font-bold py-3 rounded-xl hover:bg-cv-primary-dark disabled:opacity-60 transition-colors"
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
      <div className="w-16 h-16 rounded-full bg-cv-green-soft flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-cv-green" />
      </div>
      <h1 className="font-cv-heading text-2xl font-bold text-cv-ink mb-2">You&apos;re all set!</h1>
      <p className="text-sm text-cv-muted mb-8 max-w-sm mx-auto">
        Your account is configured. Once Callverted provisions your dedicated number, you&apos;ll start recovering missed calls automatically.
      </p>

      <div className="rounded-xl bg-cv-surface-subtle border border-cv-border p-4 text-left mb-8">
        <p className="text-sm font-bold text-cv-ink mb-3">Next steps</p>
        <ol className="flex flex-col gap-2 text-sm text-cv-muted">
          <li className="flex gap-2">
            <span className="font-bold text-cv-primary shrink-0">1.</span>
            Email <span className="font-bold">setup@callverted.com</span> to request your number.
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-cv-primary shrink-0">2.</span>
            Paste your assigned number into <span className="font-bold">Settings → Call setup</span>.
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-cv-primary shrink-0">3.</span>
            Forward your business line to your Callverted number.
          </li>
        </ol>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="w-full flex items-center justify-center gap-2 bg-cv-primary text-white font-bold py-3 rounded-xl hover:bg-cv-primary-dark transition-colors"
      >
        Go to dashboard <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    businessName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    serviceArea: "",
    vertical: "restoration",
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
          ownerPhone: form.ownerPhone || undefined,
          forwardingNumber: form.ownerPhone || undefined,
          serviceArea: form.serviceArea || undefined,
          vertical: form.vertical,
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
    <div className="min-h-screen bg-cv-bg font-cv-body text-cv-ink flex items-start justify-center pt-12 px-4 pb-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] grid place-items-center text-white bg-gradient-to-br from-cv-primary to-cv-primary-dark">
              <Icon name="phone_in_talk" className="!text-base" />
            </div>
            <span className="font-cv-heading text-lg font-bold text-cv-primary-dark">Callverted</span>
          </div>
        </div>

        {step < 4 && <StepDots current={step} total={3} />}

        <div className="bg-white rounded-2xl border border-cv-border shadow-cv-sm p-7">
          {step === 1 && <Step1 form={form} update={update} onNext={() => setStep(2)} />}
          {step === 2 && <Step2 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3 form={form} update={update} onBack={() => setStep(2)} onSubmit={handleSubmit} loading={loading} error={error} />}
          {step === 4 && <Step4 router={router} />}
        </div>
      </div>
    </div>
  );
}
