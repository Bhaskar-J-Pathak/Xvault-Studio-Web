import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const serif = "Georgia, 'Times New Roman', serif";
const sans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const ink = "#191714";
const rust = "#a6402d";
const muted = "#70695f";
const paper = "#f4f0e8";
const border = "#ded7cb";

export interface WelcomeEmailProps {
  name?: string;
  dashboardUrl?: string;
  referralBonusCredits?: number;
}

export default function WelcomeEmail({
  name = "there",
  dashboardUrl = "https://xvault.dev/dashboard",
  referralBonusCredits = 0,
}: WelcomeEmailProps) {
  const totalCredits = 100 + referralBonusCredits;

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Your Xvault Studio account is ready. Start by mapping one real manuscript problem.
      </Preview>

      <Body style={{ margin: 0, padding: 0, backgroundColor: paper }}>
        <Container style={{ maxWidth: "590px", margin: "0 auto", padding: "36px 18px" }}>
          <Section style={{ padding: "0 4px 22px", textAlign: "center" }}>
            <Text
              style={{
                margin: "0 0 5px",
                color: ink,
                fontFamily: serif,
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.3px",
              }}
            >
              Xvault Studio
            </Text>
            <Text
              style={{
                margin: 0,
                color: muted,
                fontFamily: sans,
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Your story, remembered
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#ffffff",
              border: `1px solid ${border}`,
              borderTop: `5px solid ${rust}`,
              borderRadius: "10px",
              padding: "38px 40px 34px",
            }}
          >
            <Text
              style={{
                margin: "0 0 12px",
                color: rust,
                fontFamily: sans,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Welcome to your studio
            </Text>

            <Text
              style={{
                margin: "0 0 24px",
                color: ink,
                fontFamily: serif,
                fontSize: "30px",
                lineHeight: "1.22",
                letterSpacing: "-0.7px",
              }}
            >
              Your story is easier to revise when you can see it as a whole.
            </Text>

            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
              Thank you for joining Xvault Studio. I built it for the point where a manuscript
              becomes too large to hold entirely in your head.
            </Text>
            <Text style={paragraph}>
              Xvault helps you inspect the facts your story has established, the ways characters
              change, and the details that quietly disappear between chapters. It brings the
              evidence back to the page. You remain the person making every creative decision.
            </Text>

            <Section
              style={{
                margin: "28px 0",
                padding: "18px 20px",
                backgroundColor: paper,
                border: `1px solid ${border}`,
                borderRadius: "8px",
              }}
            >
              <Text
                style={{
                  margin: "0 0 4px",
                  color: ink,
                  fontFamily: sans,
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                {totalCredits} credits are ready to use
              </Text>
              <Text style={{ ...smallText, margin: 0 }}>
                Your account includes 100 welcome credits
                {referralBonusCredits > 0
                  ? ` and ${referralBonusCredits} referral bonus credits`
                  : ""}
                . No card is required to begin.
              </Text>
            </Section>

            <Text style={label}>A useful first session</Text>

            {[
              [
                "1",
                "Bring in a manuscript",
                "Import the work you want to understand. Your original file remains untouched.",
              ],
              [
                "2",
                "Let Xvault map the story",
                "Review characters, relationships, world details, plot threads, and chapter movement in one place.",
              ],
              [
                "3",
                "Investigate one real problem",
                "Start with a continuity doubt, an emotional turn, or a thread you may have left behind.",
              ],
            ].map(([number, title, description]) => (
              <Section key={number} style={{ margin: "0 0 18px" }}>
                <Text
                  style={{
                    margin: "0 0 3px",
                    color: ink,
                    fontFamily: sans,
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: rust, marginRight: "8px" }}>{number}.</span>
                  {title}
                </Text>
                <Text style={{ ...smallText, margin: "0 0 0 22px" }}>{description}</Text>
              </Section>
            ))}

            <Section style={{ margin: "30px 0 32px" }}>
              <Button
                href={dashboardUrl}
                style={{
                  backgroundColor: ink,
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontFamily: sans,
                  fontSize: "14px",
                  fontWeight: 700,
                  padding: "13px 22px",
                  textDecoration: "none",
                }}
              >
                Open Xvault Studio
              </Button>
            </Section>

            <Hr style={{ border: 0, borderTop: `1px solid ${border}`, margin: "0 0 26px" }} />

            <Text style={{ ...paragraph, color: ink, fontWeight: 700 }}>
              If you get stuck, reply to this email.
            </Text>
            <Text style={{ ...paragraph, marginBottom: 0 }}>
              Your reply comes directly to me. Tell me what you are writing or what you hoped
              Xvault would help you see, and I will point you in the right direction.
            </Text>
            <Text style={{ ...paragraph, margin: "22px 0 0", color: ink }}>
              Bhaskar
              <br />
              Founder, Xvault Studio
            </Text>
          </Section>

          <Section style={{ padding: "22px 8px 0", textAlign: "center" }}>
            <Text style={{ ...smallText, margin: 0, fontSize: "11px" }}>
              xvault.dev&nbsp;&nbsp;·&nbsp;&nbsp;support@xvault.dev
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const paragraph: React.CSSProperties = {
  margin: "0 0 15px",
  color: muted,
  fontFamily: sans,
  fontSize: "15px",
  lineHeight: "1.7",
};

const smallText: React.CSSProperties = {
  color: muted,
  fontFamily: sans,
  fontSize: "13px",
  lineHeight: "1.6",
};

const label: React.CSSProperties = {
  margin: "0 0 17px",
  color: rust,
  fontFamily: sans,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
};
