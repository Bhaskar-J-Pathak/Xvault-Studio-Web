import * as React from "react";
import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// ── Design tokens ─────────────────────────────────────────────────────────

const garamond = "EB Garamond, Georgia, 'Times New Roman', serif";
const sans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const violet = "#7c3aed";
const green = "#059669";
const greenLight = "#ecfdf5";
const greenBorder = "#a7f3d0";
const dark = "#1a1a1a";
const muted = "#6b7280";
const bg = "#f6f4f0";
const card = "#ffffff";
const border = "#e8e4df";

// ─────────────────────────────────────────────────────────────────────────

interface ReferralCompleteEmailProps {
  referralCount: number;
  totalBonusCredits: number;
}

export default function ReferralCompleteEmail({
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

      <Preview>+30 credits — your referral just completed their setup.</Preview>

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
            {/* Top accent bar — green for the "earned" state */}
            <div style={{ height: "4px", background: green }} />

            <div style={{ padding: "40px 44px 36px" }}>

              {/* Label */}
              <div
                style={{
                  display: "inline-block",
                  background: greenLight,
                  border: `1px solid ${greenBorder}`,
                  borderRadius: "100px",
                  padding: "4px 12px",
                  marginBottom: "20px",
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontFamily: sans,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: green,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  Referral Complete
                </Text>
              </div>

              {/* Headline */}
              <Text
                style={{
                  margin: "0 0 6px 0",
                  fontFamily: garamond,
                  fontSize: "36px",
                  fontWeight: 700,
                  color: dark,
                  lineHeight: "1.1",
                  letterSpacing: "-0.8px",
                }}
              >
                +30 credits earned.
              </Text>

              <Text
                style={{
                  margin: "16px 0 0 0",
                  fontFamily: sans,
                  fontSize: "15px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                Someone you referred just completed their setup. Your 30 bonus
                credits are already applied to your account.
              </Text>

              {/* Stats */}
              <div
                style={{
                  margin: "28px 0 0 0",
                  background: bg,
                  borderRadius: "10px",
                  border: `1px solid ${border}`,
                  padding: "20px 24px",
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
                          color: green,
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

              {/* CTA */}
              <div style={{ marginTop: "32px" }}>
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
                  View Your Studio
                </Button>
              </div>

              <Hr
                style={{
                  border: "none",
                  borderTop: `1px solid ${border}`,
                  margin: "36px 0 28px 0",
                }}
              />

              {/* Contextual footer note */}
              {isMaxed ? (
                <Text
                  style={{
                    margin: 0,
                    fontFamily: sans,
                    fontSize: "13px",
                    color: muted,
                    lineHeight: "1.7",
                  }}
                >
                  You've reached the 3-referral maximum.{" "}
                  <strong style={{ color: dark, fontWeight: 600 }}>
                    {totalBonusCredits} bonus credits total
                  </strong>{" "}
                  are now permanently part of your account. Well earned.
                </Text>
              ) : (
                <Text
                  style={{
                    margin: 0,
                    fontFamily: sans,
                    fontSize: "13px",
                    color: muted,
                    lineHeight: "1.7",
                  }}
                >
                  You have{" "}
                  <strong style={{ color: dark, fontWeight: 600 }}>
                    {slotsLeft} referral slot{slotsLeft !== 1 ? "s" : ""} remaining
                  </strong>
                  . Share your link from the dashboard to keep earning.
                </Text>
              )}
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
              You're receiving this because you have an account on{" "}
              <Link
                href="https://xvault.studio"
                style={{ color: "#9ca3af", textDecoration: "underline" }}
              >
                xvault.studio
              </Link>
              .
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
