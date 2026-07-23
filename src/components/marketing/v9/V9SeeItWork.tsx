"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * V9SeeItWork — the "See a lead get ranked" demo for /v9 (blunt-simplicity build).
 *
 * Forked from v8/V8SeeItWork.tsx. The MECHANIC is unchanged — three tabs, each a
 * materially different intake experience on the left, all feeding ONE structurally
 * identical output packet on the right:
 *   1. Missed call    → a live VOICE CONVERSATION (chat bubbles revealed in sequence)
 *   2. Answered call  → a BACKGROUND-CAPTURE view (call header + running timer + waveform;
 *                       your team speaks, Callverted is not a speaker)
 *   3. Website inquiry→ a real WEBSITE INTAKE WIDGET (chips auto-select, ZIP auto-fills,
 *                       free-text auto-types, Send auto-presses; no transcript)
 *
 * Same underlying scenarios and scores as v8 (water-heater burst → Hot 92; HVAC
 * no-cool, team answered → Warm 54; bathroom remodel website inquiry → Warm, no
 * numeric score). Autoplays the active tab once on scroll-in; switching tabs or the
 * Replay button resets and replays; prefers-reduced-motion renders the final state.
 *
 * What changed vs v8: renamed; the copy around the demo is reframed to the blunter v9
 * wording — each tab now carries a one-line description (the spec's simpler per-tab
 * copy) shown under the tab strip, and the framing caption reads "Same result every
 * time: Job packet · Hot / Warm / Cool · Recommended callback action." Styled for the
 * one dark accent band on the otherwise-light /v9 page (#0a0f1c). Illustrative content.
 */

type Tier = "Hot" | "Warm";
type Kind = "voice" | "captured" | "form";
type Speaker = "cv" | "employee" | "caller";

interface Field {
  label: string;
  value: string;
  /** Field unlocks once `step` passes this reveal index. */
  after: number;
  danger?: boolean;
}

interface Turn {
  who: Speaker;
  text: string;
}

interface FormConfig {
  serviceChips: string[];
  serviceSelect: string;
  timingChips: string[];
  timingSelect: string;
  zip: string;
  freeText: string;
}

interface Example {
  id: string;
  tab: string;
  /** Blunt one-line description of what this channel does (shown under the tabs). */
  blurb: string;
  kind: Kind;
  callerLabel: string;
  turns?: Turn[];
  form?: FormConfig;
  fields: Field[];
  tier: Tier;
  score: number | null;
  action: string;
  badge: string;
}

const WHO_LABEL: Record<Speaker, string> = {
  cv: "Callverted",
  employee: "Mike · your team",
  caller: "Caller",
};

const EXAMPLES: Example[] = [
  {
    id: "missed",
    tab: "Missed call",
    blurb: "Callverted answers, asks the right questions, and captures the job.",
    kind: "voice",
    callerLabel: "Caller",
    turns: [
      { who: "cv", text: "Thanks for calling Blue Star. The team is out on a job, so I'll grab the details. What's going on?" },
      { who: "caller", text: "My water heater just burst. The basement is flooding." },
      { who: "cv", text: "What ZIP are you in, and have you found the shutoff?" },
      { who: "caller", text: "33618. I can't find it." },
    ],
    fields: [
      { label: "Service", value: "Water damage", after: 1 },
      { label: "Urgency", value: "Emergency", after: 1, danger: true },
      { label: "ZIP", value: "33618", after: 3 },
      { label: "Shutoff", value: "Not located", after: 3 },
      { label: "Est. value", value: "$1.8k–$3.2k", after: 3 },
    ],
    tier: "Hot",
    score: 92,
    action: "Call back now",
    badge: "Nobody picked up. Callverted answered in 14 seconds.",
  },
  {
    id: "answered",
    tab: "Answered call",
    blurb: "Your team talks. Callverted captures, summarizes, and scores in the background.",
    kind: "captured",
    callerLabel: "Caller",
    turns: [
      { who: "employee", text: "Blue Star, this is Mike." },
      { who: "caller", text: "Our AC quit and the house will not cool down. The system is about twelve years old." },
      { who: "employee", text: "I can get someone out this week. Let me take your details." },
    ],
    fields: [
      { label: "Service", value: "HVAC repair", after: 1 },
      { label: "System age", value: "12 years", after: 1 },
      { label: "Timing", value: "This week", after: 2 },
    ],
    tier: "Warm",
    score: 54,
    action: "Follow up today",
    badge: "Your team handled the call. Callverted captured and scored it automatically.",
  },
  {
    id: "website",
    tab: "Website inquiry",
    blurb: "The customer uses a short guided intake with multiple choice and one free-text answer.",
    kind: "form",
    callerLabel: "Website inquiry",
    form: {
      serviceChips: ["Emergency repair", "New installation", "Replacement", "Estimate or quote"],
      serviceSelect: "Estimate or quote",
      timingChips: ["Immediately", "Today", "This week", "Flexible"],
      timingSelect: "Flexible",
      zip: "33607",
      freeText: "Need a quote to remodel a bathroom. Timeline is flexible.",
    },
    fields: [
      { label: "Service", value: "Bathroom remodel", after: 3 },
      { label: "Timeline", value: "Flexible", after: 1 },
      { label: "Est. value", value: "$6k–$12k", after: 4 },
    ],
    tier: "Warm",
    score: null,
    action: "Call within the hour",
    badge: "Submitted through your website intake widget.",
  },
];

const TIER: Record<Tier, { chip: string; dot: string; text: string }> = {
  Hot: {
    chip: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    dot: "bg-amber-400",
    text: "text-amber-300",
  },
  Warm: {
    chip: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    dot: "bg-sky-400",
    text: "text-sky-300",
  },
};

const FINAL_CALL_SECS = 71;
const TYPE_MS = 26;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

const durationOf = (text: string) => Math.min(1700, 540 + text.length * 12);

/** Reveal steps for the active example (transcript turns, or 5 form actions). */
const revealsOf = (ex: Example) => (ex.kind === "form" ? 5 : ex.turns?.length ?? 0);

function beatDuration(ex: Example, step: number): number {
  if (ex.kind === "form") {
    const full = ex.form?.freeText ?? "";
    const arr = [760, 760, 820, Math.min(2600, full.length * TYPE_MS + 520), 880, 700];
    return arr[step] ?? 700;
  }
  const turns = ex.turns ?? [];
  if (step < turns.length) return durationOf(turns[step].text);
  return 700;
}

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ── Icons ──────────────────────────────────────────────────────────────── */

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1.5" />
      <rect x="14" y="4" width="4" height="16" rx="1.5" />
    </svg>
  );
}
function ReplayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12a8 8 0 1 1 2.3 5.7" />
      <path d="M4 17v-5h5" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21C9.5 18.4 8.2 15.3 8.2 12S9.5 5.6 12 3z" />
    </svg>
  );
}

