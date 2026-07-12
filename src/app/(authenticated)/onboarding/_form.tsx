"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Wind, Droplets, Wrench, Zap, Hammer, MoreHorizontal } from "lucide-react";
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
        <p className="text-xs font-bold text-cv-primary uppercase tracking-widest mb-1">Step 1 of 2</p>
        <h1 className="font-cv-heading text-2xl font-bold text-cv-ink">Tell us about your business</h1>
        <p className="text-sm text-cv-muted mt-1">This appears on lead notifications and the AI&apos;s greeting.</p>
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
            <p className="mt-1 text-[11px] text-cv-muted">The line we ring first on every call. Callverted only steps in if you don&apos;t pick up.</p>
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

// ─── Step 2: Vertical (last config step — its Continue is the atomic finish) ───

const VERTICALS = [
  {
    key: "restoration",
    icon: Droplets,
    label: "Water / Fire / Mold Restoration",
    description: "Emergency remediation, drying, structural restoration.",
  },
  {
    key: "hvac",
    icon: Wind,
    label: "HVAC",
    description: "AC and heating repair, replacement, ductwork.",
  },
  {
    key: "plumbing",
    icon: Wrench,
    label: "Plumbing",
    description: "Leaks, clogs, water heaters, emergency calls.",
  },
  {
    key: "electrical",
    icon: Zap,
    label: "Electrical",
    description: "Panel upgrades, rewiring, EV chargers, emergency calls.",
  },
  {
    key: "general_contracting",
    icon: Hammer,
    label: "General Contracting",
    description: "Repairs, renovations, additions.",
  },
  {
    key: "other",
    icon: MoreHorizontal,
    label: "Other",
    description: "A general intake flow that fits any service business.",
  },
];

function Step2({
  form,
  update,
  onFinish,
  onBack,
  finishing,
  finishError,
}: {
  form: FormData;
  update: (k: keyof FormData, v: string | number) => void;
  onFinish: () => void;
  onBack: () => void;
  finishing: boolean;
  finishError: string;
}) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold text-cv-primary uppercase tracking-widest mb-1">Step 2 of 2</p>
        <h1 className="font-cv-heading text-2xl font-bold text-cv-ink">What type of business?</h1>
        <p className="text-sm text-cv-muted mt-1">Your vertical determines the intake questions and scoring model.</p>
      </div>

      <div className="flex flex-col gap-3">
        {VERTICALS.map(({ key, icon: VertIcon, label, description }) => {
          const selected = form.vertical === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => update("vertical", key)}
              className={`relative text-left rounded-xl border-2 p-4 transition-colors ${
                selected ? "border-cv-primary bg-cv-surface-blue" : "border-cv-border bg-white hover:bg-cv-surface-subtle"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-cv-primary-soft" : "bg-cv-gray-soft"}`}>
                  <VertIcon className={`w-5 h-5 ${selected ? "text-cv-primary" : "text-cv-muted-2"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-cv-ink">{label}</p>
                  <p className="text-xs text-cv-muted mt-0.5">{description}</p>
                </div>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-cv-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {finishError && <p className="mt-4 text-sm text-cv-red">{finishError}</p>}

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          disabled={finishing}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-cv-border text-cv-ink text-sm font-bold hover:bg-cv-surface-subtle disabled:opacity-60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onFinish}
          disabled={finishing}
          className="flex-1 flex items-center justify-center gap-2 bg-cv-primary text-white font-bold py-3 rounded-xl hover:bg-cv-primary-dark disabled:opacity-60 transition-colors"
        >
          {finishing ? "Setting up…" : (<>Go to your dashboard <ArrowRight className="w-4 h-4" /></>)}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────
// Model B: no card yet. They land in "Setup mode" — explore, run a test call,
// then add payment to provision the live number and go live.

function Step3Done({ router }: { router: ReturnType<typeof useRouter> }) {
  const assistedUrl = process.env.NEXT_PUBLIC_ASSISTED_ONBOARDING_URL;
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-cv-green-soft flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-cv-green" />
      </div>
      <h1 className="font-cv-heading text-2xl font-bold text-cv-ink mb-2">You&apos;re set up!</h1>
      <p className="text-sm text-cv-muted mb-8 max-w-sm mx-auto">
        Explore your dashboard and run a test call to hear the AI qualify a lead. When you&apos;re ready, add a card to
        get your live number and start capturing real calls — no charge until you go live.
      </p>

      <button
        onClick={() => router.push("/dashboard")}
        className="w-full flex items-center justify-center gap-2 bg-cv-primary text-white font-bold py-3 rounded-xl hover:bg-cv-primary-dark transition-colors"
      >
        Go to dashboard <ArrowRight className="w-4 h-4" />
      </button>

      {assistedUrl && (
        <a
          href={assistedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-cv-primary hover:underline"
        >
          Rather have us set it up with you? Book a 15 min call
        </a>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
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

  // The only write to the businesses table in onboarding. Model B: this creates
  // a CONFIGURED business with NO subscription and NO Twilio number — the card
  // and the live number are attached later, at the "Add payment & go live"
  // moment on the dashboard. So a business existing now means "configured, not
  // yet live" (was "onboarding done" under the old card-up-front flow).
  async function handleFinishOnboarding() {
    setFinishing(true);
    setFinishError("");
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
        throw new Error(data.error || "Failed to finish setup. Please try again.");
      }
      setStep(3);
    } catch (e) {
      setFinishError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setFinishing(false);
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

        {step < 3 && <StepDots current={step} total={2} />}

        <div className="bg-white rounded-2xl border border-cv-border shadow-cv-sm p-7">
          {step === 1 && <Step1 form={form} update={update} onNext={() => setStep(2)} />}
          {step === 2 && (
            <Step2
              form={form}
              update={update}
              onFinish={handleFinishOnboarding}
              onBack={() => setStep(1)}
              finishing={finishing}
              finishError={finishError}
            />
          )}
          {step === 3 && <Step3Done router={router} />}
        </div>
      </div>
    </div>
  );
}
