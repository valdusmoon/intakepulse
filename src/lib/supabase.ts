/**
 * Supabase client configuration
 * Provides database connectivity and real-time features
 */

import { createClient } from "@supabase/supabase-js";

import { env, serverEnv } from "./env";

// Client-side Supabase instance (safe for browser)
// Uses anon key which respects Row Level Security (RLS)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Server-side Supabase instance (Node.js only)
// Uses service role key which bypasses RLS - use with caution!
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Test database connection
 * Returns true if connection is successful
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("_test").select("*").limit(1);
    
    // If we get a "relation does not exist" error, that's actually good!
    // It means we connected successfully but the table doesn't exist yet
    if (error?.code === "42P01") {
      return true;
    }
    
    // No error means connection is working and table exists
    return !error;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

/**
 * Get database status information
 */
export async function getDatabaseStatus() {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .limit(10);

    return {
      connected: !error,
      tablesCount: data?.length || 0,
      error: error?.message,
    };
  } catch (error) {
    return {
      connected: false,
      tablesCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}