import type { NextConfig } from "next";

import {
  getMissingPrivacyFields,
  privacyFieldLabels,
} from "./src/config/privacy";

// Opozorilo ob gradnji, če stran »Zasebnost« še ni dopolnjena.
const missingPrivacy = getMissingPrivacyFields();
if (missingPrivacy.length > 0 && process.argv.includes("build")) {
  console.warn(
    `\n⚠ Pred javno objavo dopolni src/config/privacy.ts: ${missingPrivacy
      .map((field) => privacyFieldLabels[field])
      .join(", ")}.\n`,
  );
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
