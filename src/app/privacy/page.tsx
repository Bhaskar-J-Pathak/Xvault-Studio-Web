import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Xvault Studio",
  description: "How Xvault Studio collects, uses, and protects your data.",
};

const EFFECTIVE_DATE = "June 15, 2026";
const CONTACT_EMAIL  = "arthur@xvault.dev";
const SITE_URL       = "https://xvault.studio";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f6f4f0]">

      {/* Nav */}
      <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/XVault.svg" alt="Xvault Studio" width={26} height={26} />
            <span className="font-semibold text-sm tracking-tight text-[#1a1a1a]">
              Xvault Studio
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16">

        <p className="text-xs font-semibold uppercase tracking-widest text-[#1a1a1a]/35 mb-3">
          Legal
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#1a1a1a] mb-4"
            style={{ fontFamily: "var(--font-garamond), Georgia, serif" }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-[#1a1a1a]/45 mb-12">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <div className="prose prose-stone max-w-none space-y-10 text-[0.9375rem] leading-relaxed text-[#1a1a1a]/75">

          <Section title="1. Who we are">
            <p>
              Xvault Studio (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a browser-based writing platform
              for novelists and long-form fiction authors, available at{" "}
              <a href={SITE_URL} className="text-violet-600 underline underline-offset-2">
                {SITE_URL}
              </a>
              . Questions about this policy can be sent to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-600 underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="2. What data we collect">
            <p>We collect only what is necessary to provide the service:</p>
            <ul>
              <li>
                <strong>Account data</strong> — your email address, collected when you sign
                up via one-time passcode (OTP). We do not store passwords.
              </li>
              <li>
                <strong>Writing content</strong> — projects, chapters, notes, and any story
                content you create inside the editor. This is stored in your account and is
                not used for any purpose other than delivering the service to you.
              </li>
              <li>
                <strong>Usage data</strong> — page views, feature interactions, and session
                data, collected via PostHog (see Section 5) to help us understand how the
                product is used and where to improve it.
              </li>
              <li>
                <strong>AI interactions</strong> — messages sent to your AI co-author and
                the responses generated. These are processed by a third-party AI provider
                and are not used to train any AI model.
              </li>
              <li>
                <strong>Referral data</strong> — if you refer another user, we record the
                referral relationship to award bonus credits.
              </li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <ul>
              <li>To authenticate you and manage your account.</li>
              <li>To store and serve your writing projects.</li>
              <li>To power AI features (co-author, ghostwriter, Story Bible, World Board).</li>
              <li>To send transactional emails — account confirmation, welcome, and
                  credit/referral notifications.</li>
              <li>To understand product usage and improve the service.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p>
              We do not sell your personal data. We do not use your writing content
              to train AI models or for advertising.
            </p>
          </Section>

          <Section title="4. Data storage and security">
            <p>
              Your data is stored in Supabase (PostgreSQL, hosted on AWS in the
              United States). Row-Level Security (RLS) is enforced on all tables —
              each user can only access their own data. Data is encrypted in transit
              (TLS) and at rest.
            </p>
            <p>
              We retain your data for as long as your account exists. You may request
              deletion at any time by emailing{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-600 underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>
              . Account deletion removes all associated projects, chapters, and profile
              data within 30 days.
            </p>
          </Section>

          <Section title="5. Third-party services">
            <p>We use the following third-party providers. Each has their own privacy policy:</p>
            <ul>
              <li>
                <strong>Supabase</strong> — authentication and database hosting.{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer"
                   className="text-violet-600 underline underline-offset-2">
                  supabase.com/privacy
                </a>
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery.{" "}
                <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
                   className="text-violet-600 underline underline-offset-2">
                  resend.com/legal/privacy-policy
                </a>
              </li>
              <li>
                <strong>PostHog</strong> — product analytics and session recording.
                Analytics data is anonymised where possible.{" "}
                <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer"
                   className="text-violet-600 underline underline-offset-2">
                  posthog.com/privacy
                </a>
              </li>
              <li>
                <strong>Google Gemini / OpenRouter</strong> — AI inference for co-author
                features. Your content is sent to these services solely to generate AI
                responses and is not retained or used for training.
              </li>
            </ul>
          </Section>

          <Section title="6. Cookies and tracking">
            <p>
              We use cookies solely to maintain your authenticated session (set by
              Supabase). We do not use advertising cookies or cross-site tracking
              cookies. PostHog uses a first-party cookie for analytics session
              continuity; you can opt out by enabling &quot;Do Not Track&quot; in your browser.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>
              Depending on where you are located, you may have the right to access,
              correct, export, or delete your personal data. To exercise any of these
              rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-600 underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section title="8. Children">
            <p>
              Xvault Studio is not directed at children under 13. We do not knowingly
              collect data from children. If you believe a child has provided us with
              personal data, contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes will be
              communicated by email or by a notice in the app. The effective date at
              the top of this page will always reflect the most recent version.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For any privacy-related questions or requests:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-600 underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>

        </div>

        <div className="mt-16 pt-8 border-t border-black/[0.06] flex items-center gap-6 text-xs text-[#1a1a1a]/35">
          <Link href="/terms" className="hover:text-[#1a1a1a]/60 transition-colors">
            Terms of Service
          </Link>
          <Link href="/" className="hover:text-[#1a1a1a]/60 transition-colors">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-[#1a1a1a] mb-3 tracking-tight">
        {title}
      </h2>
      <div className="space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-violet-600 [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}
