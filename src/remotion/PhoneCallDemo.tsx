import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Updated Callverted hero animation.
 *
 * Purpose: dramatize the actual product mechanic, not decorative motion:
 * call rings unanswered -> Callverted answers -> short intake -> lead packet.
 * Keep the beats slow enough to read when embedded via @remotion/player.
 */

const RING_END = 96;
const ANSWER_START = 96;
const TRANSCRIPT_START = 176;
const BUBBLE_1_AT = TRANSCRIPT_START + 8;
const BUBBLE_2_AT = BUBBLE_1_AT + 78;
const BUBBLE_3_AT = BUBBLE_2_AT + 78;
const BUBBLE_4_AT = BUBBLE_3_AT + 72;
const TRANSCRIPT_END = BUBBLE_4_AT + 78;
const CARD_START = TRANSCRIPT_END - 8;
const HOLD_END = CARD_START + 154;

export const PHONE_CALL_REDUCED_MOTION_FRAME = CARD_START + 60;

export const PHONE_CALL_STEPS = [
  {
    key: "ringing",
    frame: 0,
    time: "0:00",
    label: "Rings unanswered",
    body: "Your team gets the first ring. No answer in ~20 seconds, Callverted keeps the same caller on the line.",
  },
  {
    key: "answered",
    frame: ANSWER_START,
    time: "0:04",
    label: "AI answers",
    body: "No voicemail, no text-back delay. Callverted answers the missed call live.",
  },
  {
    key: "transcript",
    frame: TRANSCRIPT_START,
    time: "0:22",
    label: "Qualifies",
    body: "The caller is reassured while Callverted collects job details, urgency, and service fit.",
  },
  {
    key: "captured",
    frame: CARD_START,
    time: "1:10",
    label: "Lead captured",
    body: "The result is a callback-ready lead with urgency, intent, estimated value, transcript, and next action.",
  },
] as const;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

const RING_CYCLE = 55;

function PulseRing({ delay, frame }: { delay: number; frame: number }) {
  const local = ((frame - delay) % RING_CYCLE + RING_CYCLE) % RING_CYCLE;
  const progress = local / RING_CYCLE;
  const scale = interpolate(progress, [0, 1], [0.62, 2.15]);
  const opacity = interpolate(progress, [0, 0.16, 1], [0, 0.36, 0]);

  return (
    <div
      style={{
        position: "absolute",
        width: 64,
        height: 64,
        borderRadius: "50%",
        border: "1.5px solid #5b8cff",
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
}

function PhoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 10.7c1.45 2.85 3.85 5.25 6.7 6.7l2.2-2.2c.3-.3.75-.4 1.15-.26 1.05.35 2.18.55 3.45.55.62 0 1.1.48 1.1 1.1v3.25c0 .62-.48 1.1-1.1 1.1C10.62 20.94 3.05 13.38 3.05 4c0-.62.48-1.1 1.1-1.1H7.4c.62 0 1.1.48 1.1 1.1 0 1.25.18 2.4.55 3.45.14.4.04.84-.26 1.14l-2.3 2.1Z"
        fill="white"
      />
    </svg>
  );
}

function RingingScreen({ frame }: { frame: number }) {
  const opacity = interpolate(frame, [RING_END - 12, RING_END], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame > RING_END + 2) return null;

  return (
    <AbsoluteFill style={{ opacity, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 22 }}>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#7d8bb0", letterSpacing: 0.5 }}>2:47 AM</div>
      <div style={{ position: "relative", width: 78, height: 78, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PulseRing delay={0} frame={frame} />
        <PulseRing delay={18} frame={frame} />
        <PulseRing delay={36} frame={frame} />
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: "linear-gradient(145deg,#2454d8,#173a8f)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 26px rgba(91,140,255,.45)",
          }}
        >
          <PhoneIcon />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 20, color: "#f5f7ff" }}>Unknown Caller</div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#7d8bb0", marginTop: 4 }}>mobile · Newark, NJ</div>
      </div>
    </AbsoluteFill>
  );
}

