import * as React from "react";
import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// ── Design tokens ──────────────────────────────────────────────────────────

const garamond = "EB Garamond, Georgia, 'Times New Roman', serif";
const sans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const violet = "#7c3aed";
const dark = "#1a1a1a";
const muted = "#6b7280";
const bg = "#f6f4f0";
const card = "#ffffff";
const border = "#e8e4df";

// ──────────────────────────────────────────────────────────────────────────

interface ReferralCompleteEmailProps {
  name?: string;
  referralCount?: number;
  totalBonusCredits?: number;
}

export default function ReferralCompleteEmail({
  name = "there",
  referralCount = 1,
  totalBonusCredits = 30,
}: ReferralCompleteEmailProps) {
  const slotsLeft = 3 - referralCount;
  const isMaxed = slotsLeft === 0;

  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="EB Garamond"
          fallbackFontFamily="Georgia"
          webFont={{
            url: "https://fonts.gstatic.com/s/ebgaramond/v29/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUA4V-e6yHgQ.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>

      <Preview>
        {isMaxed
          ? `You've hit the referral cap — ${totalBonusCredits} bonus credits total. Well earned.`
          : `Someone you referred just got started — +30 credits are in your account.`}
      </Preview>

      <Body style={{ margin: 0, padding: 0, background: bg }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}>

          {/* Brand header */}
          <Section style={{ textAlign: "center", paddingBottom: "28px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: garamond,
                fontSize: "20px",
                fontWeight: 700,
                color: dark,
                letterSpacing: "-0.3px",
              }}
            >
              Xvault Studio
            </Text>
          </Section>

          {/* Card */}
          <Section
            style={{
              background: card,
              borderRadius: "14px",
              border: `1px solid ${border}`,
              overflow: "hidden",
            }}
          >
            <div style={{ height: "4px", background: violet }} />

            <div style={{ padding: "40px 44px 36px" }}>

              <Text
                style={{
                  margin: "0 0 20px 0",
                  fontFamily: sans,
                  fontSize: "15px",
                  color: dark,
                  lineHeight: "1.7",
                }}
              >
                Hi {name},
              </Text>

              <Text
                style={{
                  margin: "0 0 16px 0",
                  fontFamily: sans,
                  fontSize: "15px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                Someone you referred just completed their setup on Xvault Studio.
                Your{" "}
                <span style={{ color: dark, fontWeight: 600 }}>+30 bonus credits</span>{" "}
                are already in your account — no action needed.
              </Text>

              {/* Credits summary */}
              <div
                style={{
                  background: bg,
                  borderRadius: "10px",
                  border: `1px solid ${border}`,
                  padding: "20px 24px",
                  margin: "24px 0 28px 0",
                }}
              >
                <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          fontFamily: sans,
                          fontSize: "13px",
                          color: muted,
                          paddingBottom: "10px",
                        }}
                      >
                        Earned this referral
                      </td>
                      <td
                        align="right"
                        style={{
                          fontFamily: sans,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: dark,
                          paddingBottom: "10px",
                        }}
                      >
                        +30 credits
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontFamily: sans,
                          fontSize: "13px",
                          color: muted,
                          paddingBottom: "10px",
                        }}
                      >
                        Total bonus credits
                      </td>
                      <td
                        align="right"
                        style={{
                          fontFamily: sans,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: dark,
                          paddingBottom: "10px",
                        }}
                      >
                        {totalBonusCredits}
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontFamily: sans,
                          fontSize: "13px",
                          color: muted,
                        }}
                      >
                        Referrals completed
                      </td>
                      <td
                        align="right"
                        style={{
                          fontFamily: sans,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: dark,
                        }}
                      >
                        {referralCount} / 3
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Contextual message */}
              {isMaxed ? (
                <Text
                  style={{
                    margin: "0 0 28px 0",
                    fontFamily: sans,
                    fontSize: "15px",
                    color: muted,
                    lineHeight: "1.7",
                  }}
                >
                  You've hit the three-referral cap, so this is the last of the
                  bonus credits. You've earned{" "}
                  <span style={{ color: dark, fontWeight: 600 }}>
                    {totalBonusCredits} bonus credits total
                  </span>{" "}
                  — they're permanently part of your account. That's genuinely
                  helpful to us at this stage, and I appreciate it.
                </Text>
              ) : (
                <Text
                  style={{
                    margin: "0 0 28px 0",
                    fontFamily: sans,
                    fontSize: "15px",
                    color: muted,
                    lineHeight: "1.7",
                  }}
                >
                  You still have{" "}
                  <span style={{ color: dark, fontWeight: 600 }}>
                    {slotsLeft} referral slot{slotsLeft !== 1 ? "s" : ""} remaining
                  </span>
                  . If you know other writers who'd get something out of this, your
                  referral link is in the dashboard.
                </Text>
              )}

              {/* CTA */}
              <div style={{ marginBottom: "32px" }}>
                <Button
                  href="https://xvault.studio/dashboard"
                  style={{
                    display: "inline-block",
                    background: violet,
                    color: "#ffffff",
                    fontFamily: sans,
                    fontSize: "14px",
                    fontWeight: 600,
                    textDecoration: "none",
                    borderRadius: "8px",
                    padding: "13px 28px",
                    letterSpacing: "0.01em",
                  }}
                >
                  Open Your Studio
                </Button>
              </div>

              <Hr
                style={{
                  border: "none",
                  borderTop: `1px solid ${border}`,
                  margin: "0 0 28px 0",
                }}
              />

              {/* Sign-off */}
              <Text
                style={{
                  margin: 0,
                  fontFamily: sans,
                  fontSize: "14px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                Thanks for helping spread the word — it really does make a
                difference at this stage.
                {"\n\n"}Best,
                {"\n"}
                <span style={{ color: dark, fontWeight: 600 }}>Bhaskar</span>
                {"\n"}
                <span style={{ fontSize: "12px" }}>Founder, Xvault Studio</span>
              </Text>

            </div>
          </Section>

          {/* Footer */}
          <Section style={{ paddingTop: "24px", textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: sans,
                fontSize: "12px",
                color: "#9ca3af",
                lineHeight: "1.6",
              }}
            >
              You're receiving this because you have an account on xvault.studio.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
