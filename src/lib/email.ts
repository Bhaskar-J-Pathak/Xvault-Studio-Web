import { Resend } from "resend";
import { render } from "@react-email/render";
import * as React from "react";

import WelcomeEmail from "@/emails/welcome";
import ReferredWelcomeEmail from "@/emails/referred-welcome";
import ReferralCompleteEmail from "@/emails/referral-complete";
import RetroTourEmail from "@/emails/retro-tour";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "arthur@xvault.dev";

// ── 1. Normal onboarding welcome ──────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  const html = await render(React.createElement(WelcomeEmail, { name }));
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

// ── 3. Notification to the referrer when their referral completes ─────────

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

// ── 4. Internal feedback notification (to Arthur) ─────────────────────────
// Only called when the user has submitted written text — not bare mood clicks.

const MOOD_LABEL: Record<string, string> = {
  good: "😊 Good",
  meh:  "😐 Meh",
  bad:  "😞 Bad",
};

export async function sendFeedbackNotification({
  mood,
  text,
  page,
  userEmail,
}: {
  mood: string;
  text: string;
  userEmail: string | null;
  page: string | null;
}): Promise<void> {
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
          <h2 style="margin:0 0 24px 0;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">${MOOD_LABEL[mood] ?? mood}</h2>
          <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid #e8e4df;padding-top:20px;">
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
    from: FROM,
    to:   FROM, // internal — loops back to arthur@xvault.dev
    subject: `[Feedback] ${MOOD_LABEL[mood] ?? mood} — ${userEmail ?? "anon"}`,
    html,
  });
}
