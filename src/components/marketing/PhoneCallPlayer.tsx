"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  PhoneCallDemo,
  PHONE_CALL_DEMO_DURATION,
  PHONE_CALL_DEMO_FPS,
  PHONE_CALL_STEPS,
  PHONE_CALL_REDUCED_MOTION_FRAME,
} from "@/remotion/PhoneCallDemo";

const COMPOSITION_WIDTH = 360;
const COMPOSITION_HEIGHT = 740;

function activeStepForFrame(frame: number) {
  let idx = 0;
  for (let i = 0; i < PHONE_CALL_STEPS.length; i++) {
    if (frame >= PHONE_CALL_STEPS[i].frame) idx = i;
  }
  return idx;
}

export function PhoneCallPlayer() {
  const playerRef = useRef<PlayerRef>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  // The declarative `autoPlay` prop doesn't reliably kick in here (likely a
  // mount-timing quirk from the ssr:false dynamic import) — starting playback
  // imperatively once the ref is attached is more dependable.
  useEffect(() => {
    if (reducedMotion) return;
    playerRef.current?.play();
  }, [reducedMotion]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      setActiveStep((current) => {
        const next = activeStepForFrame(e.detail.frame);
        return next === current ? current : next;
      });
    };

    player.addEventListener("frameupdate", onFrameUpdate);
    return () => player.removeEventListener("frameupdate", onFrameUpdate);
  }, []);

  function handleStepClick(index: number) {
    const step = PHONE_CALL_STEPS[index];
    playerRef.current?.seekTo(step.frame);
    setActiveStep(index);
    if (!reducedMotion) playerRef.current?.play();
  }

  return (
    <div className="mx-auto max-w-[300px]">
      <div className="relative w-[280px] sm:w-[300px] mx-auto">
        {/* Layered ambient glow — a wide soft wash plus a tighter, brighter core
            reads as depth, rather than one flat blurred blob. */}
        <div
          className="absolute inset-0 -z-10 rounded-[3rem] opacity-30 blur-[70px]"
          style={{ background: "radial-gradient(circle at 50% 40%, rgba(91,140,255,.45), transparent 75%)" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10 rounded-[3rem] opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle at 50% 35%, rgba(59,108,255,.35), transparent 70%)" }}
          aria-hidden
        />

        {/* Signal rings — a literal call ping radiating outward, not abstract
            decoration. Skipped entirely for reduced-motion visitors. */}
        {!reducedMotion && (
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <span className="cv-signal-ring" style={{ animationDelay: "0s" }} />
            <span className="cv-signal-ring" style={{ animationDelay: "1.05s" }} />
            <span className="cv-signal-ring" style={{ animationDelay: "2.1s" }} />
          </div>
        )}

        {/* Phone bezel */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#232d47] bg-[#05070d] p-2.5 shadow-[0_30px_80px_rgba(0,0,0,.55)]">
          {/* Glass sheen along the top edge — reads as premium hardware, not a flat mockup */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-60"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.1), transparent)" }}
            aria-hidden
          />
          <div className="absolute left-1/2 top-2.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#0a0f1c]" aria-hidden />
          <div className="overflow-hidden rounded-[2rem] bg-[#0a0f1c]">
            <Player
              ref={playerRef}
              component={PhoneCallDemo}
              durationInFrames={PHONE_CALL_DEMO_DURATION}
              fps={PHONE_CALL_DEMO_FPS}
              compositionWidth={COMPOSITION_WIDTH}
              compositionHeight={COMPOSITION_HEIGHT}
              style={{ width: "100%", aspectRatio: `${COMPOSITION_WIDTH} / ${COMPOSITION_HEIGHT}` }}
              // The composition has no audio, but Remotion Player still gates
              // autoplay behind the browser's muted-media exemption — without
              // this, .play() silently fails until the visitor's first click.
              initiallyMuted
              initialVolume={0}
              loop={!reducedMotion}
              initialFrame={reducedMotion ? PHONE_CALL_REDUCED_MOTION_FRAME : 0}
              controls={false}
              clickToPlay={false}
              showPosterWhenPaused={false}
            />
          </div>
        </div>
      </div>

      {/* Step chips — click to jump the animation there; the active chip also
          tracks playback on its own as the loop runs. */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {PHONE_CALL_STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => handleStepClick(i)}
            className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
              activeStep === i ? "border-landing-primary-glow/60 bg-white/8" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            }`}
          >
            <span className={`block font-cv-mono text-[10px] ${activeStep === i ? "text-landing-primary-glow" : "text-white/35"}`}>
              {step.time}
            </span>
            <span className={`block text-[12.5px] font-semibold mt-0.5 ${activeStep === i ? "text-white" : "text-white/60"}`}>
              {step.label}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-white/50 text-center min-h-[2.5em] leading-snug">{PHONE_CALL_STEPS[activeStep].body}</p>
    </div>
  );
}
