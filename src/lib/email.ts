import { Resend } from "resend";
import { render } from "@react-email/render";
import * as React from "react";

import WelcomeEmail from "@/emails/welcome";
import ReferredWelcomeEmail from "@/emails/referred-welcome";
import ReferralCompleteEmail from "@/emails/referral-complete";
import RetroTourEmail from "@/emails/retro-tour";
import GiftCreditsEmail from "@/emails/gift-credits";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "arthur@xvault.dev";

// ── 1. Normal onboarding welcome ──────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://xvault.studio";
  const html = await render(React.createElement(WelcomeEmail, { name, dashboardUrl: `${appUrl}/dashboard` }));
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Xvault Studio",
    replyTo: FROM,
    html,
  });
}

// ── 2. Retro tour blast — sent once to users who missed the onboarding bug ──

export async function sendRetroTourEmail(to: string): Promise<void> {
  const html = await render(React.createElement(RetroTourEmail));
  await resend.emails.send({
    from: FROM,
    to,
    subject: "We owe you a tour — it's ready now",
    html,
  });
}

// ── 3. Welcome for a user who was referred (+15 bonus credits) ────────────

export async function sendReferredWelcomeEmail(to: string, name?: string): Promise<void> {
  const html = await render(React.createElement(ReferredWelcomeEmail, { name }));
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Xvault Studio — and a little bonus",
    replyTo: FROM,
    html,
  });
}

// ── 4. Notification to the referrer when their referral completes ─────────

export async function sendReferralCompleteEmail(
  to: string,
  referralCount: number,
  totalBonusCredits: number,
  name?: string,
): Promise<void> {
  const html = await render(
    React.createElement(ReferralCompleteEmail, { name, referralCount, totalBonusCredits }),
  );
  await resend.emails.send({
    from: FROM,
    to,
    subject: "+30 credits — your referral just got started",
    replyTo: FROM,
    html,
  });
}

// ── 5. Manual gift credits email (sent to a specific user by admin) ────────

export async function sendGiftCreditsEmail(
  to: string,
  opts: { credits?: number; name?: string; personalMessage?: string },
): Promise<void> {
  const html = await render(
    React.createElement(GiftCreditsEmail, {
      name:            opts.name,
      credits:         opts.credits ?? 100,
      personalMessage: opts.personalMessage,
    }),
  );
  await resend.emails.send({
    from:    FROM,
    to,
    subject: `+${opts.credits ?? 100} credits — a thank you from Xvault`,
    replyTo: FROM,
    html,
  });
}

// ── 6. Affiliate application notification (to Bhaskar) ───────────────────

export async function sendAffiliateApplicationEmail(opts: {
  name: string;
  email: string;
  platform: string;
  url: string;
  audienceSize: string;
  about: string;
}): Promise<void> {
  const safe = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f6f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e8e4df;overflow:hidden;">
        <tr><td style="height:4px;background:#7c3aed;"></td></tr>
        <tr><td style="padding:32px 36px 28px;">
          <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:0.07em;text-transform:uppercase;">New Affiliate Application</p>
          <h2 style="margin:0 0 28px 0;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">${safe(opts.name)}</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:16px;">
              <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:0.07em;text-transform:uppercase;">Email</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;">${safe(opts.email)}</p>
            </td></tr>
            <tr><td style="padding-bottom:16px;">
              <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:0.07em;text-transform:uppercase;">Platform</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;">${safe(opts.platform)}</p>
            </td></tr>
            <tr><td style="padding-bottom:16px;">
              <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:0.07em;text-transform:uppercase;">URL / Handle</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;">${safe(opts.url)}</p>
            </td></tr>
            <tr><td style="padding-bottom:16px;">
              <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:0.07em;text-transform:uppercase;">Audience Size</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;">${safe(opts.audienceSize)}</p>
            </td></tr>
            <tr><td style="padding-bottom:0;">
              <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:0.07em;text-transform:uppercase;">About their audience</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;">${safe(opts.about)}</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from:    FROM,
    to:      FROM,
    subject: `[Affiliate Application] ${opts.name} — ${opts.platform}`,
    html,
  });
}

