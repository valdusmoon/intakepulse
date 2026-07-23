"use client";

import { useState } from "react";

/**
 * Page-scoped media frames for the /v5 rebuild — a forked copy of the AudioSlot
 * and BrowserFrame helpers from MediaSlot.tsx so /v5 can iterate on these small
 * visual frames without touching /, /v6, or /v7.
 *
 *   - AudioSlot  — press-play sample-call placeholder (no real audio yet).
 *   - BrowserFrame — SVG browser chrome to wrap the dashboard screenshot.
 */

const AUDIO_STYLE = { fg: "#1d7a5f", bg: "#eefaf5", br: "#bfe6d8" } as const;

function CopyPrompt({ prompt, dark }: { prompt: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(prompt).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          },
          () => {},
        );
      }}
      className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
        dark
          ? "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
          : "bg-black/5 text-[#667085] hover:bg-black/10 hover:text-[#152033]"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * Audio slot styled as a real player so the surrounding layout is judged with the
 * control in place. The waveform is static SVG; the play button toggles a fake
 * progress fill so the interaction reads, but no audio is loaded.
 */
export function AudioSlot({
  title,
  note,
  prompt,
  duration = "0:18",
  dark,
}: {
  title: string;
  note?: string;
  prompt?: string;
  duration?: string;
  dark?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  // Deterministic pseudo-waveform — no Math.random, so SSR and client agree.
  const bars = Array.from({ length: 56 }, (_, i) => 5 + ((i * 37) % 23) + (i % 7 === 0 ? 8 : 0));

  return (
    <div
      className="rounded-2xl border-2 border-dashed p-4 sm:p-5"
      style={{
        borderColor: dark ? "rgba(255,255,255,0.22)" : AUDIO_STYLE.br,
        background: dark ? "rgba(255,255,255,0.045)" : AUDIO_STYLE.bg,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className="inline-block rounded-md px-2 py-[3px] text-[9.5px] font-black uppercase tracking-[0.14em]"
            style={{
              color: dark ? "#fff" : AUDIO_STYLE.fg,
              background: dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.75)",
            }}
          >
            AUDIO
          </span>
          <p className={`font-cv-heading mt-2 text-[15px] font-bold ${dark ? "text-white" : "text-[#152033]"}`}>
            {title}
          </p>
          {note && <p className={`mt-1 text-[12.5px] ${dark ? "text-white/60" : "text-[#667085]"}`}>{note}</p>}
        </div>
        <span className={`font-cv-mono shrink-0 text-[10px] font-semibold ${dark ? "text-white/45" : "text-[#98a2b3]"}`}>
          {duration}
        </span>
      </div>

      {/* player: one big click target, waveform inside the button */}
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className={`mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 transition-colors ${
          dark ? "bg-white/10 hover:bg-white/15" : "bg-white/80 hover:bg-white"
        }`}
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
          style={{ background: AUDIO_STYLE.fg }}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1.5" />
              <rect x="14" y="4" width="4" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
        <span className="flex h-8 flex-1 items-center gap-[3px]" aria-hidden>
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-full transition-colors"
              style={{
                height: `${h}px`,
                background:
                  playing && i < 18
                    ? AUDIO_STYLE.fg
                    : dark
                      ? "rgba(255,255,255,0.28)"
                      : "rgba(29,122,95,0.24)",
              }}
            />
          ))}
        </span>
      </button>

      {prompt && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg p-2.5 ${dark ? "bg-black/25" : "bg-white/70"}`}>
          <p
            className={`font-cv-mono min-w-0 flex-1 text-[10.5px] leading-relaxed ${
              dark ? "text-white/70" : "text-[#475467]"
            }`}
          >
            <span className={dark ? "text-white/40" : "text-[#98a2b3]"}>script › </span>
            {prompt}
          </p>
          <CopyPrompt prompt={prompt} dark={dark} />
        </div>
      )}
    </div>
  );
}

/**
 * Browser-chrome wrapper drawn in SVG rather than a PNG bezel. Wrap a screenshot
 * in this to make a dashboard read as software instead of a floating rectangle.
 */
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
    <div
      className={`overflow-hidden rounded-xl border border-[#e3e7ed] bg-white shadow-[0_28px_60px_-24px_rgba(16,24,40,0.35)] ${className}`}
    >
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
