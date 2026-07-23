"use client";

import { useEffect, useRef, useState } from "react";

/**
 * V8MediaSlot — page-scoped media helpers for /v8:
 *   - BrowserFrame: browser-chrome wrapper for the dashboard screenshot.
 *   - AudioSlot: the simple press-play placeholder (kept for parity; no real audio).
 *   - V8WaveformPlayer: the large "Hear It" player — a caller waveform, a
 *     Callverted waveform, an elapsed timer, and a transcript preview that
 *     tracks playback. Clearly labelled SAMPLE because no real recording exists
 *     yet. All motion is a faked progress timer, not real audio.
 */

// ── BrowserFrame ─────────────────────────────────────────────────────────────
export function BrowserFrame({
  children,
  url = "app.callverted.com/dashboard",
  className = "",
}: {
  children: React.ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-[#e3e7ed] bg-white shadow-[0_28px_60px_-24px_rgba(16,24,40,0.35)] ${className}`}>
      <div className="flex items-center gap-2 border-b border-[#eef1f4] bg-[#f9fafb] px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="font-cv-mono ml-2 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-[10.5px] text-[#98a2b3] ring-1 ring-[#eef1f4]">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── AudioSlot (simple placeholder, kept for parity) ──────────────────────────
const AUDIO = { fg: "#1d7a5f", bg: "#eefaf5", br: "#bfe6d8" } as const;

export function AudioSlot({
  title,
  note,
  duration = "0:18",
  dark,
}: {
  title: string;
  note?: string;
  duration?: string;
  dark?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const bars = Array.from({ length: 56 }, (_, i) => 5 + ((i * 37) % 23) + (i % 7 === 0 ? 8 : 0));

  return (
    <div
      className="rounded-2xl border-2 border-dashed p-4 sm:p-5"
      style={{ borderColor: dark ? "rgba(255,255,255,0.22)" : AUDIO.br, background: dark ? "rgba(255,255,255,0.045)" : AUDIO.bg }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className="inline-block rounded-md px-2 py-[3px] text-[9.5px] font-black uppercase tracking-[0.14em]"
            style={{ color: dark ? "#fff" : AUDIO.fg, background: dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.75)" }}
          >
            SAMPLE
          </span>
          <p className={`font-cv-heading mt-2 text-[15px] font-bold ${dark ? "text-white" : "text-[#152033]"}`}>{title}</p>
          {note && <p className={`mt-1 text-[12.5px] ${dark ? "text-white/60" : "text-[#667085]"}`}>{note}</p>}
        </div>
        <span className={`font-cv-mono shrink-0 text-[10px] font-semibold ${dark ? "text-white/45" : "text-[#98a2b3]"}`}>{duration}</span>
      </div>
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className={`mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 transition-colors ${dark ? "bg-white/10 hover:bg-white/15" : "bg-white/80 hover:bg-white"}`}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white" style={{ background: AUDIO.fg }}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </span>
        <span className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden>
          {bars.map((h, i) => (
            <span key={i} className="flex-1 rounded-full transition-colors" style={{ height: `${h}px`, background: playing && i < 18 ? AUDIO.fg : dark ? "rgba(255,255,255,0.28)" : "rgba(29,122,95,0.24)" }} />
          ))}
        </span>
      </button>
    </div>
  );
}

// ── V8WaveformPlayer — the large "Hear It" sample player ─────────────────────
const DURATION = 28; // seconds (sample)

const TRANSCRIPT: { t: number; who: "Callverted" | "Caller"; text: string }[] = [
  { t: 0, who: "Callverted", text: "Thanks for calling Blue Star. The team is out on a job, so I'll grab the details. What's going on?" },
  { t: 8, who: "Caller", text: "My water heater just burst and the basement is flooding." },
  { t: 14, who: "Callverted", text: "Got it. What ZIP are you in, and have you found the shutoff?" },
  { t: 20, who: "Caller", text: "33618. I can't find it." },
  { t: 24, who: "Callverted", text: "Understood. I'm marking this an emergency and the team will call you right back." },
];

const N_BARS = 46;
// Deterministic pseudo-waveforms (no Math.random so SSR and client agree).
const CV_BARS = Array.from({ length: N_BARS }, (_, i) => 8 + ((i * 13) % 22) + (i % 5 === 0 ? 6 : 0));
const CALLER_BARS = Array.from({ length: N_BARS }, (_, i) => 6 + ((i * 19) % 20) + (i % 4 === 0 ? 7 : 0));

function mmss(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function Waveform({ bars, progress, color, muted }: { bars: number[]; progress: number; color: string; muted: string }) {
  const filled = Math.round(progress * bars.length);
  return (
    <span className="flex h-9 flex-1 items-center gap-[2.5px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="flex-1 rounded-full transition-colors duration-150"
          style={{ height: `${h}px`, background: i < filled ? color : muted }}
        />
      ))}
    </span>
  );
}

export function V8WaveformPlayer() {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds, fractional
  const raf = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!playing) return;
    raf.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 0.2;
        if (next >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return next;
      });
    }, 200);
    return () => { if (raf.current) clearInterval(raf.current); };
  }, [playing]);

  const progress = Math.min(elapsed / DURATION, 1);
  const activeIdx = (() => {
    let idx = 0;
    for (let i = 0; i < TRANSCRIPT.length; i++) if (elapsed >= TRANSCRIPT[i].t) idx = i;
    return idx;
  })();
  const activeWho = playing || elapsed > 0 ? TRANSCRIPT[activeIdx].who : null;

  function toggle() {
    if (elapsed >= DURATION) setElapsed(0);
    setPlaying((p) => !p);
  }

  return (
    <div className="rounded-3xl border border-[#e3e7ed] bg-white p-6 shadow-[0_28px_60px_-32px_rgba(16,24,40,0.35)] sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-[3px] text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Sample
          </span>
          <p className="font-cv-heading text-[15px] font-bold text-[#152033]">After-hours water damage intake</p>
        </div>
        <span className="font-cv-mono shrink-0 text-[12px] font-semibold tabular-nums text-[#98a2b3]">
          {mmss(elapsed)} / {mmss(DURATION)}
        </span>
      </div>

      {/* Player: play button + two labelled waveforms */}
      <div className="flex items-center gap-4 sm:gap-5">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause sample" : "Play sample"}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-landing-primary text-white shadow-[0_12px_30px_-8px_rgba(36,84,216,0.6)] transition-colors hover:bg-blue-600"
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="flex w-[86px] shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-landing-primary">
              Callverted
              {activeWho === "Callverted" && <span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />}
            </span>
            <Waveform bars={CV_BARS} progress={progress} color="#2454d8" muted="rgba(36,84,216,0.18)" />
          </div>
          <div className="flex items-center gap-3">
            <span className="flex w-[86px] shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#475467]">
              Caller
              {activeWho === "Caller" && <span className="h-1.5 w-1.5 rounded-full bg-[#475467]" />}
            </span>
            <Waveform bars={CALLER_BARS} progress={progress} color="#667085" muted="rgba(102,112,133,0.18)" />
          </div>
        </div>
      </div>

      {/* Transcript preview */}
      <div className="mt-6 border-t border-[#eef1f4] pt-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#98a2b3]">Transcript preview</p>
        <ul className="space-y-2.5">
          {TRANSCRIPT.map((line, i) => {
            const active = (playing || elapsed > 0) && i === activeIdx;
            const past = elapsed >= line.t;
            return (
              <li key={i} className={`flex gap-3 transition-opacity duration-300 ${past ? "opacity-100" : "opacity-40"}`}>
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    line.who === "Callverted" ? "bg-[#eef3ff] text-landing-primary" : "bg-[#f2f4f7] text-[#475467]"
                  }`}
                >
                  {line.who}
                </span>
                <p className={`text-[13.5px] leading-relaxed ${active ? "font-semibold text-[#152033]" : "text-[#475467]"}`}>{line.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
