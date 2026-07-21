"use client";

import { useEffect, useRef, useState } from "react";

/**
 * V3 — "Or let it call you", the second proof beat.
 *
 * Retell's page converts on the fact that the visitor's own phone rings, which
 * turns a claim into an experience they can't argue with. This is that widget's
 * layout, sitting under the transcript so a skeptic has two ways to verify
 * before the page starts arguing.
 *
 * MOCKED ON PURPOSE. Nothing here touches the network. It walks the visible
 * states a real outbound demo would (connecting → ringing → lead delivered) so
 * the layout can be judged with the interaction in place, and it says so on the
 * card. Wiring it to the real voice stack is a separate job.
 */

const TRADES = [
  {
    id: "restoration",
    name: "Restoration",
    service: "Water damage · burst supply line",
    value: "$1.8k – $3.2k",
    urgency: "Emergency",
    tier: "Hot",
    score: 92,
    next: "Call within 10 minutes",
  },
  {
    id: "hvac",
    name: "HVAC",
    service: "No heat · furnace down",
    value: "$450 – $1.4k",
    urgency: "Emergency",
    tier: "Hot",
    score: 88,
    next: "Call within 10 minutes",
  },
  {
    id: "plumbing",
    name: "Plumbing",
    service: "Burst supply line · shutoff done",
    value: "$600 – $2.1k",
    urgency: "Emergency",
    tier: "Hot",
    score: 90,
    next: "Call within 10 minutes",
  },
  {
    id: "electrical",
    name: "Electrical",
    service: "Panel arcing · power isolated",
    value: "$500 – $1.8k",
    urgency: "Emergency",
    tier: "Hot",
    score: 94,
    next: "Call within 10 minutes",
  },
  {
    id: "general",
    name: "General contracting",
    service: "Roof leak · interior damage",
    value: "$2.4k – $6.0k",
    urgency: "Urgent",
    tier: "Warm",
    score: 61,
    next: "Call back today",
  },
] as const;

type Phase = "idle" | "connecting" | "ringing" | "delivered";

const STATUS: Record<Exclude<Phase, "idle">, string> = {
  connecting: "Connecting…",
  ringing: "Your phone is ringing",
  delivered: "Call complete. Here's what the owner got.",
};

export function V3CallMeDemo() {
  const [tradeId, setTradeId] = useState<string>(TRADES[0].id);
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const trade = TRADES.find((t) => t.id === tradeId) ?? TRADES[0];
  const running = phase !== "idle";
  const hot = trade.tier === "Hot";

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  function start(e: React.FormEvent) {
    e.preventDefault();
    if (running) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("connecting");
    timers.current.push(setTimeout(() => setPhase("ringing"), 1500));
    timers.current.push(setTimeout(() => setPhase("delivered"), 4200));
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("idle");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
      {/* ── The form ─────────────────────────────────────────────────────── */}
      <form
        onSubmit={start}
        className="rounded-3xl border border-[#e3e7ed] bg-white p-5 sm:p-7 shadow-[0_24px_60px_-32px_rgba(16,24,40,0.35)]"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-landing-primary mb-2">Try it on your phone</p>
        <h3 className="font-cv-heading text-[22px] sm:text-[26px] font-bold tracking-[-0.03em] leading-tight text-[#152033] mb-2">
          Or let it call you.
        </h3>
        <p className="text-[14px] text-[#667085] leading-relaxed mb-6">
          Pick your trade, and Callverted runs the intake it would run for your business. You play the customer. The
          lead it builds shows up beside you.
        </p>

        <label className="block mb-4">
          <span className="mb-1.5 block text-[12px] font-semibold text-[#344054]">Your trade</span>
          <select
            value={tradeId}
            onChange={(e) => setTradeId(e.target.value)}
            disabled={running}
            className="w-full appearance-none rounded-xl border border-[#e3e7ed] bg-white px-3.5 py-3 text-[14px] font-medium text-[#152033] outline-none transition-colors focus:border-landing-primary disabled:bg-[#f9fafb] disabled:text-[#98a2b3]"
          >
            {TRADES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-5">
          <span className="mb-1.5 block text-[12px] font-semibold text-[#344054]">Your mobile number</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={running}
            placeholder="(555) 123-4567"
            className="w-full rounded-xl border border-[#e3e7ed] bg-white px-3.5 py-3 text-[14px] text-[#152033] outline-none transition-colors placeholder:text-[#c1c8d3] focus:border-landing-primary disabled:bg-[#f9fafb]"
          />
        </label>

        {phase === "delivered" ? (
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl border border-[#e3e7ed] bg-white py-3.5 text-[15px] font-semibold text-[#344054] transition-colors hover:bg-[#f9fafb]"
          >
            Run it again
          </button>
        ) : (
          <button
            type="submit"
            disabled={running}
            className="w-full rounded-xl bg-landing-primary py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_12px_30px_-10px_rgba(36,84,216,0.6)]"
          >
            {running ? STATUS[phase] : "Call me now"}
          </button>
        )}

        <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#fffaf0] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#8a6d3b]">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 17.4A1.9 1.9 0 0 0 4 20.3h16a1.9 1.9 0 0 0 1.6-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0z" />
          </svg>
          <span>
            Draft mockup. This form is not wired up: it plays the states a real outbound demo would, and never dials
            anyone or sends your number anywhere.
          </span>
        </p>
      </form>

      {/* ── The result ───────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-center rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-5 sm:p-7">
        {/* status rail */}
        <div className="flex items-center gap-2.5 mb-5">
          {(["connecting", "ringing", "delivered"] as const).map((p, i) => {
            const order: Phase[] = ["idle", "connecting", "ringing", "delivered"];
            const on = order.indexOf(phase) >= i + 1;
            return (
              <span
                key={p}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${on ? "bg-landing-primary" : "bg-[#e3e7ed]"}`}
              />
            );
          })}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest text-[#98a2b3] mb-4" aria-live="polite">
          {phase === "idle" ? "Waiting to start" : STATUS[phase]}
        </p>

        {phase !== "delivered" ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <span
              className={`grid h-16 w-16 place-items-center rounded-full transition-colors ${
                phase === "ringing" ? "bg-landing-primary text-white animate-pulse" : "bg-white text-[#c1c8d3] border border-[#e3e7ed]"
              }`}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" />
              </svg>
            </span>
            <p className="mt-4 max-w-[240px] text-[13.5px] leading-relaxed text-[#667085]">
              {phase === "idle"
                ? "The lead packet your office would receive appears here once the call ends."
                : "Answer, describe the job the way a customer would, and hang up."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e3e7ed] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-landing-primary">New lead</p>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  hot ? "bg-[#fff1f0] text-[#e5484d]" : "bg-[#fff8e6] text-[#b7791f]"
                }`}
              >
                {trade.tier} · {trade.score}
              </span>
            </div>
            <p className="font-cv-heading text-[16px] font-bold leading-tight text-[#152033]">{trade.service}</p>
            <p className="text-[12.5px] text-[#667085] mt-1">
              {trade.urgency} · In your area · Est. value {trade.value}
            </p>
            <div className="mt-4 rounded-lg bg-[#eef3ff] px-3 py-2.5">
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-landing-primary/70">Next action</p>
              <p className="text-[13px] font-bold text-landing-primary">{trade.next}</p>
            </div>
            <p className="mt-4 pt-3.5 border-t border-[#eef1f4] text-[11.5px] leading-relaxed text-[#667085]">
              Same record whether the job arrived by phone, website widget, or intake link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
