/**
 * Environment variables configuration and validation
 * Centralizes all environment variable access with type safety
 */

// Public environment variables (safe to expose to browser)
export const env = {
  // App Configuration
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ENABLE_AUTH: process.env.NEXT_PUBLIC_ENABLE_AUTH === "true",
  NODE_ENV: process.env.NODE_ENV || "development",

  // Supabase (public keys safe for browser)
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",

  // Clerk (public keys safe for browser)
  CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",

  // Stripe (public keys safe for browser)
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "",
} as const;

// Server-only environment variables (never expose to browser)
export const serverEnv = {
  // Supabase (server-only)
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  // Clerk (server-only)
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",

  // Stripe (server-only)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",

  // Cron security
  CRON_SECRET: process.env.CRON_SECRET || "",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // Twilio — voice overflow receptionist
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  // Skip Twilio request-signature validation — local/ngrok dev only, never set in prod
  SKIP_TWILIO_VALIDATION: process.env.SKIP_TWILIO_VALIDATION === "true",
  // System-wide kill switch for all inbound call handling
  EMERGENCY_DISABLE_CALLS: process.env.EMERGENCY_DISABLE_CALLS === "true",

  // OpenAI Realtime (voice)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_REALTIME_MODEL: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1-mini",

  // Public wss:// URL of the Twilio Media Stream endpoint (this app's /api/twilio/stream route)
  VOICE_STREAM_WSS_URL: process.env.VOICE_STREAM_WSS_URL || "",
  // HMAC secret used to sign short-lived tokens authorizing the stream WebSocket upgrade
  VOICE_STREAM_TOKEN_SECRET: process.env.VOICE_STREAM_TOKEN_SECRET || "",

  // CAN-SPAM — commercial email compliance.
  // HMAC secret for signing (non-expiring) unsubscribe tokens. Falls back to
  // CRON_SECRET so local dev works without extra setup; set a dedicated value in
  // prod. Rotating this invalidates every previously-sent unsubscribe link.
  UNSUBSCRIBE_TOKEN_SECRET: process.env.UNSUBSCRIBE_TOKEN_SECRET || process.env.CRON_SECRET || "",
  // Valid physical postal address shown in marketing email footers (CAN-SPAM
  // requirement). MUST be set to a real mailing address before sending any
  // commercial email; the placeholder is intentionally obvious so an unset value
  // is caught in review rather than mailed out.
  COMPANY_POSTAL_ADDRESS: process.env.COMPANY_POSTAL_ADDRESS || "[COMPANY_POSTAL_ADDRESS not set]",
  // Legal/sender name shown alongside the address in footers.
  COMPANY_NAME: process.env.COMPANY_NAME || "Callverted",
  // Inbox that receives mailto: unsubscribe requests (List-Unsubscribe header).
  UNSUBSCRIBE_MAILBOX: process.env.UNSUBSCRIBE_MAILBOX || "unsubscribe@callverted.com",
} as const;

/**
 * Validates that required environment variables are present
 * Call this during app initialization to catch missing config early
 */
export function validateEnvironment() {
  const errors: string[] = [];

  // Currently no required variables since we're using dummy users
  // Will add validation as we implement features

  if (env.ENABLE_AUTH) {
    if (!env.CLERK_PUBLISHABLE_KEY) {
      errors.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required when auth is enabled");
    }
    if (!serverEnv.CLERK_SECRET_KEY) {
      errors.push("CLERK_SECRET_KEY is required when auth is enabled");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
}

/**
 * Check if we're running in development mode
 */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Check if we're running in production mode
 */
export const isProduction = env.NODE_ENV === "production";