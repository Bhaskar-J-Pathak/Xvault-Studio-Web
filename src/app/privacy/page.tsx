import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Xvault Studio handles and protects your writing and personal data.",
  alternates: { canonical: "https://xvault.dev/privacy" },
};

const EFFECTIVE_DATE = "September 14, 2026";
const CONTACT_EMAIL = "arthur@xvault.dev";
const SITE_URL = "https://xvault.dev";

const promises = [
  "Your writing belongs to you.",
  "We do not sell your personal data or manuscript.",
  "We do not use your writing to train AI models.",
  "Manuscript text and form entries are masked from session replay.",
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F7FC] text-[#191724]">
      <header className="sticky top-0 z-10 border-b border-violet-950/[0.07] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/XVault.svg" alt="Xvault Studio" width={26} height={26} />
            <span className="text-sm font-semibold tracking-tight">Xvault Studio</span>
          </Link>
          <Link href="/" className="text-xs text-violet-950/50 transition-colors hover:text-violet-700">Back to home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Privacy</p>
        <h1 className="max-w-2xl font-[family-name:var(--font-fraunces)] text-4xl font-medium tracking-[-0.035em] sm:text-5xl">Your manuscript is yours.</h1>
        <p className="mt-4 text-sm text-violet-950/48">Effective {EFFECTIVE_DATE}</p>

        <section className="mt-9 rounded-3xl border border-violet-200/70 bg-white p-6 shadow-[0_18px_55px_rgba(70,45,120,0.07)] sm:p-8">
          <p className="text-sm font-semibold text-violet-900">The plain-English promise</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {promises.map((promise) => (
              <p key={promise} className="flex gap-3 text-sm leading-6 text-violet-950/65">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />{promise}
              </p>
            ))}
          </div>
          <p className="mt-5 border-t border-violet-100 pt-5 text-xs leading-5 text-violet-950/45">This summary is for clarity. The details below explain what is collected, why it is needed, and the choices you have.</p>
        </section>

        <div className="mt-12 space-y-10 text-[0.9375rem] leading-7 text-violet-950/68">
          <Section title="1. Who we are">
            <p>Xvault Studio is a browser-based writing platform available at <a href={SITE_URL}>{SITE_URL}</a>. For privacy questions or requests, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
          </Section>

          <Section title="2. Information we collect">
            <ul>
              <li><strong>Account information:</strong> your email address and, if you choose Google sign-in, basic profile information supplied by Google such as your name and profile image.</li>
              <li><strong>Your writing:</strong> manuscripts, chapters, notes, story data, settings, and content you choose to import or create.</li>
              <li><strong>AI requests:</strong> the relevant manuscript context, instructions, and generated responses needed to run the AI feature you requested.</li>
              <li><strong>Product usage:</strong> page views, feature interactions, device and browser information, and diagnostic events used to find faults and improve Xvault.</li>
              <li><strong>Billing records:</strong> plan, payment status, and transaction identifiers. Payment card details are handled by Dodo Payments and are not stored by Xvault Studio.</li>
              <li><strong>Referral information:</strong> referral relationships used to award credits.</li>
            </ul>
          </Section>

          <Section title="3. How we use information">
            <ul>
              <li>To authenticate you, save your work, and operate the features you choose.</li>
              <li>To process AI requests and maintain your Story Bible, World Board, and Story Pulse.</li>
              <li>To process payments, allocate credits, and send essential account messages.</li>
              <li>To diagnose errors, prevent misuse, and understand where the product needs improvement.</li>
              <li>To meet legal obligations and enforce our Terms.</li>
            </ul>
            <p>We do not sell personal data, use your manuscript for advertising, or use it to train AI models.</p>
          </Section>

          <Section title="4. AI processing">
            <p>When you use an AI feature, Xvault sends the instructions and only the story context needed for that request to Google&apos;s Vertex AI services. Google states that customer data is not used to train or fine-tune models without permission. Google may temporarily process or retain some data for service operation, caching, or abuse monitoring under its terms. Read Google&apos;s <a href="https://cloud.google.com/vertex-ai/generative-ai/docs/vertex-ai-zero-data-retention" target="_blank" rel="noopener noreferrer">Vertex AI data retention documentation</a>.</p>
            <p>AI responses can be inaccurate. You decide whether to keep, edit, or discard generated text.</p>
          </Section>

          <Section title="5. Storage, security, and retention">
            <p>Account and manuscript data is stored through Supabase in the cloud region configured for the Xvault project. We use encrypted connections and access controls designed to keep each account&apos;s private data separate. No online service can promise absolute security.</p>
            <p>We keep account data while your account is active and as needed for security, billing, and legal obligations. You can request deletion by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We aim to complete verified deletion requests within 30 days, except for records we must retain by law or for legitimate fraud and payment disputes.</p>
          </Section>

          <Section title="6. Analytics and session replay">
            <p>We use PostHog to see which features are used and where people encounter problems. Session replay may record interface interactions, but manuscript areas, prompts, form values, and other marked private text are masked. We do not intentionally record the words in your manuscript. Xvault also respects your browser&apos;s Do Not Track setting.</p>
          </Section>

          <Section title="7. Sharing your work">
            <p>Manuscripts are private by default. If you deliberately create a reading or sharing link, the shared copy can be viewed by anyone who receives that link. Do not create a public link for content you want to keep private.</p>
          </Section>

          <Section title="8. Service providers">
            <p>We use providers only where needed to operate Xvault:</p>
            <ul>
              <li><strong>Supabase:</strong> authentication, database, and file storage. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a></li>
              <li><strong>Google Cloud Vertex AI:</strong> AI inference. <a href="https://cloud.google.com/terms/cloud-privacy-notice" target="_blank" rel="noopener noreferrer">Privacy notice</a></li>
              <li><strong>PostHog:</strong> product analytics and masked session replay. <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a></li>
              <li><strong>Resend:</strong> transactional email. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy policy</a></li>
              <li><strong>Dodo Payments:</strong> checkout and payment processing. <a href="https://dodopayments.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy policy</a></li>
            </ul>
          </Section>

          <Section title="9. Cookies and legal bases">
            <p>Xvault uses necessary cookies to keep you signed in and a first-party analytics identifier to understand sessions. Where data protection law applies, we process data to perform our contract with you, pursue legitimate interests such as security and product improvement, comply with law, or rely on consent where required.</p>
          </Section>

          <Section title="10. Your choices and rights">
            <p>Depending on where you live, you may have rights to access, correct, export, restrict, object to, or delete personal data, and to withdraw consent. Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We may need to verify that the request belongs to you and will respond within the period required by applicable law.</p>
          </Section>

          <Section title="11. Children">
            <p>Xvault Studio is not directed to children under 13, and we do not knowingly collect their personal data. Contact us if you believe a child has provided personal data.</p>
          </Section>

          <Section title="12. Changes and contact">
            <p>We will post updates here and provide notice of material changes where required. Questions and privacy requests can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
          </Section>
        </div>

        <div className="mt-16 flex items-center gap-6 border-t border-violet-950/[0.07] pt-8 text-xs text-violet-950/45">
          <Link href="/terms" className="transition-colors hover:text-violet-700">Terms of Service</Link>
          <Link href="/" className="transition-colors hover:text-violet-700">Back to home</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold tracking-tight text-[#211B32]">{title}</h2>
      <div className="space-y-3 [&_a]:text-violet-700 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-violet-950/80 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">{children}</div>
    </section>
  );
}
