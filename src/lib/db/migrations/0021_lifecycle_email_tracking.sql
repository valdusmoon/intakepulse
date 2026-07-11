-- Phase 3 lifecycle emails — idempotency tracking columns on businesses.
-- Each column records the furthest stage of a given email series already sent,
-- so the daily/monthly lifecycle crons never double-send the same stage.
--   trial_reminder_stage:   'trial_day10' | 'trial_day13' | 'trial_expiry'
--   activation_nudge_stage: 'activation_day1' | 'activation_day3' | 'activation_day7'
--   winback_sent_at:        set once when the post-cancel win-back email is sent
--   monthly_recap_sent_for: 'YYYY-MM' of the last monthly ROI recap emailed
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "trial_reminder_stage" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "activation_nudge_stage" text;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "winback_sent_at" timestamp;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "monthly_recap_sent_for" text;
