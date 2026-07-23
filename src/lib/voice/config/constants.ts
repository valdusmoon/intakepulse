/**
 * Voice runtime constants — timeouts, audio format, and OpenAI Realtime tuning.
 */

export const TIMEOUTS = {
  /** Caller must speak within 30s of the AI greeting (bot spam prevention) */
  INITIAL_SILENCE: 30_000,

  /** Ongoing silence timeout during active conversation */
  ONGOING_SILENCE: 60_000,

  /**
   * Soft cap: at 3 minutes the AI gracefully switches to closing (says it has
   * enough, captures what exists, hangs up) rather than letting a rambling/stuck
   * call run on — see engine.requestGracefulClose. This should fire before the
   * hard cap below in practice.
   */
  GRACEFUL_CLOSE_DURATION: 3 * 60 * 1000,

  /**
   * Hard cap: maximum call duration before forced disconnect. Kept under Vercel
   * Hobby's hard 300s (5min) per-WebSocket-connection cap. The graceful close
   * above should trigger first; this is the backstop (WS close → cleanupConnection
   * force-captures a partial lead).
   */
  MAX_CALL_DURATION: 4.5 * 60 * 1000,

  /**
   * Breathing room after the last queued audio is expected to finish playing,
   * before hanging up. The hang-up waits on session.audioQueuedUntil (measured
   * from the μ-law bytes actually sent) rather than on response.done, which
   * fires when OpenAI finishes GENERATING — seconds before the caller has heard
   * it. Closing on generation clipped the sign-off mid-sentence.
   */
  GOODBYE_TAIL_PADDING: 900,

  /** Hard ceiling on that wait, so a bad duration estimate can't hold the line open. */
  GOODBYE_MAX_WAIT: 20_000,
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
  // Fixed product voice (per-business voice selection was removed). "marin" is a
  // next-gen gpt-realtime voice — warmer/more natural than alloy, supported by
  // the OPENAI_REALTIME_MODEL default (gpt-realtime-2.1-mini).
  VOICE: "marin" as const,

  /** Lower for deterministic classification */
  TEMPERATURE: 0.4,

  /**
   * Server VAD tuning. Drives end-of-turn detection AND manual barge-in:
   * speech_started triggers engine.handleBargeIn (audio-only interruption,
   * code-guarded — see openai-handler.service.ts). OpenAI's own
   * interrupt_response stays false; we cut audio ourselves so Twilio's buffer
   * gets cleared and terminal states can't be interrupted. Threshold 0.5 keeps
   * background noise from false-triggering an interruption.
   */
  VAD_THRESHOLD: 0.5,
  PREFIX_PADDING_MS: 300,
  SILENCE_DURATION_MS: 700,
} as const;

export const INTERRUPTION = {
  /** Minimum audio-end time for truncation (ms) — avoids truncating essentially-nothing */
  MIN_TRUNCATION_TIME: 100,
} as const;
