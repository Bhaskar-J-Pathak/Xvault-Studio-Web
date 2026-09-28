/**
 * POST /api/affiliates/apply
 *
 * Stores a public creator-partnership application, then sends the founder a
 * best-effort notification. The database remains the source of truth if email
 * delivery is temporarily unavailable.
 */

import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/auth";
import { sendAffiliateApplicationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLATFORMS = ["YouTube", "Substack", "Blog", "Podcast", "Other"];

function truncate(value: string, max: number) {
  return value.trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = truncate(String(body.name ?? ""), 120);
  const email = truncate(String(body.email ?? ""), 200).toLowerCase();
  const platform = truncate(String(body.platform ?? ""), 50);
  const url = truncate(String(body.url ?? ""), 500);
  const audienceSize = truncate(String(body.audienceSize ?? ""), 100);
  const about = truncate(String(body.about ?? ""), 2000);

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
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error("Invalid protocol");
  } catch {
    return Response.json({ error: "Enter a valid website URL" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error: insertError } = await service.from("affiliate_applications").insert({
    name,
    email,
    platform,
    url,
    audience_size: audienceSize,
    about,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return Response.json({ ok: true, alreadySubmitted: true });
    }
    console.error("affiliate:application_store_failed", { email, error: insertError.message });
    return Response.json({ error: "Failed to submit application" }, { status: 500 });
  }

  sendAffiliateApplicationEmail({ name, email, platform, url, audienceSize, about }).catch((error) => {
    console.error("affiliate:application_email_failed", { email, error });
  });

  return Response.json({ ok: true });
}
