import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema/*",
  out: "./src/lib/db/migrations", 
  dialect: "postgresql",
  dbCredentials: process.env.DB_PASSWORD
    ? {
        host: "aws-1-us-west-2.pooler.supabase.com",
        port: 5432,
        user: "postgres.tjbupfbiccajwbekwrfw",
        password: process.env.DB_PASSWORD,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
      }
    : { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
  schemaFilter: ["public"],
  introspect: {
    casing: "preserve",
  },
});