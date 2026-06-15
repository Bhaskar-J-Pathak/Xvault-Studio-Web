import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Xvault Studio",
  description: "The terms that govern your use of Xvault Studio.",
};

const EFFECTIVE_DATE = "June 15, 2026";
const CONTACT_EMAIL  = "arthur@xvault.dev";
const SITE_URL       = "https://xvault.studio";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-[#1a1a1a]/45 mb-12">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <div className="prose prose-stone max-w-none space-y-10 text-[0.9375rem] leading-relaxed text-[#1a1a1a]/75">

          <Section title="1. Acceptance of terms">
            <p>
              By creating an account or using Xvault Studio at{" "}
              <a href={SITE_URL} className="text-violet-600 underline underline-offset-2">
                {SITE_URL}
              </a>{" "}
              (&quot;the Service&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree, do not use the Service. These Terms
              form a binding agreement between you and Xvault Studio
              (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            </p>
          </Section>

          <Section title="2. Beta status">
            <p>
              Xvault Studio is currently in <strong>beta</strong>. The Service is provided
              as-is and may change, be interrupted, or be discontinued at any time.
              Features shown in marketing materials may not yet be available or may work
              differently during the beta period. We reserve the right to modify or
              discontinue any feature without notice.
            </p>
          </Section>

          <Section title="3. Eligibility and accounts">
            <ul>
              <li>You must be at least 13 years old to use the Service.</li>
              <li>
                You are responsible for maintaining the security of your account. We use
                OTP (one-time passcode) authentication — keep your email account secure.
              </li>
              <li>
                You may only have one account per person. Creating multiple accounts to
                gain additional free credits or trial access is prohibited.
              </li>
              <li>
                We reserve the right to suspend or terminate accounts that violate these
                Terms.
              </li>
            </ul>
          </Section>

          <Section title="4. Your content">
            <p>
              You retain full ownership of all writing, stories, notes, and other content
              you create within the Service (&quot;Your Content&quot;). We do not claim any
              intellectual property rights over Your Content.
            </p>
            <p>
              By using the Service, you grant us a limited, non-exclusive licence to store
              and process Your Content solely to provide the Service — for example, to save
              your projects, generate AI responses in context, and create search embeddings
              for Story Bible features. This licence ends when you delete your content or
              account.
            </p>
            <p>
              Your Content is not used to train AI models, shared with third parties for
              marketing purposes, or accessed by our team except where strictly necessary
              to resolve a technical issue you have reported.
            </p>
          </Section>

          <Section title="5. AI features and limitations">
            <p>
              The Service uses third-party AI models to power features including the
              co-author, ghostwriter (Ctrl+K), Global Change, and Story Bible analysis.
              You acknowledge that:
            </p>
            <ul>
              <li>AI-generated content may be inaccurate, incomplete, or unsuitable.</li>
              <li>
                You are solely responsible for reviewing and approving any AI-generated
                text before incorporating it into your work.
              </li>
              <li>
                AI credits are consumed each time you use an AI feature. Credit limits
                vary by plan. Credits do not carry over between billing periods for paid
                plans.
              </li>
              <li>
                We do not guarantee any specific level of AI quality, availability, or
                response time.
              </li>
            </ul>
          </Section>

          <Section title="6. Trial period and paid plans">
            <p>
              New accounts receive a 14-day trial with 100 AI credits. After the trial
              ends, AI features require a paid subscription. Trial credits are
              non-transferable and cannot be exchanged for cash.
            </p>
            <p>
              Paid subscriptions are billed in advance. All payments are processed by
              Dodo Payments. We do not store payment card details. Refunds are handled
              on a case-by-case basis — contact{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-600 underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>{" "}
              within 7 days of a charge if you believe an error occurred.
            </p>
          </Section>

          <Section title="7. Prohibited uses">
            <p>You may not use the Service to:</p>
            <ul>
              <li>Generate, store, or distribute content that is illegal in your jurisdiction.</li>
              <li>
                Produce content that depicts or promotes harm to minors, non-consensual
                acts, or targeted harassment of real individuals.
              </li>
              <li>Attempt to reverse-engineer, scrape, or abuse the AI APIs.</li>
              <li>Circumvent rate limits, credit systems, or account restrictions.</li>
              <li>Resell or sublicence access to the Service.</li>
              <li>
                Use automated scripts to interact with the Service in ways that disrupt
                normal operation.
              </li>
            </ul>
          </Section>

          <Section title="8. Intellectual property">
            <p>
              All software, design, branding, and non-user content on the Service is
              owned by or licensed to Xvault Studio and is protected by intellectual
              property law. You may not copy, modify, or distribute any part of the
              Service without our written permission.
            </p>
          </Section>

          <Section title="9. Disclaimers">
            <p>
              The Service is provided <strong>&quot;as is&quot;</strong> and{" "}
              <strong>&quot;as available&quot;</strong> without warranties of any kind,
              express or implied, including but not limited to warranties of
              merchantability, fitness for a particular purpose, or non-infringement.
              We do not warrant that the Service will be uninterrupted, error-free, or
              that any defects will be corrected.
            </p>
          </Section>

          <Section title="10. Limitation of liability">
            <p>
              To the fullest extent permitted by law, Xvault Studio shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages,
              including loss of data, loss of profits, or loss of business, arising from
              your use of or inability to use the Service — even if we have been advised
              of the possibility of such damages.
            </p>
            <p>
              Our total liability to you for any claim arising out of or relating to
              these Terms or the Service shall not exceed the amount you paid us in the
              12 months preceding the claim, or USD $50, whichever is greater.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              You may stop using the Service and request account deletion at any time by
              emailing{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-600 underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>
              . We may suspend or terminate your account if you breach these Terms or if
              we discontinue the Service, with reasonable notice where possible.
            </p>
          </Section>

          <Section title="12. Changes to these terms">
            <p>
              We may update these Terms from time to time. We will notify you of material
              changes by email or via an in-app notice at least 14 days before they take
              effect. Continued use of the Service after that date constitutes acceptance
              of the revised Terms.
            </p>
          </Section>

          <Section title="13. Governing law">
            <p>
              These Terms are governed by and construed in accordance with the laws of
              England and Wales, without regard to conflict of law principles. Any disputes
              shall be subject to the exclusive jurisdiction of the courts of England and
              Wales.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              Questions about these Terms:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-600 underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>

        </div>

        <div className="mt-16 pt-8 border-t border-black/[0.06] flex items-center gap-6 text-xs text-[#1a1a1a]/35">
          <Link href="/privacy" className="hover:text-[#1a1a1a]/60 transition-colors">
            Privacy Policy
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
