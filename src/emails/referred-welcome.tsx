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
const violetLight = "#f5f3ff";
const violetBorder = "#ddd6fe";
const dark = "#1a1a1a";
const muted = "#6b7280";
const bg = "#f6f4f0";
const card = "#ffffff";
const border = "#e8e4df";

// ─────────────────────────────────────────────────────────────────────────

export default function ReferredWelcomeEmail() {
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

      <Preview>15 bonus credits added — your studio is ready.</Preview>

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

              {/* Label */}
              <div
                style={{
                  display: "inline-block",
                  background: violetLight,
                  border: `1px solid ${violetBorder}`,
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
                    color: violet,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  Referral Bonus
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
                15 bonus credits,
                <br />
                just for showing up.
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
                A friend referred you to Xvault Studio. As a thank you, your account
                starts with extra credits — already applied, no code needed.
              </Text>

              {/* Credits breakdown */}
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
                        Referral bonus
                      </td>
                      <td
                        align="right"
                        style={{
                          fontFamily: sans,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: violet,
                          paddingBottom: "10px",
                        }}
                      >
                        +15 credits
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontFamily: sans,
                          fontSize: "13px",
                          color: muted,
                          paddingBottom: "14px",
                        }}
                      >
                        Trial credits included
                      </td>
                      <td
                        align="right"
                        style={{
                          fontFamily: sans,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: dark,
                          paddingBottom: "14px",
                        }}
                      >
                        100 credits
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        style={{
                          borderTop: `1px solid ${border}`,
                          paddingTop: "14px",
                        }}
                      />
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontFamily: sans,
                          fontSize: "13px",
                          fontWeight: 600,
                          color: dark,
                          paddingTop: "0",
                        }}
                      >
                        Total to start
                      </td>
                      <td
                        align="right"
                        style={{
                          fontFamily: sans,
                          fontSize: "15px",
                          fontWeight: 700,
                          color: dark,
                        }}
                      >
                        115 credits
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
                  Start Creating
                </Button>
              </div>

              <Hr
                style={{
                  border: "none",
                  borderTop: `1px solid ${border}`,
                  margin: "36px 0 28px 0",
                }}
              />

              {/* Own referral nudge */}
              <Text
                style={{
                  margin: 0,
                  fontFamily: sans,
                  fontSize: "13px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                Your own referral link is waiting in the dashboard. Share it and
                earn{" "}
                <strong style={{ color: dark, fontWeight: 600 }}>
                  +30 credits
                </strong>{" "}
                for each friend who gets started — up to three.
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
