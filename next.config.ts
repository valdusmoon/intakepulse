import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `ws` (used by @vercel/functions' experimental_upgradeWebSocket for the
  // Twilio Media Stream bridge) breaks when bundled — its optional native
  // masking/unmasking fallback gets corrupted, causing a runtime crash
  // ("t.unmask is not a function") on the first incoming WebSocket frame.
  // Excluding it from bundling lets it load normally from node_modules.
  serverExternalPackages: ["ws"],
};

export default nextConfig;
