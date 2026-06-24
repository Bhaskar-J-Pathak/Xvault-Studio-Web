import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Block all bots from private/authenticated routes
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/studio/", "/account/", "/auth", "/api/"],
      },
      // Explicitly allow all major AI crawlers on public pages
      { userAgent: "GPTBot",         allow: "/" },
      { userAgent: "ChatGPT-User",   allow: "/" },
      { userAgent: "PerplexityBot",  allow: "/" },
      { userAgent: "ClaudeBot",      allow: "/" },
      { userAgent: "anthropic-ai",   allow: "/" },
      { userAgent: "Googlebot",      allow: "/" },
      { userAgent: "Bingbot",        allow: "/" },
      { userAgent: "OAI-SearchBot",  allow: "/" },
    ],
    sitemap: "https://xvault.dev/sitemap.xml",
  };
}
