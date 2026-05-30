import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

// IntakePulse Inngest functions registered here in Session 6
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [],
});