/* ── Shared bits ────────────────────────────────────────────────────────── */

function SpeakingDots({ align }: { align: "left" | "right" }) {
  return (
    <div className={align === "right" ? "flex justify-end" : ""}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </span>
    </div>
  );
}

function Transport({
  playing,
  onToggle,
  progress,
  label,
}: {
  playing: boolean;
  onToggle: () => void;
  progress: number;
  label: string;
}) {
  return (
    <div className="mt-auto flex items-center gap-3 border-t border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5">
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? "Pause" : "Play"}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#0a0f1c] transition hover:bg-white/85"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-landing-primary-glow transition-[width] duration-500 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </span>
      <span className="font-cv-mono shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </span>
    </div>
  );
}

/* ── Left panel: Tab 1 — live voice conversation ────────────────────────── */

function VoiceBody({
  turns,
  revealed,
  speakingWho,
}: {
  turns: Turn[];
  revealed: number;
  speakingWho: Speaker | null;
}) {
  const isLeft = (who: Speaker) => who === "cv";
  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-landing-primary/25 text-landing-primary-glow ring-1 ring-landing-primary/30">
          <PhoneIcon />
        </span>
        <div className="min-w-0">
          <p className="font-cv-heading text-[13.5px] font-bold leading-tight text-white">Callverted · answering live</p>
          <p className="truncate text-[11px] text-white/45">Standing in for Blue Star</p>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-300 ring-1 ring-red-400/25">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          Live
        </span>
      </div>

      <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2 sm:px-5">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/45">
          <PhoneIcon />
          Your team rang first · no answer · Callverted picked up after ~15s
        </p>
      </div>

      <div className="min-h-[280px] flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite">
        {turns.slice(0, revealed).map((t, i) => (
          <div key={`v-${i}`} className={`cv-replay-in flex flex-col ${isLeft(t.who) ? "items-start" : "items-end"}`}>
            <p className={`mb-1 text-[9.5px] font-bold uppercase tracking-[0.14em] ${isLeft(t.who) ? "text-landing-primary-glow" : "text-white/40"}`}>
              {isLeft(t.who) ? WHO_LABEL.cv : "Caller"}
            </p>
            <p
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                isLeft(t.who)
                  ? "rounded-tl-sm bg-landing-primary/20 text-white ring-1 ring-landing-primary/25"
                  : "rounded-tr-sm bg-white/10 text-white/85"
              }`}
            >
              {t.text}
            </p>
          </div>
        ))}
        {speakingWho && <SpeakingDots align={isLeft(speakingWho) ? "left" : "right"} />}
      </div>
    </>
  );
}

/* ── Left panel: Tab 2 — background-captured answered call ──────────────── */

const WAVE_BARS = Array.from({ length: 30 }, (_, i) => 22 + ((i * 53) % 62));

function CapturedBody({
  turns,
  revealed,
  speakingWho,
  callSecs,
  active,
}: {
  turns: Turn[];
  revealed: number;
  speakingWho: Speaker | null;
  callSecs: number;
  active: boolean;
}) {
  const label = (who: Speaker) => (who === "employee" ? WHO_LABEL.employee : WHO_LABEL.caller);
  return (
    <>
      {/* Call header — caller label + running timer */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/25">
          <PhoneIcon />
        </span>
        <div className="min-w-0">
          <p className="font-cv-heading text-[13.5px] font-bold leading-tight text-white">Call in progress</p>
          <p className="truncate text-[11px] text-white/45">Inbound · Blue Star</p>
        </div>
        <span className="font-cv-mono ml-auto shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-bold text-emerald-300 ring-1 ring-white/10">
          {fmtClock(callSecs)}
        </span>
      </div>

      {/* Waveform + "capturing in the background" status */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5">
        <span className="flex h-7 flex-1 items-center gap-[3px] overflow-hidden" aria-hidden>
          {WAVE_BARS.map((h, i) => (
            <span
              key={i}
              className="cv-wave-bar h-full"
              style={{
                height: `${h}%`,
                animationDelay: `${(i % 8) * 0.11}s`,
                animationPlayState: active ? "running" : "paused",
                opacity: active ? 1 : 0.45,
              }}
            />
          ))}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-landing-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-landing-primary-glow ring-1 ring-landing-primary/25">
          <span className="h-1.5 w-1.5 rounded-full bg-landing-primary-glow animate-pulse" />
          Callverted · capturing
        </span>
      </div>

      <div className="min-h-[220px] flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite">
        <p className="text-center text-[10.5px] font-medium text-white/35">Captured in the background — your team is on the line</p>
        {turns.slice(0, revealed).map((t, i) => (
          <div key={`c-${i}`} className={`cv-replay-in flex flex-col ${t.who === "employee" ? "items-start" : "items-end"}`}>
            <p className={`mb-1 text-[9.5px] font-bold uppercase tracking-[0.14em] ${t.who === "employee" ? "text-emerald-300/80" : "text-white/40"}`}>
              {label(t.who)}
            </p>
            <p
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                t.who === "employee"
                  ? "rounded-tl-sm bg-white/10 text-white/90"
                  : "rounded-tr-sm bg-white/[0.06] text-white/80 ring-1 ring-white/10"
              }`}
            >
              {t.text}
            </p>
          </div>
        ))}
        {speakingWho && <SpeakingDots align={speakingWho === "employee" ? "left" : "right"} />}
      </div>
    </>
  );
}

