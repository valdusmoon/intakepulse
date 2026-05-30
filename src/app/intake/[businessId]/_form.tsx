"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { VerticalQuestion } from "@/lib/db/schema/verticalConfigs";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";

type Answers = Record<string, string | string[]>;

interface IntakeFormProps {
  businessId: string;
  businessName: string;
  questions: VerticalQuestion[];
  leadId?: string;
}

function getVisibleQuestions(questions: VerticalQuestion[], answers: Answers): VerticalQuestion[] {
  return questions.filter((q) => {
    if (!q.conditional) return true;
    const { key, value } = q.conditional;
    const answer = answers[key];
    return Array.isArray(answer) ? answer.includes(value) : answer === value;
  });
}

// ─── Contact Info ─────────────────────────────────────────────────────────────

function ContactStep({
  name,
  phone,
  consent,
  onName,
  onPhone,
  onConsent,
  onNext,
  businessName,
}: {
  name: string;
  phone: string;
  consent: boolean;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onConsent: (v: boolean) => void;
  onNext: () => void;
  businessName: string;
}) {
  const [phoneError, setPhoneError] = useState("");

  function handleNext() {
    if (!name.trim() || !phone.trim() || !consent) return;
    const r = validateAndNormalizePhone(phone);
    if (!r.isValid) {
      setPhoneError(r.error ?? "Invalid phone number.");
      return;
    }
    setPhoneError("");
    onPhone(r.normalized!);
    onNext();
  }

  const canProceed = name.trim() && phone.trim() && consent;

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Jane Smith"
            autoFocus
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              onPhone(e.target.value);
              setPhoneError("");
            }}
            placeholder="+1 (555) 000-0000"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {phoneError && <p className="text-sm text-red-600 mt-1.5">{phoneError}</p>}
        </div>

        <button
          type="button"
          onClick={() => onConsent(!consent)}
          className="flex gap-3 items-start text-left w-full"
        >
          <div
            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
              consent ? "bg-orange-500 border-orange-500" : "border-gray-300 bg-white"
            }`}
          >
            {consent && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
          <span className="text-sm text-gray-600 leading-snug">
            By proceeding, I agree to receive text messages from{" "}
            <strong className="text-gray-800">{businessName}</strong> regarding my inquiry.
            Message rates may apply.
          </span>
        </button>
      </div>

      <button
        onClick={handleNext}
        disabled={!canProceed}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base"
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
              ? "border-orange-500 bg-orange-50 text-orange-800"
              : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                value === opt.value ? "border-orange-500" : "border-gray-300"
              }`}
            >
              {value === opt.value && (
                <div className="w-2 h-2 rounded-full bg-orange-500" />
              )}
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
      <p className="text-xs text-gray-400 mb-3">Select all that apply</p>
      {question.options?.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
              selected
                ? "border-orange-500 bg-orange-50 text-orange-800"
                : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                  selected ? "bg-orange-500 border-orange-500" : "border-gray-300"
                }`}
              >
                {selected && (
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                )}
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
                ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 active:bg-gray-50"
            }`}
          >
            {opt.value}
          </button>
        ))}
      </div>
      {min && max && (
        <div className="flex justify-between text-xs text-gray-400 px-1">
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
      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
    />
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function IntakeForm({
  businessId,
  businessName,
  questions,
  leadId,
}: IntakeFormProps) {
  const [step, setStep] = useState(0); // 0 = contact info; 1..N = questions
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
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

  async function handleSubmit() {
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
          smsConsent: true,
          answers,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed. Please try again.");
      }
      setSubmitted(true);
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

  // Auto-advance after brief visual feedback for single-select and scale
  function handleAutoAdvance(key: string, value: string) {
    setAnswer(key, value);
    setTimeout(() => advance(), 200);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            We have everything we need.{" "}
            <span className="font-semibold text-gray-700">{businessName}</span> will be in
            touch shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 fixed top-0 left-0 right-0 z-10">
        <div
          className="h-full bg-orange-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-md mx-auto px-5 pt-10 pb-12">
        {/* Step label + question */}
        <div className="mb-6">
          {step === 0 ? (
            <>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
                Contact Info
              </p>
              <h2 className="text-xl font-bold text-gray-900">
                Let&apos;s get started
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                We&apos;ll connect you with {businessName} right away.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">
                Question {step} of {visibleQuestions.length}
              </p>
              <h2 className="text-xl font-bold text-gray-900">
                {currentQuestion?.label}
              </h2>
            </>
          )}
        </div>

        {/* Step 0: Contact info */}
        {step === 0 && (
          <ContactStep
            name={callerName}
            phone={callerPhone}
            consent={smsConsent}
            onName={setCallerName}
            onPhone={setCallerPhone}
            onConsent={setSmsConsent}
            onNext={advance}
            businessName={businessName}
          />
        )}

        {/* Question steps */}
        {step > 0 && currentQuestion && (
          <>
            {currentQuestion.type === "single_select" && (
              <SingleSelectQuestion
                question={currentQuestion}
                value={getAnswerStr(currentQuestion.key)}
                onChange={(v) =>
                  isLastStep
                    ? (() => { setAnswer(currentQuestion.key, v); setTimeout(handleSubmit, 200); })()
                    : handleAutoAdvance(currentQuestion.key, v)
                }
              />
            )}

            {currentQuestion.type === "scale" && (
              <ScaleQuestion
                question={currentQuestion}
                value={getAnswerStr(currentQuestion.key)}
                onChange={(v) =>
                  isLastStep
                    ? (() => { setAnswer(currentQuestion.key, v); setTimeout(handleSubmit, 200); })()
                    : handleAutoAdvance(currentQuestion.key, v)
                }
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
                    className="flex items-center justify-center p-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={advance}
                    disabled={!canAdvance() || loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLastStep
                      ? loading
                        ? "Submitting…"
                        : "Submit"
                      : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </>
            )}

            {currentQuestion.type === "text" && (
              <>
                <TextQuestion
                  value={getAnswerStr(currentQuestion.key)}
                  onChange={(v) => setAnswer(currentQuestion.key, v)}
                />
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center justify-center p-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={advance}
                    disabled={!canAdvance() || loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLastStep
                      ? loading
                        ? "Submitting…"
                        : "Submit"
                      : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </>
            )}

            {/* Back link for auto-advance question types (single/scale) */}
            {(currentQuestion.type === "single_select" ||
              currentQuestion.type === "scale") && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors py-2 px-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
