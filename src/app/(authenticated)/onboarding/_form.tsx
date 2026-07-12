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
  twilioPhoneNumber: string;
}

/** Yellow "this isn't real yet" banner — same treatment on both mock steps so it reads as one deliberate pattern, not an inconsistency. */
function MockNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mb-4 text-xs text-amber-800">{children}</div>
  );
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
        <p className="text-xs font-bold text-cv-primary uppercase tracking-widest mb-1">Step 1 of 4</p>
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
  onNext,
  onBack,
}: {
  form: FormData;
  update: (k: keyof FormData, v: string | number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold text-cv-primary uppercase tracking-widest mb-1">Step 2 of 4</p>
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

// ─── Step 4: Number (mock Twilio provisioning) ─────────────────────────────────
// Number comes AFTER payment on purpose: we don't provision a (real, paid) line
// for someone who hasn't put payment on file. This step's Continue is the single
// atomic finish for the whole wizard (see handleFinishOnboarding).

function fmtDisplayNumber(e164: string) {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

function Step4Number({
  onFinish,
  onBack,
  finishing,
  finishError,
}: {
  onFinish: (phoneNumber: string) => void;
  onBack: () => void;
  finishing: boolean;
  finishError: string;
}) {
  const [areaCode, setAreaCode] = useState("");
  const [numbers, setNumbers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!/^\d{3}$/.test(areaCode)) {
      setError("Enter a 3-digit area code.");
      return;
    }
    setError("");
    setSearching(true);
    setNumbers([]);
    setSelected(null);
    try {
      const res = await fetch("/api/twilio/numbers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed.");
      setNumbers(data.numbers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSelect(phoneNumber: string) {
    setError("");
    setPurchasing(true);
    try {
      const res = await fetch("/api/twilio/numbers/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign number.");
      setSelected(phoneNumber);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold text-cv-primary uppercase tracking-widest mb-1">Step 4 of 4</p>
        <h1 className="font-cv-heading text-2xl font-bold text-cv-ink">Get your number</h1>
        <p className="text-sm text-cv-muted mt-1">Search for a phone number near your service area.</p>
      </div>

      <MockNotice>Test mode — these are placeholder numbers, not real working lines. Real Twilio provisioning isn't wired up yet.</MockNotice>

      {!selected ? (
        <>
          <div className="flex gap-2">
            <Field
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="Area code, e.g. 512"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="shrink-0 px-4 rounded-xl bg-cv-primary text-white font-bold text-sm hover:bg-cv-primary-dark disabled:opacity-60 transition-colors"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          {numbers.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {numbers.map((n) => (
                <button
                  key={n}
                  onClick={() => handleSelect(n)}
                  disabled={purchasing}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-cv-border hover:border-cv-primary hover:bg-cv-surface-blue transition-colors text-left disabled:opacity-60"
                >
                  <span className="font-cv-mono font-bold text-sm">{fmtDisplayNumber(n)}</span>
                  <span className="text-xs text-cv-primary font-bold">{purchasing ? "Assigning…" : "Select"}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl bg-cv-surface-blue border border-[#dce5ff] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cv-primary flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-cv-ink">{fmtDisplayNumber(selected)}</p>
            <p className="text-xs text-cv-muted">Assigned to your account (test mode)</p>
          </div>
        </div>
      )}

      {(error || finishError) && <p className="mt-4 text-sm text-cv-red">{error || finishError}</p>}

      <div className="mt-8 flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-cv-border text-cv-ink text-sm font-bold hover:bg-cv-surface-subtle transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => selected && onFinish(selected)}
          disabled={!selected || finishing}
          className="flex-1 flex items-center justify-center gap-2 bg-cv-primary text-white font-bold py-3 rounded-xl hover:bg-cv-primary-dark disabled:opacity-60 transition-colors"
        >
          {finishing ? "Finishing…" : (<>Finish setup <ArrowRight className="w-4 h-4" /></>)}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Payment (mock trial activation) ───────────────────────────────────
// One action: start the trial and advance. No separate "started → continue"
// click. The real atomic write happens later, on the number step's Finish.

/** Human date N days out, for the "no charge until X" trial framing. */
function daysOutDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function Step3Payment({
  onStarted,
  onBack,
}: {
  onStarted: (trialEndsAt: string) => void;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    setError("");
    setLoading(true);
    try {
      // MOCK: stands in for a real Stripe Checkout session in trial mode.
      // To go live, swap this call for POST /api/stripe/checkout and redirect to
      // the returned URL. See docs/monetization-and-conversion.md section 5.
      const res = await fetch("/api/onboarding/mock-subscribe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start trial.");
      onStarted(data.trialEndsAt); // sets trial state AND advances to the number step
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-bold text-cv-primary uppercase tracking-widest mb-1">Step 3 of 4</p>
        <h1 className="font-cv-heading text-2xl font-bold text-cv-ink">Start your free trial</h1>
        <p className="text-sm text-cv-muted mt-1">
          14 days free. No charge until {daysOutDate(14)}, then $149/mo. Cancel anytime.
        </p>
      </div>

      <MockNotice>Test mode — card collection isn&apos;t wired up yet. Clicking below just marks your account as trialing.</MockNotice>

      <div className="rounded-xl border border-cv-border p-4">
        <p className="text-sm font-bold text-cv-ink mb-2">What you get</p>
        <ul className="flex flex-col gap-1.5 text-xs text-cv-muted">
          <li>AI voice overflow, answers and qualifies calls your team can&apos;t get to</li>
          <li>Lead dashboard, call log, summaries, and transcripts</li>
          <li>Business-approved pricing rules, configured per service category</li>
        </ul>
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
          onClick={handleStart}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-cv-primary text-white font-bold py-3 rounded-xl hover:bg-cv-primary-dark disabled:opacity-60 transition-colors"
        >
          {loading ? "Starting…" : "Start free trial (test mode)"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Done ─────────────────────────────────────────────────────────────

function Step5Done({ router }: { router: ReturnType<typeof useRouter> }) {
  const assistedUrl = process.env.NEXT_PUBLIC_ASSISTED_ONBOARDING_URL;
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-cv-green-soft flex items-center justify-center mx-auto mb-6">
        <Check className="w-8 h-8 text-cv-green" />
      </div>
      <h1 className="font-cv-heading text-2xl font-bold text-cv-ink mb-2">You&apos;re all set!</h1>
      <p className="text-sm text-cv-muted mb-8 max-w-sm mx-auto">
        Your number and trial are active (test mode). Next, from your dashboard, make a test call and forward your
        missed calls to go fully live.
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
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [form, setForm] = useState<FormData>({
    businessName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    serviceArea: "",
    vertical: "restoration",
    twilioPhoneNumber: "",
  });

  function update(field: keyof FormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // The only write to the businesses table in the entire onboarding flow —
  // business info, vertical, chosen number, and trial state are all held in
  // local state until here, then submitted in one atomic call. That's on
  // purpose: a business existing at all is now itself proof onboarding
  // finished, so there's no separate "in progress" state to track or resume.
  async function handleFinishOnboarding(twilioPhoneNumber: string) {
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
          twilioPhoneNumber,
          subscriptionStatus: "trialing",
          trialEndsAt,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to finish setup. Please try again.");
      }
      setStep(5);
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

        {step < 5 && <StepDots current={step} total={4} />}

        <div className="bg-white rounded-2xl border border-cv-border shadow-cv-sm p-7">
          {step === 1 && <Step1 form={form} update={update} onNext={() => setStep(2)} />}
          {step === 2 && <Step2 form={form} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && (
            <Step3Payment
              onStarted={(t) => {
                setTrialEndsAt(t);
                setStep(4);
              }}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <Step4Number
              onFinish={(phoneNumber) => {
                update("twilioPhoneNumber", phoneNumber);
                handleFinishOnboarding(phoneNumber);
              }}
              onBack={() => setStep(3)}
              finishing={finishing}
              finishError={finishError}
            />
          )}
          {step === 5 && <Step5Done router={router} />}
        </div>
      </div>
    </div>
  );
}