/* ── Left panel: Tab 3 — website intake widget ──────────────────────────── */

function Chip({ label, selected, arming }: { label: string; selected: boolean; arming: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-300 ${
        selected
          ? "bg-landing-primary text-white ring-1 ring-landing-primary-glow/40"
          : arming
            ? "bg-white/10 text-white/70 ring-1 ring-landing-primary-glow/40"
            : "bg-white/[0.06] text-white/55 ring-1 ring-white/10"
      }`}
    >
      {selected && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      )}
      {label}
    </span>
  );
}

function FormBody({ form, step, typed }: { form: FormConfig; step: number; typed: string }) {
  const serviceOn = step > 0;
  const timingOn = step > 1;
  const zipFilled = step > 2;
  const zipArming = step === 2;
  const typing = step === 3 && typed.length < form.freeText.length;
  const submitted = step > 4;
  const submitting = step === 4;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-landing-primary-glow ring-1 ring-white/10">
          <GlobeIcon />
        </span>
        <div className="min-w-0">
          <p className="font-cv-heading text-[13.5px] font-bold leading-tight text-white">Request service</p>
          <p className="truncate text-[11px] text-white/45">Blue Star · website intake widget</p>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/60 ring-1 ring-white/10">
          <GlobeIcon />
          Website
        </span>
      </div>

      <div className="min-h-[280px] flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold text-white/55">What do you need help with?</p>
          <div className="flex flex-wrap gap-2">
            {form.serviceChips.map((c) => (
              <Chip key={c} label={c} selected={serviceOn && c === form.serviceSelect} arming={!serviceOn && c === form.serviceSelect} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold text-white/55">When do you need service?</p>
          <div className="flex flex-wrap gap-2">
            {form.timingChips.map((c) => (
              <Chip key={c} label={c} selected={timingOn && c === form.timingSelect} arming={serviceOn && !timingOn && c === form.timingSelect} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold text-white/55">Where is the job?</p>
          <div
            className={`flex items-center rounded-xl border px-3.5 py-2.5 text-[13px] transition-all duration-300 ${
              zipFilled
                ? "border-white/15 bg-white/[0.06] text-white"
                : zipArming
                  ? "border-landing-primary-glow/50 bg-white/[0.04] text-white/40"
                  : "border-white/10 bg-white/[0.02] text-white/30"
            }`}
          >
            {zipFilled ? <span className="font-cv-mono font-semibold tracking-wide">{form.zip}</span> : "ZIP code"}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold text-white/55">Tell us what is going on</p>
          <div className="min-h-[64px] rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3 text-[13px] leading-relaxed text-white/85">
            {typed || <span className="text-white/30">Type your request…</span>}
            {typing && <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-landing-primary-glow animate-pulse" aria-hidden />}
          </div>
        </div>

        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className={`w-full rounded-xl px-4 py-3 text-[13.5px] font-bold transition-all duration-300 ${
            submitted
              ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
              : submitting
                ? "scale-[0.98] bg-landing-primary/80 text-white"
                : "bg-landing-primary text-white shadow-[0_10px_28px_-12px_rgba(36,84,216,0.8)]"
          }`}
        >
          {submitted ? "Request sent ✓" : "Send request"}
        </button>
      </div>
    </>
  );
}

/* ── Right panel: the standardized output packet ────────────────────────── */

function Packet({
  ex,
  step,
  scored,
  count,
}: {
  ex: Example;
  step: number;
  scored: boolean;
  count: number;
}) {
  const tone = TIER[ex.tier];
  const filled = ex.fields.filter((f) => step > f.after).length;

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-cv-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-landing-primary-glow">Lead record</p>
        <span className="font-cv-mono text-[11px] font-semibold text-white/40">
          {filled}/{ex.fields.length}
        </span>
      </div>

      <ul className="space-y-2">
        {ex.fields.map((f) => {
          const on = step > f.after;
          return (
            <li
              key={f.label}
              className={`rounded-xl border px-3.5 py-2.5 transition-all duration-500 ${
                on ? "border-white/10 bg-white/[0.05] opacity-100" : "translate-y-0.5 border-white/5 bg-white/[0.02] opacity-45"
              }`}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">{f.label}</p>
              {on ? (
                <p className={`font-cv-heading text-[14.5px] font-bold leading-tight ${f.danger ? "text-amber-300" : "text-white"}`}>
                  {f.value}
                </p>
              ) : (
                <span className="mt-1.5 block h-3 w-2/3 rounded-full bg-white/10" aria-hidden />
              )}
            </li>
          );
        })}
      </ul>

      {/* Outcome — assembles when scoring completes */}
      <div className={`mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-500 ${scored ? "opacity-100" : "translate-y-1 opacity-40"}`}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-cv-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">Outcome</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10.5px] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Job
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold ${tone.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {ex.tier}
          </span>
          {ex.score !== null && (
            <span className="flex items-baseline gap-1.5">
              <span className={`font-cv-heading text-[30px] font-black leading-none tabular-nums ${tone.text}`}>
                {scored ? count : ex.score}
              </span>
              <span className="font-cv-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">score</span>
            </span>
          )}
        </div>

        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="font-cv-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">Recommended action</p>
          <p className={`font-cv-heading text-[18px] font-bold leading-tight ${scored ? tone.text : "text-white/40"}`}>
            {scored ? ex.action : "Scoring…"}
          </p>
        </div>
      </div>

      <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[12px] font-medium leading-relaxed text-white/60">
        {ex.badge}
      </p>
    </div>
  );
}

/* ── Root ───────────────────────────────────────────────────────────────── */

export function V9SeeItWork() {
  const [activeIdx, setActiveIdx] = useState(0);
  const ex = EXAMPLES[activeIdx];
  const reveals = revealsOf(ex);
  const TOTAL = reveals + 1;
  const finalScore = ex.score ?? 0;

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [count, setCount] = useState(0);
  const [typed, setTyped] = useState("");
  const [callSecs, setCallSecs] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const startedOnce = useRef(false);

  const revealed = Math.min(step, reveals);
  const scored = step > reveals;
  const speakingWho: Speaker | null =
    ex.kind !== "form" && playing && step < reveals ? ex.turns?.[step]?.who ?? null : null;

  const jumpToEnd = useCallback(() => {
    setStep(TOTAL);
    setCount(finalScore);
    setTyped(ex.form?.freeText ?? "");
    setCallSecs(FINAL_CALL_SECS);
    setPlaying(false);
  }, [TOTAL, finalScore, ex]);

  const play = useCallback(() => {
    setStep(0);
    setCount(0);
    setTyped("");
    setCallSecs(0);
    setPlaying(true);
  }, []);

  // Autoplay the first time the demo scrolls into view; reduced motion → final state.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (prefersReduced()) {
      startedOnce.current = true;
      jumpToEnd();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !startedOnce.current) {
          startedOnce.current = true;
          play();
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [jumpToEnd, play]);

  // Replay whenever the active tab changes (after the first view has kicked off).
  useEffect(() => {
    if (!startedOnce.current) return;
    if (prefersReduced()) jumpToEnd();
    else play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // Beat clock: one timer per step, re-armed as `step` advances.
  useEffect(() => {
    if (!playing) return;
    if (step >= TOTAL) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), beatDuration(ex, step));
    return () => clearTimeout(id);
  }, [playing, step, TOTAL, ex]);

  // Count the score up once the scoring beat lands.
  useEffect(() => {
    if (!scored || ex.score === null) return;
    if (count >= finalScore) return;
    const id = setTimeout(() => setCount((c) => Math.min(finalScore, c + 4)), 26);
    return () => clearTimeout(id);
  }, [scored, count, finalScore, ex]);

  // Auto-type the website free-text field while its beat is active.
  useEffect(() => {
    if (ex.kind !== "form") return;
    const full = ex.form?.freeText ?? "";
    if (step < 3) {
      if (typed !== "") setTyped("");
      return;
    }
    if (step > 3) {
      if (typed !== full) setTyped(full);
      return;
    }
    // step === 3: type char by char while playing.
    if (!playing || typed.length >= full.length) return;
    const id = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), TYPE_MS);
    return () => clearTimeout(id);
  }, [ex, step, typed, playing]);

  // Running call timer for the background-capture tab.
  useEffect(() => {
    if (ex.kind !== "captured" || !playing || step >= TOTAL) return;
    const id = setTimeout(() => setCallSecs((s) => s + 1), 1000);
    return () => clearTimeout(id);
  }, [ex, playing, step, TOTAL, callSecs]);

  const selectTab = (idx: number) => {
    if (idx === activeIdx) return;
    setStep(0);
    setCount(0);
    setTyped("");
    setCallSecs(0);
    setPlaying(false);
    setActiveIdx(idx);
  };

  const onTransport = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (step >= TOTAL) play();
    else setPlaying(true);
  };

  const progress = Math.min(100, (step / TOTAL) * 100);
  const transportLabel = scored ? "Done" : `${revealed}/${reveals}`;

  return (
    <div ref={rootRef}>
      {/* Tab selector — segmented control */}
      <div className="flex flex-col items-center gap-3">
        <div
          role="tablist"
          aria-label="Choose an intake channel"
          className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-white/10 bg-white/5 p-1"
        >
          {EXAMPLES.map((e, i) => {
            const on = i === activeIdx;
            return (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => selectTab(i)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  on ? "bg-white text-[#0a0f1c] shadow-sm" : "text-white/60 hover:text-white"
                }`}
              >
                {e.tab}
              </button>
            );
          })}
        </div>

        {/* Per-tab one-liner (the blunt v9 description of this channel) */}
        <p className="max-w-lg text-center text-[13.5px] leading-relaxed text-white/60">{ex.blurb}</p>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          <p className="font-cv-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Same result every time: Job packet · Hot / Warm / Cool · Recommended callback action
          </p>
          <button
            type="button"
            onClick={play}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ReplayIcon />
            Replay
          </button>
        </div>
      </div>

      {/* The demo: input interface (left) + standardized output packet (right).
          Stacks on mobile, two columns at lg. */}
      <div className="mt-6 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-5">
        {/* Left — the channel-specific intake experience */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          {ex.kind === "voice" && (
            <VoiceBody turns={ex.turns ?? []} revealed={revealed} speakingWho={speakingWho} />
          )}
          {ex.kind === "captured" && (
            <CapturedBody turns={ex.turns ?? []} revealed={revealed} speakingWho={speakingWho} callSecs={callSecs} active={playing && !scored} />
          )}
          {ex.kind === "form" && ex.form && <FormBody form={ex.form} step={step} typed={typed} />}

          <Transport playing={playing} onToggle={onTransport} progress={progress} label={transportLabel} />
        </div>

        {/* Right — the output packet (structurally identical across all tabs) */}
        <Packet ex={ex} step={step} scored={scored} count={count} />
      </div>
    </div>
  );
}
