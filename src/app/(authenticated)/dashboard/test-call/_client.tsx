"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Icon } from "@/components/dashboard/v2/primitives";

interface Line {
  role: "user" | "assistant";
  message: string;
}

interface TurnMeta {
  isNewCustomer: boolean | null;
  callerName: string | null;
  zipCode: string | null;
  serviceAreaEligible: boolean | null;
  callbackPreference: string | null;
  priceEligible: boolean | null;
  priceMessage: string | null;
  transferred: boolean | null;
}

interface TurnResponse {
  sessionState: unknown | null;
  lines: Line[];
  state: string;
  answers: Record<string, string>;
  leadId: string | null;
  ended: boolean;
  meta?: TurnMeta;
  error?: string;
}

/** A caller either says something (routed through the classification model) or
 *  presses keys (resolved by code, same as real DTMF). We infer which from the
 *  text: a pure digit/`*`/`#` string is a keypress — in this flow numbers are
 *  always keypad entries (press-1/2/3, ZIP) and speech is never a bare number,
 *  so this removes the "I typed 1 and it said huh?" trap without changing what
 *  the engine actually receives. */
const KEYPAD_RE = /^[0-9*#]+$/;

// Prefix the client tags onto its own optimistic keypad line, since the server
// never echoes a keypress back as transcript (a keypress isn't speech).
const KEYPAD_TAG = "keypad: ";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

// Friendlier labels than the raw VoiceState enum for the status pill / inspector.
const STATE_LABELS: Record<string, string> = {
  greeting: "Greeting",
  new_or_existing: "New or existing?",
  zip_code: "Getting ZIP code",
  qualification: "Qualifying",
  price_eligibility: "Checking pricing",
  price_guidance: "Giving estimate",
  name: "Getting name",
  callback_preference: "Callback preference",
  confirmation: "Confirming",
  create_lead: "Saving lead",
  end: "Call ended",
  fallback_voicemail: "Voicemail",
};

function labelFor(state: string | null): string {
  if (!state) return "—";
  return STATE_LABELS[state] ?? state;
}

export function TestCallClient({ businessName }: { businessName: string }) {
  const [started, setStarted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [state, setState] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<TurnMeta | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialer, setShowDialer] = useState(false);
  const [dialed, setDialed] = useState("");

  // Opaque conversation state handed back by the server each turn and passed
  // straight back on the next one — nothing is kept server-side between requests.
  const sessionStateRef = useRef<unknown | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep the transcript pinned to the newest line as the call progresses.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, loading]);

  async function post(body: Record<string, unknown>): Promise<TurnResponse | null> {
    const res = await fetch("/api/test-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return null;
    }
    return data as TurnResponse;
  }

  function applyResult(data: TurnResponse, appendLines: boolean) {
    sessionStateRef.current = data.sessionState;
    setStarted(true);
    setLines((prev) => (appendLines ? [...prev, ...data.lines] : data.lines));
    setState(data.state);
    setAnswers(data.answers);
    setMeta(data.meta ?? null);
    setLeadId(data.leadId);
    setEnded(data.ended);
  }

  async function startCall() {
    setLoading(true);
    setError(null);
    setLines([]);
    setAnswers({});
    setMeta(null);
    setLeadId(null);
    setEnded(false);
    setDialed("");
    setShowDialer(false);
    sessionStateRef.current = null;
    const data = await post({});
    setLoading(false);
    if (!data) return;
    applyResult(data, false);
    inputRef.current?.focus();
  }

  async function sendSpeech(message: string) {
    setLines((prev) => [...prev, { role: "user", message }]);
    setLoading(true);
    setError(null);
    const data = await post({ sessionState: sessionStateRef.current, message });
    setLoading(false);
    if (!data) return;
    applyResult(data, true);
  }

  /** Mirrors actual keypresses — resolved via the state's DTMF map(s), never the
   *  model, same as a real phone call. Accepts a whole digit string (a ZIP dialed
   *  at once) as well as a single press; the server processes it one key at a time. */
  async function sendDtmf(digits: string) {
    setLines((prev) => [...prev, { role: "user", message: `${KEYPAD_TAG}${digits}` }]);
    setLoading(true);
    setError(null);
    const data = await post({ sessionState: sessionStateRef.current, dtmf: digits });
    setLoading(false);
    if (!data) return;
    applyResult(data, true);
  }

  /** Single entry point for the text bar: routes to keypad or speech by content. */
  function submitInput() {
    const raw = input.trim();
    if (!raw || loading) return;
    setInput("");
    if (KEYPAD_RE.test(raw)) void sendDtmf(raw);
    else void sendSpeech(raw);
  }

  function pressKey(digit: string) {
    setDialed((prev) => (prev + digit).slice(0, 12));
  }

  function sendDialed() {
    const digits = dialed;
    if (!digits || loading) return;
    setDialed("");
    setShowDialer(false);
    void sendDtmf(digits);
  }

  function endCall() {
    sessionStateRef.current = null;
    setStarted(false);
    setLines([]);
    setState(null);
    setAnswers({});
    setMeta(null);
    setLeadId(null);
    setEnded(false);
    setError(null);
    setInput("");
    setDialed("");
    setShowDialer(false);
  }

  const inputIsKeypad = KEYPAD_RE.test(input.trim()) && input.trim().length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3.5 items-start">
      <Card className="overflow-hidden">
        {/* Call status bar */}
        <CardHeader>
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`grid place-items-center w-8 h-8 rounded-full shrink-0 ${
                ended ? "bg-cv-gray-soft text-[#475467]" : started ? "bg-cv-green-soft text-cv-green" : "bg-cv-primary-soft text-cv-primary-dark"
              }`}
            >
              <Icon name={ended ? "call_end" : "call"} className="!text-lg" filled />
            </span>
            <div className="min-w-0">
              <CardTitle className="!text-base truncate">
                {ended ? "Call ended" : started ? "On a call" : "Test call"}
              </CardTitle>
              <div className="text-[11px] text-cv-muted truncate">{businessName}</div>
            </div>
          </div>
          {started && (
            <div className="flex items-center gap-2 shrink-0">
              <Badge color={ended ? "gray" : "green"}>{labelFor(state)}</Badge>
              {!ended && (
                <button
                  onClick={endCall}
                  title="End test call"
                  className="grid place-items-center w-8 h-8 rounded-full bg-cv-red text-white hover:opacity-90 transition-opacity"
                >
                  <Icon name="call_end" className="!text-lg" filled />
                </button>
              )}
            </div>
          )}
        </CardHeader>

        <CardBody className="flex flex-col gap-3.5 !p-0">
          {!started ? (
            <div className="text-center px-6 py-14">
              <span className="grid place-items-center w-14 h-14 rounded-full bg-cv-primary-soft text-cv-primary-dark mx-auto mb-4">
                <Icon name="call" className="!text-[28px]" filled />
              </span>
              <p className="text-sm text-cv-muted mb-5 max-w-sm mx-auto leading-relaxed">
                Ring {businessName} the way an overflow caller would. Type what they&apos;d say, or press keys on the
                dialpad — it runs the exact same engine, classifier, and scoring as a live phone call.
              </p>
              <Button variant="primary" size="lg" onClick={startCall} disabled={loading}>
                <Icon name="call" filled />
                {loading ? "Dialing…" : "Start test call"}
              </Button>
            </div>
          ) : (
            <>
              {/* Transcript */}
              <div ref={transcriptRef} className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto px-5 pt-4">
                {lines.map((line, i) => {
                  const isKeypad = line.role === "user" && line.message.startsWith(KEYPAD_TAG);
                  if (isKeypad) {
                    return (
                      <div key={i} className="flex justify-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cv-gray-soft text-[#475467] px-3 py-1 text-xs font-bold">
                          <Icon name="dialpad" className="!text-sm" />
                          Pressed {line.message.replace(KEYPAD_TAG, "")}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={i} className={`flex ${line.role === "assistant" ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[80%] rounded-[14px] px-3.5 py-2.5 text-sm leading-relaxed ${
                          line.role === "assistant"
                            ? "bg-cv-surface-subtle text-cv-ink rounded-bl-sm"
                            : "bg-cv-primary text-white rounded-br-sm"
                        }`}
                      >
                        {line.message}
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-cv-surface-subtle rounded-[14px] rounded-bl-sm px-3.5 py-3 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cv-muted animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cv-muted animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cv-muted animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              {leadId && (
                <div className="mx-5 rounded-[9px] border border-cv-green-soft bg-cv-green-soft/40 px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm text-cv-ink font-semibold flex items-center gap-1.5">
                    <Icon name="check_circle" className="!text-base text-cv-green" filled />
                    Lead captured
                  </span>
                  <Link href={`/dashboard/leads/${leadId}`} className="text-sm font-bold text-cv-primary hover:underline">
                    View lead →
                  </Link>
                </div>
              )}

              {/* Composer */}
              <div className="border-t border-cv-border px-5 py-3.5 relative">
                {ended ? (
                  <Button variant="primary" onClick={startCall} disabled={loading} className="w-full">
                    <Icon name="replay" />
                    Start another test call
                  </Button>
                ) : (
                  <>
                    {showDialer && (
                      <Dialer
                        dialed={dialed}
                        loading={loading}
                        onPress={pressKey}
                        onBackspace={() => setDialed((p) => p.slice(0, -1))}
                        onSend={sendDialed}
                        onClose={() => setShowDialer(false)}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDialer((v) => !v)}
                        title="Open dialpad"
                        className={`grid place-items-center w-10 h-10 rounded-[9px] border shrink-0 transition-colors ${
                          showDialer
                            ? "bg-cv-primary text-white border-cv-primary"
                            : "bg-cv-surface text-cv-ink border-cv-border-strong hover:bg-cv-surface-subtle"
                        }`}
                      >
                        <Icon name="dialpad" />
                      </button>
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submitInput();
                          }
                        }}
                        placeholder="Say something, or type digits to press keys…"
                        disabled={loading}
                        className="flex-1 h-10 border border-cv-border-strong rounded-[9px] bg-cv-surface text-cv-ink px-[11px] outline-none focus:border-cv-primary focus:ring-[3px] focus:ring-cv-primary/10 disabled:opacity-50"
                      />
                      <Button variant="primary" onClick={submitInput} disabled={loading || !input.trim()} className="shrink-0">
                        {inputIsKeypad ? <Icon name="dialpad" /> : <Icon name="send" />}
                        Send
                      </Button>
                    </div>
                    <div className="mt-1.5 text-[11px] text-cv-muted h-4">
                      {input.trim().length === 0 ? (
                        "Numbers are sent as keypad presses; anything else is sent as speech."
                      ) : inputIsKeypad ? (
                        <span className="text-cv-primary-dark font-semibold">Enter ↵ presses {input.trim()} on the keypad</span>
                      ) : (
                        <span>Enter ↵ says this to the receptionist</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          {error && <p className="text-sm text-cv-red px-5 pb-4">{error}</p>}
        </CardBody>
      </Card>

      <CallInspector state={state} answers={answers} meta={meta} />
    </div>
  );
}

function Dialer({
  dialed,
  loading,
  onPress,
  onBackspace,
  onSend,
  onClose,
}: {
  dialed: string;
  loading: boolean;
  onPress: (d: string) => void;
  onBackspace: () => void;
  onSend: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-5 mb-2 w-[248px] rounded-xl border border-cv-border bg-cv-surface shadow-cv-md p-3 z-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-cv-muted">Dialpad</span>
        <button onClick={onClose} className="text-cv-muted hover:text-cv-ink grid place-items-center">
          <Icon name="close" className="!text-base" />
        </button>
      </div>
      <div className="h-9 rounded-[9px] bg-cv-surface-subtle border border-cv-border flex items-center px-3 mb-2 font-mono text-base tracking-[0.2em] text-cv-ink">
        {dialed || <span className="text-cv-muted tracking-normal font-sans text-xs">Tap keys, then send…</span>}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {KEYS.map((digit) => (
          <button
            key={digit}
            onClick={() => onPress(digit)}
            disabled={loading}
            className="h-11 rounded-[9px] border border-cv-border-strong bg-cv-surface text-lg font-bold text-cv-ink hover:bg-cv-surface-subtle active:bg-cv-primary-soft disabled:opacity-50 transition-colors"
          >
            {digit}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        <button
          onClick={onBackspace}
          disabled={loading || !dialed}
          className="h-10 flex-1 rounded-[9px] border border-cv-border-strong bg-cv-surface text-cv-ink hover:bg-cv-surface-subtle disabled:opacity-40 grid place-items-center transition-colors"
          title="Delete"
        >
          <Icon name="backspace" />
        </button>
        <button
          onClick={onSend}
          disabled={loading || !dialed}
          className="h-10 flex-[2] rounded-[9px] bg-cv-primary text-white font-bold hover:bg-cv-primary-dark disabled:opacity-40 grid place-items-center gap-1.5 grid-flow-col transition-colors"
        >
          <Icon name="dialpad" className="!text-base" />
          Press
        </button>
      </div>
    </div>
  );
}

function CallInspector({
  state,
  answers,
  meta,
}: {
  state: string | null;
  answers: Record<string, string>;
  meta: TurnMeta | null;
}) {
  const captured: { label: string; value: string }[] = [];
  if (meta?.isNewCustomer != null) captured.push({ label: "Customer", value: meta.isNewCustomer ? "New" : "Existing" });
  if (meta?.zipCode) {
    const area = meta.serviceAreaEligible == null ? "" : meta.serviceAreaEligible ? " · in area" : " · out of area";
    captured.push({ label: "ZIP", value: `${meta.zipCode}${area}` });
  }
  if (meta?.callerName) captured.push({ label: "Name", value: meta.callerName });
  if (meta?.callbackPreference) captured.push({ label: "Callback", value: meta.callbackPreference });
  if (meta?.priceMessage) captured.push({ label: "Estimate", value: meta.priceMessage });
  if (meta?.transferred) captured.push({ label: "Transfer", value: "Bridged to human" });

  const answerEntries = Object.entries(answers);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="!text-base">Call inspector</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div>
          <div className="text-[10px] tracking-wide uppercase text-cv-muted font-semibold mb-1.5">Current step</div>
          <Badge color="blue">{labelFor(state)}</Badge>
        </div>

        <div>
          <div className="text-[10px] tracking-wide uppercase text-cv-muted font-semibold mb-2">Qualifying answers</div>
          {answerEntries.length === 0 ? (
            <div className="text-sm text-cv-muted">None yet</div>
          ) : (
            <dl className="text-sm space-y-1.5">
              {answerEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="text-cv-muted capitalize">{key.replace(/_/g, " ")}</dt>
                  <dd className="font-semibold text-cv-ink text-right">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {captured.length > 0 && (
          <div>
            <div className="text-[10px] tracking-wide uppercase text-cv-muted font-semibold mb-2">Call details</div>
            <dl className="text-sm space-y-1.5">
              {captured.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-cv-muted">{label}</dt>
                  <dd className="font-semibold text-cv-ink text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <p className="text-xs text-cv-muted leading-relaxed border-t border-cv-border pt-3">
          Typed words go through the same classification model as a real call; keypad presses are resolved by code, same
          as real DTMF. No live audio or interrupt timing here yet. Leads created are tagged as test leads and won&apos;t
          email the business.
        </p>
      </CardBody>
    </Card>
  );
}
