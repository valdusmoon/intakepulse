"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Field, Icon } from "@/components/dashboard/v2/primitives";

interface Line {
  role: "user" | "assistant";
  message: string;
}

interface TurnResponse {
  sessionId: string;
  lines: Line[];
  state: string;
  answers: Record<string, string>;
  leadId: string | null;
  ended: boolean;
  error?: string;
}

export function TestCallClient({ businessName }: { businessName: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [state, setState] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [leadId, setLeadId] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

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

  async function startCall() {
    setLoading(true);
    setError(null);
    setLines([]);
    setAnswers({});
    setLeadId(null);
    setEnded(false);
    const data = await post({});
    setLoading(false);
    if (!data) return;
    sessionIdRef.current = data.sessionId;
    setSessionId(data.sessionId);
    setLines(data.lines);
    setState(data.state);
    setAnswers(data.answers);
    setLeadId(data.leadId);
    setEnded(data.ended);
  }

  async function send() {
    const message = input.trim();
    if (!message || !sessionIdRef.current || loading) return;
    setInput("");
    setLines((prev) => [...prev, { role: "user", message }]);
    setLoading(true);
    setError(null);
    const data = await post({ sessionId: sessionIdRef.current, message });
    setLoading(false);
    if (!data) return;
    setLines((prev) => [...prev, ...data.lines]);
    setState(data.state);
    setAnswers(data.answers);
    setLeadId(data.leadId);
    setEnded(data.ended);
  }

  async function endCall() {
    if (sessionIdRef.current) {
      await fetch("/api/test-call", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      }).catch(() => {});
    }
    sessionIdRef.current = null;
    setSessionId(null);
    setLines([]);
    setState(null);
    setAnswers({});
    setLeadId(null);
    setEnded(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3.5 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          {state && <Badge color={ended ? "green" : "blue"}>{ended ? "Call ended" : state}</Badge>}
        </CardHeader>
        <CardBody className="flex flex-col gap-3.5">
          {!sessionId ? (
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
                {lines.map((line, i) => (
                  <div key={i} className={`flex ${line.role === "assistant" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-[12px] px-3.5 py-2.5 text-sm leading-relaxed ${
                        line.role === "assistant"
                          ? "bg-cv-surface-subtle text-cv-ink"
                          : "bg-cv-primary text-white"
                      }`}
                    >
                      {line.message}
                    </div>
                  </div>
                ))}
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
            This is a text-only simulation — same conversation logic, classification, and scoring as a real call, but
            no audio, no VAD/interrupt timing, and no phone number involved. Leads created here are tagged as test
            leads and won&apos;t trigger an email notification.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
