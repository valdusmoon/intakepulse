"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Field, Icon } from "@/components/dashboard/v2/primitives";

interface Line {
  role: "user" | "assistant";
  message: string;
}

interface TurnResponse {
  sessionState: unknown | null;
  lines: Line[];
  state: string;
  answers: Record<string, string>;
  leadId: string | null;
  ended: boolean;
  error?: string;
}

export function TestCallClient({ businessName }: { businessName: string }) {
  const [started, setStarted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [state, setState] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [leadId, setLeadId] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Opaque conversation state handed back by the server each turn and passed
  // straight back on the next one — nothing is kept server-side between requests.
  const sessionStateRef = useRef<unknown | null>(null);

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
    setLeadId(data.leadId);
    setEnded(data.ended);
  }

  async function startCall() {
    setLoading(true);
    setError(null);
    setLines([]);
    setAnswers({});
    setLeadId(null);
    setEnded(false);
    sessionStateRef.current = null;
    const data = await post({});
    setLoading(false);
    if (!data) return;
    applyResult(data, false);
  }

  async function send() {
    const message = input.trim();
    if (!message || loading) return;
    setInput("");
    setLines((prev) => [...prev, { role: "user", message }]);
    setLoading(true);
    setError(null);
    const data = await post({ sessionState: sessionStateRef.current, message });
    setLoading(false);
    if (!data) return;
    applyResult(data, true);
  }

  /** Mirrors an actual keypress — resolved via the state's DTMF map, never
   *  the model, same as a real phone call (never a "the caller said X" line
   *  in engine.ts's own transcript, so shown here as a distinct pill instead
   *  of a chat bubble). */
  async function pressDigit(digit: string) {
    if (loading) return;
    setLines((prev) => [...prev, { role: "user", message: `keypad: ${digit}` }]);
    setLoading(true);
    setError(null);
    const data = await post({ sessionState: sessionStateRef.current, dtmf: digit });
    setLoading(false);
    if (!data) return;
    applyResult(data, true);
  }

  function endCall() {
    sessionStateRef.current = null;
    setStarted(false);
    setLines([]);
    setState(null);
    setAnswers({});
    setLeadId(null);
    setEnded(false);
    setError(null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3.5 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          {state && <Badge color={ended ? "green" : "blue"}>{ended ? "Call ended" : state}</Badge>}
        </CardHeader>
        <CardBody className="flex flex-col gap-3.5">
          {!started ? (
            <div className="text-center py-10">
              <p className="text-sm text-cv-muted mb-3.5">
                Simulates an inbound overflow call to {businessName}. Type what a caller would say — the same engine,
                classification model, and lead-scoring pipeline as a real phone call runs underneath.
              </p>
              <Button variant="primary" onClick={startCall} disabled={loading}>
                <Icon name="play_arrow" />
                {loading ? "Starting…" : "Start test call"}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
                {lines.map((line, i) => {
                  const isKeypad = line.role === "user" && line.message.startsWith("keypad: ");
                  return (
                    <div key={i} className={`flex ${line.role === "assistant" ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[80%] rounded-[12px] px-3.5 py-2.5 text-sm leading-relaxed ${
                          line.role === "assistant"
                            ? "bg-cv-surface-subtle text-cv-ink"
                            : isKeypad
                              ? "bg-cv-gray-soft text-[#475467] font-mono tracking-wide"
                              : "bg-cv-primary text-white"
                        }`}
                      >
                        {isKeypad ? `⌨ ${line.message.replace("keypad: ", "")}` : line.message}
                      </div>
                    </div>
                  );
                })}
                {loading && <div className="text-xs text-cv-muted px-1">thinking…</div>}
              </div>

              {leadId && (
                <div className="rounded-[9px] border border-cv-green-soft bg-cv-green-soft/40 px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm text-cv-ink">Lead captured from this test call.</span>
                  <Link href={`/dashboard/leads/${leadId}`} className="text-sm font-bold text-cv-primary hover:underline">
                    View lead →
                  </Link>
                </div>
              )}

              {!ended ? (
                <>
                  <div className="flex gap-2">
                    <Field
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      placeholder="Type what the caller says…"
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button variant="primary" onClick={send} disabled={loading || !input.trim()}>
                      Send
                    </Button>
                  </div>

                  <div>
                    <div className="text-[10px] tracking-wide uppercase text-cv-muted font-semibold mb-1.5">
                      Or press a key, like a real caller would
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 max-w-[200px]">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
                        <button
                          key={digit}
                          onClick={() => pressDigit(digit)}
                          disabled={loading}
                          className="h-10 rounded-[9px] border border-cv-border-strong bg-cv-surface text-sm font-bold text-cv-ink hover:bg-cv-surface-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {digit}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Button variant="default" onClick={startCall} disabled={loading}>
                  <Icon name="replay" />
                  Start another test call
                </Button>
              )}

              <button onClick={endCall} className="text-xs text-cv-muted hover:text-cv-ink self-start">
                End this test call
              </button>
            </>
          )}
          {error && <p className="text-sm text-cv-red">{error}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3.5">
          <div>
            <div className="text-[10px] tracking-wide uppercase text-cv-muted font-semibold mb-1.5">Current state</div>
            <div className="text-sm text-cv-ink">{state ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wide uppercase text-cv-muted font-semibold mb-1.5">Answers collected</div>
            {Object.keys(answers).length === 0 ? (
              <div className="text-sm text-cv-muted">None yet</div>
            ) : (
              <dl className="text-sm space-y-1">
                {Object.entries(answers).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <dt className="text-cv-muted">{key}</dt>
                    <dd className="font-medium text-cv-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <p className="text-xs text-cv-muted leading-relaxed border-t border-cv-border pt-3">
            Free text mimics what a caller says (goes through the same classification model as a real call); the
            keypad mimics what a caller presses (resolved by code, same as real DTMF — never touches the model).
            Still no real audio or VAD/interrupt timing here. Leads created are tagged as test leads and won&apos;t
            trigger an email notification.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
