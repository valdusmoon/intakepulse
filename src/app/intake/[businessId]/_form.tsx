"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { getVisibleQuestions, type Answers } from "@/lib/verticals/filterAnswers";

interface IntakeFormProps {
  businessId: string;
  businessName: string;
  questions: VerticalQuestion[];
  leadId?: string;
  source?: string;
}

const inputCls =
  "w-full border border-cv-border-strong rounded-xl px-4 py-3 text-base text-cv-ink placeholder-cv-muted-2 bg-white focus:outline-none focus:ring-2 focus:ring-cv-primary/30 focus:border-cv-primary transition-colors";

// ─── Contact Info ─────────────────────────────────────────────────────────────

function ContactStep({
  name,
  phone,
  email,
  onName,
  onPhone,
  onEmail,
  onNext,
}: {
  name: string;
  phone: string;
  email: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onEmail: (v: string) => void;
  onNext: () => void;
}) {
  const [phoneError, setPhoneError] = useState("");

  function handleNext() {
    if (!name.trim() || !phone.trim()) return;
    const r = validateAndNormalizePhone(phone);
    if (!r.isValid) {
      setPhoneError(r.error ?? "Invalid phone number.");
      return;
    }
    setPhoneError("");
    onPhone(r.normalized!);
    onNext();
  }

  const canProceed = name.trim() && phone.trim();

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#344054] mb-1.5">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Jane Smith"
            autoFocus
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#344054] mb-1.5">Your phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              onPhone(e.target.value);
              setPhoneError("");
            }}
            placeholder="+1 (555) 000-0000"
            className={inputCls}
          />
          {phoneError && <p className="text-sm text-cv-red mt-1.5">{phoneError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#344054] mb-1.5">
            Email <span className="text-cv-muted-2 font-normal">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!canProceed}
        className="w-full flex items-center justify-center gap-2 bg-cv-primary text-white font-semibold py-3.5 rounded-xl hover:bg-cv-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Single Select ────────────────────────────────────────────────────────────

function SingleSelectQuestion({
  question,
  value,
  onChange,
}: {
  question: VerticalQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {question.options?.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
            value === opt.value
              ? "border-cv-primary bg-cv-primary-soft text-cv-primary-dark"
              : "border-cv-border bg-white text-[#344054] hover:border-cv-border-strong hover:bg-cv-surface-subtle active:bg-cv-surface-subtle"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                value === opt.value ? "border-cv-primary" : "border-cv-border-strong"
              }`}
            >
              {value === opt.value && <div className="w-2 h-2 rounded-full bg-cv-primary" />}
            </div>
            {opt.label}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Multi Select ─────────────────────────────────────────────────────────────

function MultiSelectQuestion({
  question,
  value,
  onChange,
}: {
  question: VerticalQuestion;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-cv-muted-2 mb-3">Select all that apply</p>
      {question.options?.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
              selected
                ? "border-cv-primary bg-cv-primary-soft text-cv-primary-dark"
                : "border-cv-border bg-white text-[#344054] hover:border-cv-border-strong hover:bg-cv-surface-subtle active:bg-cv-surface-subtle"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                  selected ? "bg-cv-primary border-cv-primary" : "border-cv-border-strong"
                }`}
              >
                {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </div>
              {opt.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Scale ────────────────────────────────────────────────────────────────────

function ScaleQuestion({
  question,
  value,
  onChange,
}: {
  question: VerticalQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = question.options ?? [];
  const min = opts[0];
  const max = opts[opts.length - 1];

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {opts.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-4 rounded-xl border-2 text-lg font-bold transition-all ${
              value === opt.value
                ? "border-cv-primary bg-cv-primary text-white shadow-sm"
                : "border-cv-border bg-white text-[#344054] hover:border-cv-border-strong active:bg-cv-surface-subtle"
            }`}
          >
            {opt.value}
          </button>
        ))}
      </div>
      {min && max && (
        <div className="flex justify-between text-xs text-cv-muted-2 px-1">
          <span>{min.label.replace(/^\d — /, "")}</span>
          <span>{max.label.replace(/^\d — /, "")}</span>
        </div>
      )}
    </div>
  );
}

// ─── Text ─────────────────────────────────────────────────────────────────────

function TextQuestion({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer here..."
      rows={4}
      autoFocus
      className={`${inputCls} resize-none`}
    />
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function IntakeForm({
  businessId,
  businessName,
  questions,
  leadId,
  source,
}: IntakeFormProps) {
  const [step, setStep] = useState(0); // 0 = contact info; 1..N = questions
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [callerEmail, setCallerEmail] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const visibleQuestions = useMemo(
    () => getVisibleQuestions(questions, answers),
    [questions, answers]
  );

  const currentQuestion = step > 0 ? visibleQuestions[step - 1] ?? null : null;
  const isLastStep = step >= visibleQuestions.length;
  const progressPct =
    step === 0 ? 0 : Math.round((step / (visibleQuestions.length + 1)) * 100);

  function setAnswer(key: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function getAnswerStr(key: string): string {
    const v = answers[key];
    return typeof v === "string" ? v : "";
  }

  function getAnswerArr(key: string): string[] {
    const v = answers[key];
    return Array.isArray(v) ? v : [];
  }

  function canAdvance(): boolean {
    if (!currentQuestion) return true;
    if (!currentQuestion.required) return true;
    const a = answers[currentQuestion.key];
    return Array.isArray(a) ? a.length > 0 : !!a;
  }

  async function handleSubmit(finalAnswers: Answers = answers) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/intake/${businessId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          callerName,
          callerPhone,
          callerEmail: callerEmail.trim() || undefined,
          answers: finalAnswers,
          source,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed. Please try again.");
      }
      setSubmitted(true);
      // Notify parent (widget iframe) that form is complete so it can close the modal
      if (window.parent !== window) {
        window.parent.postMessage("ip:intake-complete", "*");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  function advance() {
    if (isLastStep) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-cv-green-soft flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-cv-green" />
          </div>
          <h1 className="font-cv-heading text-2xl font-bold text-cv-ink mb-2">You&apos;re all set!</h1>
          <p className="text-cv-muted text-sm leading-relaxed">
            We have everything we need.{" "}
            <span className="font-semibold text-[#344054]">{businessName}</span> will be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cv-surface-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-cv-primary-soft border-t-cv-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-cv-muted">Submitting your answers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cv-surface-subtle font-cv-body">
      {/* Progress bar */}
      <div className="h-1 bg-cv-border fixed top-0 left-0 right-0 z-10">
        <div
          className="h-full bg-cv-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-md mx-auto px-5 pt-10 pb-12">
        {/* Step label + question */}
        <div className="mb-6">
          {step === 0 ? (
            <>
              <p className="text-xs font-semibold text-cv-primary uppercase tracking-widest mb-1">Contact Info</p>
              <h2 className="font-cv-heading text-xl font-bold text-cv-ink">Let&apos;s get started</h2>
              <p className="text-sm text-cv-muted mt-1">We&apos;ll connect you with {businessName} right away.</p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-cv-primary uppercase tracking-widest mb-1">
                Question {step} of {visibleQuestions.length}
              </p>
              <h2 className="font-cv-heading text-xl font-bold text-cv-ink">{currentQuestion?.label}</h2>
            </>
          )}
        </div>

        {/* Step 0: Contact info */}
        {step === 0 && (
          <ContactStep
            name={callerName}
            phone={callerPhone}
            email={callerEmail}
            onName={setCallerName}
            onPhone={setCallerPhone}
            onEmail={setCallerEmail}
            onNext={advance}
          />
        )}

        {/* Question steps */}
        {step > 0 && currentQuestion && (
          <>
            {currentQuestion.type === "single_select" && (
              <SingleSelectQuestion
                question={currentQuestion}
                value={getAnswerStr(currentQuestion.key)}
                onChange={(v) => {
                  setAnswer(currentQuestion.key, v);
                  if (isLastStep) {
                    const final = { ...answers, [currentQuestion.key]: v };
                    setTimeout(() => handleSubmit(final), 200);
                  } else {
                    setTimeout(() => setStep((s) => s + 1), 200);
                  }
                }}
              />
            )}

            {currentQuestion.type === "scale" && (
              <ScaleQuestion
                question={currentQuestion}
                value={getAnswerStr(currentQuestion.key)}
                onChange={(v) => {
                  setAnswer(currentQuestion.key, v);
                  if (isLastStep) {
                    const final = { ...answers, [currentQuestion.key]: v };
                    setTimeout(() => handleSubmit(final), 200);
                  } else {
                    setTimeout(() => setStep((s) => s + 1), 200);
                  }
                }}
              />
            )}

            {currentQuestion.type === "multi_select" && (
              <>
                <MultiSelectQuestion
                  question={currentQuestion}
                  value={getAnswerArr(currentQuestion.key)}
                  onChange={(v) => setAnswer(currentQuestion.key, v)}
                />
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center justify-center p-3 rounded-xl border border-cv-border text-cv-muted hover:bg-cv-surface-subtle transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={advance}
                    disabled={!canAdvance() || loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-cv-primary text-white font-semibold py-3.5 rounded-xl hover:bg-cv-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLastStep ? (loading ? "Submitting…" : "Submit") : (<>Continue <ArrowRight className="w-4 h-4" /></>)}
                  </button>
                </div>
              </>
            )}

            {currentQuestion.type === "text" && (
              <>
                <TextQuestion value={getAnswerStr(currentQuestion.key)} onChange={(v) => setAnswer(currentQuestion.key, v)} />
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center justify-center p-3 rounded-xl border border-cv-border text-cv-muted hover:bg-cv-surface-subtle transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={advance}
                    disabled={!canAdvance() || loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-cv-primary text-white font-semibold py-3.5 rounded-xl hover:bg-cv-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLastStep ? (loading ? "Submitting…" : "Submit") : (<>Continue <ArrowRight className="w-4 h-4" /></>)}
                  </button>
                </div>
              </>
            )}

            {/* Back link for auto-advance question types (single/scale) */}
            {(currentQuestion.type === "single_select" || currentQuestion.type === "scale") && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="inline-flex items-center gap-1.5 text-sm text-cv-muted-2 hover:text-cv-muted transition-colors py-2 px-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>
            )}
          </>
        )}

        {error && <p className="mt-4 text-sm text-cv-red text-center">{error}</p>}
      </div>
    </div>
  );
}
