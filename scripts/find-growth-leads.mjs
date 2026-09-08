#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const searches = [
  {
    label: "AI writing pain",
    subreddit: "WritingWithAI",
    query: 'continuity OR "story bible" OR memory OR "long novel" OR Sudowrite OR NovelCrafter',
  },
  {
    label: "AI-assisted novel writing",
    subreddit: "BookWritingAI",
    query: 'continuity OR "story bible" OR memory OR "character arc" OR "plot threads"',
  },
  {
    label: "Fantasy complexity",
    subreddit: "fantasywriters",
    query: 'continuity OR timeline OR "character relationships" OR "character arc"',
  },
  {
    label: "General writing workflow",
    subreddit: "writing",
    query: 'continuity OR "story bible" OR "writing software" OR "track characters"',
  },
];

const positiveSignals = [
  ["continuity", 8],
  ["story bible", 8],
  ["character arc", 7],
  ["plot thread", 7],
  ["relationship", 5],
  ["long-form", 5],
  ["long novel", 5],
  ["memory", 4],
  ["forgot", 4],
  ["inconsistent", 4],
  ["sudowrite", 4],
  ["novelcrafter", 4],
  ["recommend", 3],
  ["tool", 2],
];

const negativeSignals = [
  ["weekly tool thread", -10],
  ["self promotion", -5],
  ["hiring", -5],
  ["for hire", -5],
];

const now = Date.now();
const maxAgeDays = Number(process.env.LEAD_MAX_AGE_DAYS || 7);
const limit = Number(process.env.LEAD_LIMIT || 20);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scorePost(post) {
  const haystack = `${post.title}\n${post.selftext}`.toLowerCase();
  let score = 0;
  for (const [term, weight] of [...positiveSignals, ...negativeSignals]) {
    if (haystack.includes(term)) score += weight;
  }

  const ageHours = Math.max(0, (now - post.created_utc * 1000) / 3_600_000);
  if (ageHours <= 24) score += 8;
  else if (ageHours <= 72) score += 5;
  else if (ageHours <= 168) score += 2;

  if (post.num_comments <= 15) score += 3;
  if (post.num_comments >= 50) score -= 2;
  if (haystack.includes("what do you use") || haystack.includes("any recommendations")) score += 5;
  return score;
}

function recommendedApproach(post) {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  if (text.includes("recommend") || text.includes("tool") || text.includes("software")) {
    return "Answer the question first. You may mention Xvault with an explicit founder disclosure if the community rules allow it.";
  }
  return "Help only. Do not add a product link unless the author asks for tools or follows up with interest.";
}

async function fetchSearch(search) {
  const base = `https://www.reddit.com/r/${search.subreddit}/search.json`;
  const params = new URLSearchParams({
    q: search.query,
    restrict_sr: "1",
    sort: "new",
    t: "week",
    limit: "50",
    raw_json: "1",
  });
  const response = await fetch(`${base}?${params}`, {
    headers: { "User-Agent": "XvaultStudioGrowthResearch/1.0 (contact: arthur@xvault.dev)" },
  });
  if (!response.ok) return fetchBingFallback(search, `${response.status} ${response.statusText}`);
  const body = await response.json();
  return body.data.children.map(({ data }) => ({
    id: data.id,
    title: data.title,
    selftext: data.selftext || "",
    author: data.author,
    subreddit: data.subreddit,
    permalink: `https://www.reddit.com${data.permalink}`,
    created_utc: data.created_utc,
    num_comments: data.num_comments,
    reddit_score: data.score,
    searchLabel: search.label,
  }));
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function readXmlTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

async function fetchBingFallback(search, redditFailure) {
  const query = `site:reddit.com/r/${search.subreddit} ${search.query}`;
  const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 XvaultStudioGrowthResearch/1.0" },
  });
  if (!response.ok) throw new Error(`${redditFailure}; fallback ${response.status} ${response.statusText}`);
  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  return items
    .map((item, index) => {
      const link = readXmlTag(item, "link");
      const published = Date.parse(readXmlTag(item, "pubDate"));
      return {
        id: `${search.subreddit}-bing-${index}-${link}`,
        title: readXmlTag(item, "title"),
        selftext: readXmlTag(item, "description").replace(/<[^>]+>/g, " "),
        author: "unknown",
        subreddit: search.subreddit,
        permalink: link,
        created_utc: Number.isFinite(published) ? published / 1000 : now / 1000,
        num_comments: 0,
        reddit_score: 0,
        searchLabel: `${search.label} (search fallback)`,
      };
    })
    .filter((post) => post.permalink.includes("reddit.com/"));
}

