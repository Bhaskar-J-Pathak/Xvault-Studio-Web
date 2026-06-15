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

export default function RetroTourEmail() {
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

      <Preview>The guided tour is ready — open your studio to see it.</Preview>

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
                We owe you a tour.
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
                When you signed up, a bug meant the guided tour of Xvault Studio
                never loaded. You landed in a blank studio with no introduction —
                which is a bad first experience, and we're sorry about that.
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
                It's been fixed. Open your studio and you'll get the full tour:
                a pre-loaded thriller project, your AI co-author Alex who has already
                read every chapter, and a walkthrough of the editor, ghostwriter,
                Story Bible, and World Board.
              </Text>

              {/* What you'll see box */}
              <div
                style={{
                  margin: "28px 0 0 0",
                  background: bg,
                  borderRadius: "10px",
                  border: `1px solid ${border}`,
                  padding: "20px 24px",
                }}
              >
                <Text
                  style={{
                    margin: "0 0 14px 0",
                    fontFamily: sans,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: muted,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  What the tour covers
                </Text>
                <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
                  <tbody>
                    {[
                      ["Editor & auto-save", "Write and pick up exactly where you left off"],
                      ["Ask Alex", "Your AI co-author who has read your whole manuscript"],
                      ["Ctrl+K ghostwriter", "Inline AI suggestions, accepted or dismissed"],
                      ["Global Change", "Rename a character across every chapter at once"],
                      ["Story Bible", "Long-term memory: style, voice, plot threads"],
                      ["World Board", "Auto-extracted characters, places, and factions"],
                    ].map(([feature, desc], i, arr) => (
                      <tr key={feature}>
                        <td
                          style={{
                            fontFamily: sans,
                            fontSize: "13px",
                            fontWeight: 600,
                            color: dark,
                            paddingBottom: i < arr.length - 1 ? "10px" : 0,
                            width: "38%",
                          }}
                        >
                          {feature}
                        </td>
                        <td
                          style={{
                            fontFamily: sans,
                            fontSize: "13px",
                            color: muted,
                            paddingBottom: i < arr.length - 1 ? "10px" : 0,
                          }}
                        >
                          {desc}
                        </td>
                      </tr>
                    ))}
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

              <Text
                style={{
                  margin: 0,
                  fontFamily: sans,
                  fontSize: "13px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                Your 14-day trial and 100 AI credits are still counting from when
                you signed up. If you feel you missed out on time because of the
                bug, reply to this email and we'll sort it out.
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
