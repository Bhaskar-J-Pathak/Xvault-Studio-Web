import { MetadataRoute } from "next";

// Paths that must never be crawled — no trailing slash so /dashboard and
// /dashboard/ are both blocked (trailing-slash-only patterns miss the root).
const PRIVATE = ["/dashboard", "/studio", "/account", "/auth", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE,
      },
      // Per-bot rules must repeat the disallow list; without it a specific
      // user-agent block overrides the * block entirely (including its Disallows).
      { userAgent: "GPTBot",        allow: "/", disallow: PRIVATE },
      { userAgent: "ChatGPT-User",  allow: "/", disallow: PRIVATE },
      { userAgent: "PerplexityBot", allow: "/", disallow: PRIVATE },
      { userAgent: "ClaudeBot",     allow: "/", disallow: PRIVATE },
      { userAgent: "anthropic-ai",  allow: "/", disallow: PRIVATE },
      { userAgent: "Googlebot",     allow: "/", disallow: PRIVATE },
      { userAgent: "Bingbot",       allow: "/", disallow: PRIVATE },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: PRIVATE },
    ],
    sitemap: "https://xvault.dev/sitemap.xml",
  };
}
