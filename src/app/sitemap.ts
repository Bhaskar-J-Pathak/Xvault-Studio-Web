import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getAllGuides } from "@/lib/guides";

const BASE = "https://xvault.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const guides: MetadataRoute.Sitemap = getAllGuides().map((guide) => ({
    url: `${BASE}/guides/${guide.slug}`,
    lastModified: guide.date ? new Date(guide.date) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const comparePages: MetadataRoute.Sitemap = [
    "xvault-vs-sudowrite",
    "xvault-vs-novelcrafter",
    "xvault-vs-novelai",
    "xvault-vs-inkfluence-ai",
    "xvault-vs-chatgpt",
  ].map((slug) => ({
    url: `${BASE}/compare/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/pricing`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts,
    {
      url: `${BASE}/guides`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...guides,
    {
      url: `${BASE}/compare`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...comparePages,
    {
      url: `${BASE}/affiliates`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
