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

interface GiftCreditsEmailProps {
  name?: string;
  credits?: number;
  personalMessage?: string;
}

export default function GiftCreditsEmail({
  name = "there",
  credits = 100,
  personalMessage,
}: GiftCreditsEmailProps) {
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

      <Preview>{`You've been gifted ${credits} credits — thank you for your feedback.`}</Preview>

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

              {personalMessage && (
                <Text
                  style={{
                    margin: "0 0 20px 0",
                    fontFamily: sans,
                    fontSize: "15px",
                    color: muted,
                    lineHeight: "1.7",
                  }}
                >
                  {personalMessage}
                </Text>
              )}

              <Text
                style={{
                  margin: "0 0 24px 0",
                  fontFamily: sans,
                  fontSize: "15px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                Your feedback has been genuinely valuable — you're exactly the kind of early
                user that helps shape where this goes. As a small thank you, I've added{" "}
                <strong style={{ color: dark }}>{credits} bonus credits</strong> to your
                account. They're already there — no action needed.
              </Text>

              {/* Credits badge */}
              <div
                style={{
                  background: "#f5f3ff",
                  border: "1px solid #ddd6fe",
                  borderRadius: "10px",
                  padding: "24px",
                  marginBottom: "28px",
                  textAlign: "center" as const,
                }}
              >
                <Text
                  style={{
                    margin: "0 0 4px 0",
                    fontFamily: sans,
                    fontSize: "36px",
                    fontWeight: 700,
                    color: violet,
                    lineHeight: 1,
                  }}
                >
                  +{credits}
                </Text>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: sans,
                    fontSize: "13px",
                    color: "#6d28d9",
                  }}
                >
                  bonus credits added to your account
                </Text>
              </div>

              <Text
                style={{
                  margin: "0 0 14px 0",
                  fontFamily: sans,
                  fontSize: "15px",
                  color: muted,
                  lineHeight: "1.7",
                }}
              >
                If you're up for it, I'd love to hear more — specifically:
              </Text>

              <Text
                style={{
                  margin: "0 0 28px 0",
                  fontFamily: sans,
                  fontSize: "14px",
                  color: muted,
                  lineHeight: "1.9",
                }}
              >
                · What parts of the writing experience felt natural vs. clunky
                {"\n"}· Any bugs or moments where something just didn't work
                {"\n"}· Features that would make this essential to your writing process
                {"\n"}· Anything about the co-author that helped or frustrated you
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
                Just hit reply — I read every message personally.
              </Text>

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
                  Back to Studio
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
                Thank you for being part of this so early.
                {"\n\n"}Best,{"\n"}
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
