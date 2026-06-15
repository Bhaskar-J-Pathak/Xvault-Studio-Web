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

interface ReferredWelcomeEmailProps {
  name?: string;
}

export default function ReferredWelcomeEmail({ name = "there" }: ReferredWelcomeEmailProps) {
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

      <Preview>A friend brought you here — and they added 15 credits to your account.</Preview>

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
                A friend referred you to Xvault Studio — which tells me you're probably
                a writer who takes the craft seriously. That's exactly who this is built for.
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
                As a thank you for coming in through a referral, I've added{" "}
                <span style={{ color: dark, fontWeight: 600 }}>15 bonus credits</span>{" "}
                to your account on top of the standard 100. They're already there —
                no code, nothing to activate.
              </Text>

              <Text
                style={{
                  margin: "0 0 32px 0",
                  fontFamily: sans,
                  fontSize: "15px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                Xvault is built to feel like having a real co-author who has read your
                entire story. It tracks characters, locations, plot threads, and
                continuity — and speaks up when something doesn't add up, in your voice.
              </Text>

              {/* Quick start */}
              <Text
                style={{
                  margin: "0 0 14px 0",
                  fontFamily: sans,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: muted,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                }}
              >
                Quick start — takes ~5 minutes
              </Text>

              <div
                style={{
                  background: bg,
                  borderRadius: "10px",
                  border: `1px solid ${border}`,
                  padding: "20px 24px",
                  marginBottom: "28px",
                }}
              >
                {[
                  [
                    "1. Open your studio",
                    "The guided tour sets up a pre-loaded thriller project with your AI co-author Alex already briefed on every chapter.",
                  ],
                  [
                    "2. Try the co-author",
                    "Ask Alex anything about your story. Then press Ctrl+K anywhere in the text to get an inline AI suggestion.",
                  ],
                  [
                    "3. Explore the Story Bible & World Board",
                    "Every character, location, and plot thread is extracted from your manuscript automatically — no tagging needed.",
                  ],
                ].map(([step, desc], i, arr) => (
                  <div
                    key={step}
                    style={{ marginBottom: i < arr.length - 1 ? "16px" : 0 }}
                  >
                    <Text
                      style={{
                        margin: "0 0 3px 0",
                        fontFamily: sans,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: dark,
                      }}
                    >
                      {step}
                    </Text>
                    <Text
                      style={{
                        margin: 0,
                        fontFamily: sans,
                        fontSize: "13px",
                        color: muted,
                        lineHeight: "1.6",
                      }}
                    >
                      {desc}
                    </Text>
                  </div>
                ))}
              </div>

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

              {/* Feedback ask */}
              <Text
                style={{
                  margin: "0 0 12px 0",
                  fontFamily: sans,
                  fontSize: "14px",
                  color: dark,
                  lineHeight: "1.7",
                  fontWeight: 600,
                }}
              >
                Since it's still early, I'd love your honest feedback:
              </Text>

              <Text
                style={{
                  margin: "0 0 16px 0",
                  fontFamily: sans,
                  fontSize: "14px",
                  color: muted,
                  lineHeight: "1.9",
                }}
              >
                · How well the co-author understands your story
                {"\n"}· Whether the suggestions feel helpful or intrusive
                {"\n"}· Any bugs or confusing parts
                {"\n"}· Features that would genuinely help your writing
              </Text>

              <Text
                style={{
                  margin: "0 0 28px 0",
                  fontFamily: sans,
                  fontSize: "14px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                Reply to this email or use the in-app feedback button. I read everything.
              </Text>

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
                Looking forward to seeing what you create.
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
              You're receiving this because you created an account on xvault.studio.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
