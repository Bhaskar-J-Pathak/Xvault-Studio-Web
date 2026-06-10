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
const dark = "#1a1a1a";
const muted = "#6b7280";
const bg = "#f6f4f0";
const card = "#ffffff";
const border = "#e8e4df";

// ─────────────────────────────────────────────────────────────────────────

export default function WelcomeEmail() {
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

      <Preview>Your studio is ready. Start writing with AI.</Preview>

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
            {/* Top accent bar */}
            <div style={{ height: "4px", background: violet }} />

            <div style={{ padding: "40px 44px 36px" }}>

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
                Your studio is ready.
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
                Welcome to Xvault Studio. You've completed setup and your account
                is live. Everything you need to write, research, and develop your
                story with AI is waiting.
              </Text>

              {/* Stats box */}
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
                        AI credits included
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
                        100 credits
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
                        Trial period
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
                        14 days
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
                        Co-author, Story Bible, Worldboard
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
                        All unlocked
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
                  Open Your Studio
                </Button>
              </div>

              <Hr
                style={{
                  border: "none",
                  borderTop: `1px solid ${border}`,
                  margin: "36px 0 28px 0",
                }}
              />

              {/* Referral nudge */}
              <Text
                style={{
                  margin: 0,
                  fontFamily: sans,
                  fontSize: "13px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                <strong style={{ color: dark, fontWeight: 600 }}>Know a writer?</strong>{" "}
                Share your referral link from the dashboard and earn up to{" "}
                <strong style={{ color: dark, fontWeight: 600 }}>+90 bonus credits</strong> —
                30 for each person who gets started.
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
              You're receiving this because you created an account on{" "}
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