async function main() {
  const found = [];
  const failures = [];

  for (const search of searches) {
    try {
      found.push(...await fetchSearch(search));
    } catch (error) {
      failures.push(`${search.subreddit}: ${error.message}`);
    }
    await sleep(850);
  }

  const cutoff = now - maxAgeDays * 86_400_000;
  const unique = [...new Map(found.map((post) => [post.id, post])).values()]
    .filter((post) => post.created_utc * 1000 >= cutoff)
    .map((post) => ({ ...post, leadScore: scorePost(post) }))
    .filter((post) => post.leadScore > 0)
    .sort((a, b) => b.leadScore - a.leadScore)
    .slice(0, limit);

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.LEAD_TIMEZONE || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const outputDir = path.join(process.cwd(), "growth", "daily-leads");
  const outputPath = path.join(outputDir, `${date}.md`);
  await mkdir(outputDir, { recursive: true });

  const lines = [
    `# Xvault conversation leads: ${date}`,
    "",
    "> Review each community's current rules before commenting. Never pretend to be an unaffiliated user. The goal is five useful conversations, not five links.",
    "",
    `Generated ${unique.length} candidates from posts published within ${maxAgeDays} days.`,
    "",
  ];

  if (failures.length) {
    lines.push("## Search warnings", "", ...failures.map((failure) => `- ${failure}`), "");
  }

  unique.forEach((post, index) => {
    const ageHours = Math.round((now - post.created_utc * 1000) / 3_600_000);
    const excerpt = post.selftext.replace(/\s+/g, " ").trim().slice(0, 280);
    lines.push(
      `## ${index + 1}. ${post.title}`,
      "",
      `- Community: r/${post.subreddit}`,
      `- Posted: approximately ${ageHours} hours ago by u/${post.author}`,
      `- Discussion: ${post.num_comments} comments, Reddit score ${post.reddit_score}`,
      `- Relevance score: ${post.leadScore}`,
      `- Link: ${post.permalink}`,
      `- Approach: ${recommendedApproach(post)}`,
      excerpt ? `- Context: ${excerpt}${post.selftext.length > 280 ? "..." : ""}` : "- Context: Title only.",
      "",
      "Draft notes:",
      "",
      "- What specific part of their problem can we answer?",
      "- Can we help without mentioning Xvault?",
      "- If Xvault is relevant, have we disclosed that Arthur built it?",
      "",
    );
  });

  if (!unique.length) {
    lines.push(
      "## Manual searches",
      "",
      "Reddit may block automated result collection. Open these searches, sort by New, and only select posts whose community rules permit your intended response:",
      "",
      ...searches.map((search) => {
        const query = encodeURIComponent(search.query);
        return `- [${search.label} in r/${search.subreddit}](https://www.reddit.com/r/${search.subreddit}/search/?q=${query}&restrict_sr=1&sort=new&t=week)`;
      }),
      "",
      "No automatically verified candidates were found today. Do not force a promotional comment.",
      "",
    );
  }

  await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${unique.length} leads to ${outputPath}`);
  if (failures.length) console.log(`Search warnings: ${failures.join("; ")}`);
}

main().catch((error) => {
  console.error(`Could not generate lead queue: ${error.message}`);
  process.exitCode = 1;
});
