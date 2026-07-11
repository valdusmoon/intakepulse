"use client";

import { useEffect, useRef, useState } from "react";

interface Line {
  role: "user" | "assistant";
  message: string;
}

interface Packet {
  tier: string;
  leadScore: number;
  estimatedValue: string;
  recommendedAction: string;
  details: { label: string; value: string }[];
}

interface TurnResponse {
  sessionState: unknown | null;
  lines: Line[];
  state: string;
  ended: boolean;
  packet: Packet | null;
  error?: string;
}

const KEYPAD_RE = /^[0-9*#]+$/;
const KEYPAD_TAG = "keypad: ";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

const SAMPLES = [
  "My basement is flooding from a burst dishwasher line. It started this morning and it is already in three rooms.",
  "I have smoke damage in my kitchen from a fire last night. It is an emergency.",
  "There is mold spreading in my bathroom, but it is not urgent.",
];

const TIER_COLOR: Record<string, string> = {
  Hot: "bg-[#ff5a4d]/15 text-[#ff8177] border-[#ff5a4d]/30",
  Warm: "bg-[#ffb020]/15 text-[#ffca6a] border-[#ffb020]/30",
  Cool: "bg-white/10 text-white/70 border-white/15",
};

export function InteractiveDemo() {
  const [started, setStarted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [ended, setEnded] = useState(false);
  const [packet, setPacket] = useState<Packet | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  const sessionStateRef = useRef<unknown | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, loading, packet]);

  async function post(bodyObj: Record<string, unknown>): Promise<TurnResponse | null> {
    const res = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return null;
    }
    return data as TurnResponse;
  }

  function apply(data: TurnResponse, append: boolean) {
    sessionStateRef.current = data.sessionState;
    setStarted(true);
    setLines((prev) => (append ? [...prev, ...data.lines] : data.lines));
    setEnded(data.ended);
    setPacket(data.packet);
  }

  async function start(): Promise<boolean> {
    setLoading(true);
    setError(null);
    setLines([]);
    setEnded(false);
    setPacket(null);
    setShowKeys(false);
    sessionStateRef.current = null;
    const data = await post({});
    setLoading(false);
    if (!data) return false;
    apply(data, false);
    return true;
  }

  async function sendSpeech(text: string) {
    setLines((prev) => [...prev, { role: "user", message: text }]);
    setLoading(true);
    setError(null);
    const data = await post({ sessionState: sessionStateRef.current, message: text });
    setLoading(false);
    if (data) apply(data, true);
  }

  async function sendDtmf(digits: string) {
    setLines((prev) => [...prev, { role: "user", message: `${KEYPAD_TAG}${digits}` }]);
    setLoading(true);
    setError(null);
    const data = await post({ sessionState: sessionStateRef.current, dtmf: digits });
    setLoading(false);
    if (data) apply(data, true);
  }

  function submit() {
    const raw = input.trim();
    if (!raw || loading) return;
    setInput("");
    if (KEYPAD_RE.test(raw)) void sendDtmf(raw);
    else void sendSpeech(raw);
  }

  async function runSample(text: string) {
    if (loading) return;
    const ok = await start();
    if (ok) await sendSpeech(text);
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 sm:p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
      {/* header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-landing-primary/20 text-landing-primary-glow">
          <span className="h-2.5 w-2.5 rounded-full bg-landing-primary-glow animate-pulse" />
        </span>
        <div className="min-w-0">
          <p className="font-cv-heading text-[15px] font-bold leading-tight">Live intake, sandboxed</p>
          <p className="text-[11px] text-white/45">No signup. Nothing is sent to a real business.</p>
        </div>
        {started && !loading && (
          <button
            onClick={start}
            className="ml-auto text-[11px] font-semibold text-white/50 hover:text-white transition-colors"
          >
            Restart
          </button>
        )}
      </div>

      {!started ? (
        <div className="py-6 text-center">
          <p className="text-white/70 text-sm max-w-md mx-auto mb-5 leading-relaxed">
            Describe a service problem in your own words, the way a panicked homeowner would. Callverted captures the
            important details, asks only what is missing, and builds the lead packet a business would receive.
          </p>
          <button
            onClick={start}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-landing-primary px-6 py-3 text-sm font-bold text-white hover:brightness-110 transition disabled:opacity-60"
          >
            {loading ? "Starting..." : "Start the demo"}
          </button>
          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-widest text-white/35 font-semibold mb-2">Or try an example</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SAMPLES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => runSample(s)}
                  disabled={loading}
                  className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-50 max-w-[220px] truncate"
                  title={s}
                >
                  {i === 0 ? "Burst pipe, 3 rooms" : i === 1 ? "Kitchen fire, emergency" : "Mold, not urgent"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1">
            {lines.map((line, i) => {
              const isKeypad = line.role === "user" && line.message.startsWith(KEYPAD_TAG);
              if (isKeypad) {
                return (
                  <div key={i} className="flex justify-center">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/60">
                      Pressed {line.message.replace(KEYPAD_TAG, "")}
                    </span>
                  </div>
                );
              }
              return (
                <div key={i} className={`flex ${line.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                      line.role === "assistant"
                        ? "bg-white/[0.07] text-white/85 rounded-bl-sm"
                        : "bg-landing-primary text-white rounded-br-sm"
                    }`}
                  >
                    {line.message}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/[0.07] px-3.5 py-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce" />
                </div>
              </div>
            )}

            {packet && <PacketCard packet={packet} />}
          </div>

          {!ended && (
            <div className="mt-3.5">
              {showKeys && (
                <div className="mb-2.5 grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-black/20 p-2">
                  {KEYS.map((d) => (
                    <button
                      key={d}
                      onClick={() => sendDtmf(d)}
                      disabled={loading}
                      className="h-9 rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-white/80 hover:bg-white/10 disabled:opacity-40 transition"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKeys((v) => !v)}
                  title="Keypad"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg font-bold transition ${
                    showKeys ? "border-landing-primary bg-landing-primary text-white" : "border-white/12 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  #
                </button>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="Type your answer, or digits for the keypad..."
                  disabled={loading}
                  className="h-10 flex-1 rounded-xl border border-white/12 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-landing-primary/60 disabled:opacity-60"
                />
                <button
                  onClick={submit}
                  disabled={loading || !input.trim()}
                  className="h-10 shrink-0 rounded-xl bg-landing-primary px-4 text-sm font-bold text-white hover:brightness-110 transition disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {ended && (
            <button
              onClick={start}
              disabled={loading}
              className="mt-3.5 w-full rounded-xl border border-white/12 bg-white/5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
            >
              Run another
            </button>
          )}

          {error && <p className="mt-3 text-[13px] text-[#ff8177]">{error}</p>}
        </>
      )}
    </div>
  );
}

function PacketCard({ packet }: { packet: Packet }) {
  return (
    <div className="mt-1.5 rounded-2xl border border-landing-primary/25 bg-landing-primary/[0.06] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] uppercase tracking-widest text-landing-primary-glow font-bold">Lead packet</p>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${TIER_COLOR[packet.tier] ?? TIER_COLOR.Cool}`}>
          {packet.tier} lead
        </span>
      </div>

      <dl className="space-y-1.5 mb-3">
        {packet.details.map((d) => (
          <div key={d.label} className="flex justify-between gap-3 text-[13px]">
            <dt className="text-white/45">{d.label}</dt>
            <dd className="font-semibold text-white/90 text-right">{d.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-2 gap-2.5 border-t border-white/10 pt-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Est. value</p>
          <p className="font-cv-heading text-lg font-bold text-white">{packet.estimatedValue}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Lead score</p>
          <p className="font-cv-heading text-lg font-bold text-white">{packet.leadScore}/100</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-landing-primary-glow" />
        <p className="text-[13px] font-semibold text-white/85">{packet.recommendedAction}</p>
      </div>
    </div>
  );
}
