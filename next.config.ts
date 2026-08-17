import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // ── www → canonical non-www ─────────────────────────────────────────────
      // Fixes circular redirect loop causing Googlebot "Redirect error" on
      // blog/compare pages. Handles both root and all sub-paths.
      {
        source: "/",
        has: [{ type: "host", value: "www.xvault.dev" }],
        destination: "https://xvault.dev",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.xvault.dev" }],
        destination: "https://xvault.dev/:path*",
        permanent: true,
      },

      // ── Legacy / broken URLs that Google has cached (404 → redirect) ────────
      { source: "/download",   destination: "/pricing", permanent: true },
      { source: "/download/",  destination: "/pricing", permanent: true },
      { source: "/waitlist",   destination: "/",        permanent: true },
      { source: "/parked",     destination: "/",        permanent: true },
      { source: "/mo",         destination: "/",        permanent: true },

      // ── Old checkout URL ────────────────────────────────────────────────────
      {
        source: "/api/checkout/success",
        destination: "/checkout/success",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
