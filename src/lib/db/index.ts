/**
 * Drizzle database connection and configuration
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "../env";

import * as schema from "./schema";

// PostgreSQL connection using postgres.js
const connectionString = serverEnv.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create postgres connection
// prepare: false required for Supabase Transaction pooler mode
const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  connection: {
    search_path: "public",
  },
});

// Create Drizzle database instance with schema
export const db = drizzle(sql, { schema });

/**
 * Close database connection
 * Useful for cleanup in serverless environments
 */
export async function closeConnection() {
  await sql.end();
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    return result.length > 0;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Database connection test failed:", error);
    return false;
  }
}