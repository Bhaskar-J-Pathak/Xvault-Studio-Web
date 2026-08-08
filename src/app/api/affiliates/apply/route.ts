/**
 * POST /api/affiliates/apply
 *
 * Accepts a public affiliate program application and emails
 * a notification to the founder. No auth required.
 *
 * Body: {
 *   name:         string
 *   email:        string
 *   platform:     string  — "YouTube" | "Substack" | "Blog" | "Podcast" | "Other"
 *   url:          string  — channel / newsletter / website URL
 *   audienceSize: string  — rough self-reported size
 *   about:        string  — description of their audience and content
 * }
 */

import { NextRequest } from "next/server";
import { sendAffiliateApplicationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLATFORMS = ["YouTube", "Substack", "Blog", "Podcast", "Other"];

function truncate(s: string, max: number) {
  return s.trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name         = truncate(String(body.name         ?? ""), 120);
  const email        = truncate(String(body.email        ?? ""), 200);
  const platform     = truncate(String(body.platform     ?? ""), 50);
  const url          = truncate(String(body.url          ?? ""), 500);
  const audienceSize = truncate(String(body.audienceSize ?? ""), 100);
  const about        = truncate(String(body.about        ?? ""), 2000);

  if (!name || !email || !platform || !url || !audienceSize || !about) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!PLATFORMS.includes(platform)) {
    return Response.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    await sendAffiliateApplicationEmail({ name, email, platform, url, audienceSize, about });
  } catch (e) {
    console.error("[affiliates/apply] Email failed:", e);
    return Response.json({ error: "Failed to submit application" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