function AnsweredBadge({ frame, fps }: { frame: number; fps: number }) {
  const local = frame - ANSWER_START;
  if (local < -2 || frame > TRANSCRIPT_START + 4) return null;

  const pop = spring({ frame: local, fps, config: { damping: 18, stiffness: 130, mass: 0.72 } });
  const exitOpacity = interpolate(frame, [TRANSCRIPT_START - 22, TRANSCRIPT_START + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: clamp01(pop) * exitOpacity }}>
      <div
        style={{
          transform: `scale(${interpolate(pop, [0, 1], [0.72, 1])})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(36,84,216,.16)",
            border: "1px solid rgba(91,140,255,.42)",
            borderRadius: 999,
            padding: "8px 14px",
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5b8cff" }} />
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 13, color: "#dbe4ff" }}>Answered by Callverted</span>
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#7d8bb0", width: 230, textAlign: "center", lineHeight: 1.5 }}>
          Your team still gets the first chance. Callverted only takes over when the call would have gone cold.
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Bubble({
  frame,
  appearAt,
  fps,
  align,
  children,
}: {
  frame: number;
  appearAt: number;
  fps: number;
  align: "left" | "right";
  children: string;
}) {
  const local = frame - appearAt;
  if (local < 0) return null;

  const pop = spring({ frame: local, fps, config: { damping: 18, stiffness: 140, mass: 0.8 } });
  const y = interpolate(pop, [0, 1], [14, 0]);
  const exitOpacity = interpolate(frame, [TRANSCRIPT_END - 24, TRANSCRIPT_END + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        opacity: clamp01(pop) * exitOpacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          maxWidth: "84%",
          fontFamily: "Inter, sans-serif",
          fontSize: 12.5,
          lineHeight: 1.45,
          padding: "10px 12px",
          borderRadius: 15,
          borderBottomRightRadius: align === "right" ? 5 : 15,
          borderBottomLeftRadius: align === "left" ? 5 : 15,
          background: align === "right" ? "#1b2540" : "linear-gradient(145deg,#2454d8,#1d47bd)",
          color: align === "right" ? "#dde3f5" : "#ffffff",
          border: align === "right" ? "1px solid #2a3556" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function TranscriptScene({ frame, fps }: { frame: number; fps: number }) {
  if (frame < TRANSCRIPT_START - 2 || frame > TRANSCRIPT_END + 4) return null;

  const enter = interpolate(frame, [TRANSCRIPT_START - 2, TRANSCRIPT_START + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ padding: "22px 18px", justifyContent: "center", opacity: enter }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Bubble frame={frame} appearAt={BUBBLE_1_AT} fps={fps} align="left">
          Thanks for calling Blue Star Home Services. What happened?
        </Bubble>
        <Bubble frame={frame} appearAt={BUBBLE_2_AT} fps={fps} align="right">
          Our furnace just died and it&apos;s freezing in here.
        </Bubble>
        <Bubble frame={frame} appearAt={BUBBLE_3_AT} fps={fps} align="left">
          Got it. Is anyone home right now, and how old is the unit?
        </Bubble>
        <Bubble frame={frame} appearAt={BUBBLE_4_AT} fps={fps} align="right">
          Yes, my kids are here. It&apos;s probably 10 years old.
        </Bubble>
      </div>
    </AbsoluteFill>
  );
}

function LeadMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #e3e7ed", background: "#f9fafb", borderRadius: 12, padding: 10 }}>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: "#98a2b3", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 14, color: "#152033", marginTop: 3 }}>{value}</div>
    </div>
  );
}

function LeadCard({ frame, fps }: { frame: number; fps: number }) {
  const local = frame - CARD_START;
  if (local < -4) return null;

  const pop = spring({ frame: Math.max(local, 0), fps, config: { damping: 18, stiffness: 130, mass: 0.8 } });
  const y = interpolate(pop, [0, 1], [40, 0]);
  const opacity = interpolate(frame, [CARD_START - 4, CARD_START + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = interpolate(Math.sin((frame / fps) * Math.PI * 1.4), [-1, 1], [0.55, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          width: "100%",
          background: "#ffffff",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 22px 48px rgba(0,0,0,.35)",
          color: "#152033",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: 1, color: "#98a2b3", textTransform: "uppercase", fontWeight: 800 }}>
            New lead
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: 10.5,
              color: "#b42318",
              background: "#fff0ee",
              border: "1px solid #f3c9c3",
              borderRadius: 999,
              padding: "3px 8px",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#b42318", opacity: pulse }} />
            Urgent
          </span>
        </div>
        <div style={{ fontFamily: "Hanken Grotesk, sans-serif", fontWeight: 800, fontSize: 19, color: "#152033", marginTop: 9 }}>Marcus Webb</div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#667085", marginTop: 2 }}>HVAC · no heat · furnace failure</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <LeadMetric label="Intent" value="High" />
          <LeadMetric label="Value" value="$1.8k–$3.2k" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 12 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "#667085", lineHeight: 1.35 }}>Recommended: call within 10 min</span>
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: 11,
              color: "#fff",
              background: "#2454d8",
              borderRadius: 9,
              padding: "8px 11px",
              flexShrink: 0,
            }}
          >
            Call back
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function PhoneCallDemo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#0d1526,#0a0f1c)" }}>
      <RingingScreen frame={frame} />
      <AnsweredBadge frame={frame} fps={fps} />
      <TranscriptScene frame={frame} fps={fps} />
      <LeadCard frame={frame} fps={fps} />
    </AbsoluteFill>
  );
}

export const PHONE_CALL_DEMO_DURATION = HOLD_END;
export const PHONE_CALL_DEMO_FPS = 30;