// ── 7. Internal feedback notification (to Bhaskar) ────────────────────────

const MOOD_LABEL: Record<string, string> = {
  good: "😊 Good",
  meh:  "😐 Meh",
  bad:  "😞 Bad",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function section(label: string, content: string): string {
  const safe = escapeHtml(content);
  return `
    <tr>
      <td style="padding-bottom:20px;">
        <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:0.07em;text-transform:uppercase;">${label}</p>
        <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;">${safe}</p>
      </td>
    </tr>`;
}

export async function sendFeedbackNotification({
  kind,
  mood,
  message,
  expectation,
  loved,
  broke,
  bugs,
  wishlist,
  page,
  userEmail,
}: {
  kind:        "general" | "founder_help" | "expectation";
  mood:       string;
  message?:   string;
  expectation?: string;
  loved?:     string;
  broke?:     string;
  bugs?:      string;
  wishlist?:  string;
  page:       string | null;
  userEmail:  string | null;
}): Promise<void> {
  const kindLabel = kind === "founder_help"
    ? "Founder help request"
    : kind === "expectation"
      ? "Experience feedback"
      : "Product feedback";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://xvault.dev").replace(/\/$/, "");
  const pageUrl = page?.startsWith("/") ? `${appUrl}${page}` : null;
  const safeUserEmail = userEmail ? escapeHtml(userEmail) : null;
  const safePage = page ? escapeHtml(page) : null;
  const safePageUrl = pageUrl ? escapeHtml(pageUrl) : null;
  const sections = [
    expectation && section("What they expected", expectation),
    message && section(kind === "founder_help" ? "What they need help with" : "Their message", message),
    loved    && section("What they loved",              loved),
    broke    && section("What broke / frustrated them", broke),
    bugs     && section("Bugs reported",                bugs),
    wishlist && section("Wishlist / feature ideas",     wishlist),
  ].filter(Boolean).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #ddd6fe;overflow:hidden;box-shadow:0 16px 40px rgba(76,29,149,.08);">
        <tr><td style="height:5px;background:#7c3aed;"></td></tr>
        <tr><td style="padding:32px 36px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;"><tr>
            <td><p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#7c3aed;letter-spacing:.09em;text-transform:uppercase;">${kindLabel}</p><h2 style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-.4px;">${MOOD_LABEL[mood] ?? mood}</h2></td>
            <td align="right"><span style="display:inline-block;border-radius:999px;background:#f5f3ff;color:#6d28d9;padding:7px 11px;font-size:11px;font-weight:600;">Xvault Studio</span></td>
          </tr></table>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${sections || `<tr><td style="padding-bottom:20px;font-size:14px;color:#6b7280;">(No details provided)</td></tr>`}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e4df;padding-top:20px;">
            <tr>
              <td style="font-size:12px;color:#9ca3af;padding-bottom:8px;">Writer</td>
              <td align="right" style="font-size:12px;color:#4b5563;padding-bottom:8px;">${safeUserEmail ?? "Anonymous visitor"}</td>
            </tr>
            ${page ? `<tr>
              <td style="font-size:12px;color:#9ca3af;">Screen</td>
              <td align="right" style="font-size:12px;color:#4b5563;">${safePage}</td>
            </tr>` : ""}
          </table>
          ${(userEmail || pageUrl) ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
            ${safeUserEmail ? `<td><a href="mailto:${safeUserEmail}" style="display:inline-block;border-radius:10px;background:#171717;color:#fff;padding:11px 16px;text-decoration:none;font-size:13px;font-weight:600;">Reply to writer</a></td>` : ""}
            ${safePageUrl ? `<td align="right"><a href="${safePageUrl}" style="color:#6d28d9;text-decoration:none;font-size:13px;font-weight:600;">Open this screen →</a></td>` : ""}
          </tr></table>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from:    FROM,
    to:      FROM,
    replyTo: userEmail ?? FROM,
    subject: `[${kindLabel}] ${MOOD_LABEL[mood] ?? mood} · ${userEmail ?? "anonymous"}`,
    html,
  });
}
