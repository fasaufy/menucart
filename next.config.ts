import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

// Standard browser protections for every response.
const securityHeaders = [
  // Never shown inside another site's frame (stops click-tricking copycat pages).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Files are only treated as the type the server says they are.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites only learn "came from menucart", never the page or anything in its address.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Location only for "Use my location" here; no camera, microphone or payment access.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSerwist(nextConfig);
