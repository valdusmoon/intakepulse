-- Per-vertical floor for estimatedValueLow (Settings > multi-vertical support).
-- Was a hardcoded $1,500 constant in the scoring engine shared by every
-- vertical — accurate for restoration, but badly inflated for cheap trade
-- categories (drain clog, thermostat, diagnostic-only calls).
ALTER TABLE "vertical_configs" ADD COLUMN IF NOT EXISTS "base_value_low" integer NOT NULL DEFAULT 150000;
