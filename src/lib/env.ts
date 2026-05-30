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
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET || "",

  // Stripe (server-only)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",

  // Cron security
  CRON_SECRET: process.env.CRON_SECRET || "",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // Telnyx
  TELNYX_API_KEY: process.env.TELNYX_API_KEY || "",
  // Ed25519 public key from Telnyx portal → Messaging → Webhooks → Signing Key
  TELNYX_PUBLIC_KEY: process.env.TELNYX_PUBLIC_KEY || "",
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