/**
 * Voice runtime constants — timeouts, audio format, and OpenAI Realtime tuning.
 */

export const TIMEOUTS = {
  /** Caller must speak within 30s of the AI greeting (bot spam prevention) */
  INITIAL_SILENCE: 30_000,

  /** Ongoing silence timeout during active conversation */
  ONGOING_SILENCE: 60_000,

  /**
   * Maximum call duration before forced disconnect. Kept under Vercel Hobby's
   * hard 300s (5min) per-WebSocket-connection cap — the instruction builder's
   * wrap-up guard (Phase 5) should trigger before this fires in practice.
   */
  MAX_CALL_DURATION: 4.5 * 60 * 1000,

  /** Delay before closing the connection after a natural goodbye */
  GOODBYE_DELAY: 1200,
} as const;

/**
 * How long the business's own line rings before Callverted's AI takes over the
 * call. Hard-coded product default (~3 rings) rather than a per-business setting;
 * override per environment with CALL_RING_TIMEOUT_SECONDS. Kept comfortably below
 * typical carrier voicemail pickup (~20–25s) so the caller's voicemail never
 * "answers" the call and blocks the AI overflow. NOTE: marketing/settings copy
 * that cites "~15 seconds" is kept in sync manually (static strings, not imports).
 */
export const CALL_RING_TIMEOUT_SECONDS = Number(process.env.CALL_RING_TIMEOUT_SECONDS) || 15;

export const OPENAI_CONFIG = {
  VOICE: "alloy" as const,

  /** Lower for deterministic classification */
  TEMPERATURE: 0.4,

  /**
   * Server VAD tuning — no longer needs to be hair-trigger-sensitive since
   * voice barge-in is disabled (turn_detection.interrupt_response: false in
   * call-manager.ts). This still only drives reliable end-of-turn detection.
   */
  VAD_THRESHOLD: 0.5,
  PREFIX_PADDING_MS: 300,
  SILENCE_DURATION_MS: 700,
} as const;

export const INTERRUPTION = {
  /** Minimum audio-end time for truncation (ms) — avoids truncating essentially-nothing */
  MIN_TRUNCATION_TIME: 100,
} as const;
