// Feature flags — set in environment variables
// Set to false in Vercel env vars to hide from production UI

export const FEATURES = {
  quotes: process.env.NEXT_PUBLIC_FEATURE_QUOTES === "true",
};
