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

// ── 6. Internal feedback notification (to Bhaskar) ────────────────────────

const MOOD_LABEL: Record<string, string> = {
  good: "😊 Good",
  meh:  "😐 Meh",
  bad:  "😞 Bad",
};

function section(label: string, content: string): string {
  const safe = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
    <tr>
      <td style="padding-bottom:20px;">
        <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:0.07em;text-transform:uppercase;">${label}</p>
        <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;">${safe}</p>
      </td>
    </tr>`;
}

export async function sendFeedbackNotification({
  mood,
  loved,
  broke,
  bugs,
  wishlist,
  page,
  userEmail,
}: {
  mood:       string;
  loved?:     string;
  broke?:     string;
  bugs?:      string;
  wishlist?:  string;
  page:       string | null;
  userEmail:  string | null;
}): Promise<void> {
  const sections = [
    loved    && section("What they loved",              loved),
    broke    && section("What broke / frustrated them", broke),
    bugs     && section("Bugs reported",                bugs),
    wishlist && section("Wishlist / feature ideas",     wishlist),
  ].filter(Boolean).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f6f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e8e4df;overflow:hidden;">
        <tr><td style="height:4px;background:#7c3aed;"></td></tr>
        <tr><td style="padding:32px 36px 28px;">
          <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#7c3aed;letter-spacing:0.07em;text-transform:uppercase;">Beta Feedback</p>
          <h2 style="margin:0 0 28px 0;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">${MOOD_LABEL[mood] ?? mood}</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${sections || `<tr><td style="padding-bottom:20px;font-size:14px;color:#6b7280;">(No details provided)</td></tr>`}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e4df;padding-top:20px;">
            <tr>
              <td style="font-size:12px;color:#9ca3af;padding-bottom:6px;">From</td>
              <td align="right" style="font-size:12px;color:#6b7280;padding-bottom:6px;">${userEmail ?? "anonymous"}</td>
            </tr>
            ${page ? `<tr>
              <td style="font-size:12px;color:#9ca3af;">Page</td>
              <td align="right" style="font-size:12px;color:#6b7280;">${page}</td>
            </tr>` : ""}
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
    subject: `[Feedback] ${MOOD_LABEL[mood] ?? mood} — ${userEmail ?? "anon"}`,
    html,
  });
}
