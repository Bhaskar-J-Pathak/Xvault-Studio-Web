import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Xvault Studio.",
  alternates: { canonical: "https://xvault.dev/terms" },
};

const EFFECTIVE_DATE = "September 14, 2026";
const CONTACT_EMAIL = "arthur@xvault.dev";
const SITE_URL = "https://xvault.dev";

export default function TermsPage() {
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
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Terms</p>
        <h1 className="max-w-2xl font-[family-name:var(--font-fraunces)] text-4xl font-medium tracking-[-0.035em] sm:text-5xl">Clear terms for your writing workspace.</h1>
        <p className="mt-4 text-sm text-violet-950/48">Effective {EFFECTIVE_DATE}</p>

        <section className="mt-9 rounded-3xl border border-violet-200/70 bg-white p-6 shadow-[0_18px_55px_rgba(70,45,120,0.07)] sm:p-8">
          <p className="text-sm font-semibold text-violet-900">The short version</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Promise title="You own your work" text="Xvault claims no ownership over your manuscripts or AI-assisted writing." />
            <Promise title="You stay in control" text="AI output is optional. Review, edit, keep, or discard it." />
            <Promise title="Pricing stays explicit" text="Subscriptions recur; Founder's Circle is a one-time purchase with monthly resetting credits." />
          </div>
          <p className="mt-5 border-t border-violet-100 pt-5 text-xs leading-5 text-violet-950/45">This summary does not replace the complete Terms below.</p>
        </section>

        <div className="mt-12 space-y-10 text-[0.9375rem] leading-7 text-violet-950/68">
          <Section title="1. Agreement">
            <p>By creating an account or using Xvault Studio at <a href={SITE_URL}>{SITE_URL}</a> (the &quot;Service&quot;), you agree to these Terms. If you do not agree, do not use the Service.</p>
          </Section>

          <Section title="2. Beta service">
            <p>Xvault Studio is actively being developed. Features may evolve, and occasional interruptions or defects may occur. We may modify or retire features, but we will provide reasonable notice when a change materially affects a paid plan where practical. You should keep exports or backups of work that you cannot afford to lose.</p>
          </Section>

          <Section title="3. Accounts and eligibility">
            <ul>
              <li>You must be at least 13 and legally able to agree to these Terms. If local law requires parental consent at a higher age, that consent is required.</li>
              <li>You may sign in by email passcode or a supported third-party provider such as Google. You are responsible for securing the email or provider account connected to Xvault.</li>
              <li>One person may not create multiple accounts to obtain extra trials, credits, or promotions.</li>
              <li>We may suspend access used fraudulently, unlawfully, or in material violation of these Terms.</li>
            </ul>
          </Section>

          <Section title="4. Your content">
            <p>You retain ownership of manuscripts, notes, story data, and other content you create or upload. Xvault does not claim copyright in Your Content.</p>
            <p>You give us a limited, non-exclusive licence to host, copy, and process Your Content only as needed to provide, secure, and support the Service. This includes supplying relevant context to an AI provider when you request an AI feature.</p>
            <p>We do not use Your Content to train AI models or sell it. Our team may access it only when necessary to investigate a problem you ask us to resolve, secure the Service, or comply with law.</p>
            <p>If you create a sharing link, you instruct us to make that shared copy available to anyone with the link. You remain responsible for having the rights to share it.</p>
          </Section>

          <Section title="5. AI features">
            <ul>
              <li>AI output can be inaccurate, repetitive, or unsuitable. You are responsible for reviewing what you publish.</li>
              <li>You are not required to accept generated text, and generated text does not replace professional legal, medical, or financial advice.</li>
              <li>AI features consume the credit amount shown or described in the product. Credits have no cash value and cannot be transferred.</li>
              <li>Availability and response time can be affected by third-party providers.</li>
            </ul>
          </Section>

          <Section title="6. Free access and paid plans">
            <p>New accounts currently receive a 14-day trial with 100 AI credits. After the trial, the Free plan currently includes 50 AI credits each month. Trial and Free plan limits may change for future users, but changes do not create a cash entitlement.</p>
            <p>The Hobbyist subscription renews monthly or annually according to the option shown at checkout. Its included credits reset each month and do not roll over. You can cancel future renewals, and cancellation takes effect at the end of the paid period unless applicable law requires otherwise.</p>
          </Section>

          <Section title="7. Founder&apos;s Circle lifetime access">
            <p>Founder&apos;s Circle is a one-time purchase, not a recurring subscription. It currently includes access to Xvault Studio, 500 AI credits that reset each month and do not roll over, and the founder benefits described on the pricing page.</p>
            <p>&quot;Lifetime&quot; means for as long as Xvault Studio continues to operate the Service, not the lifetime of an individual. It covers the core Xvault Studio product and does not automatically include separate future products, third-party charges, or optional add-ons. A Founder&apos;s Circle seat is personal and may not be resold or transferred.</p>
          </Section>

          <Section title="8. Payments and refunds">
            <p>Payments are processed by Dodo Payments. Xvault does not store your full payment card details. Prices, taxes, renewal terms, and any refund terms shown at checkout form part of your purchase. Nothing in these Terms limits refund or cancellation rights that cannot legally be excluded.</p>
            <p>If a charge appears incorrect, contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> promptly so we can investigate.</p>
          </Section>

          <Section title="9. Acceptable use">
            <p>You may not:</p>
            <ul>
              <li>Use the Service for unlawful content or conduct, targeted harassment, exploitation of minors, or non-consensual sexual content.</li>
              <li>Upload content you do not have the right to process or share.</li>
              <li>Evade credit limits, security controls, or account restrictions.</li>
              <li>Scrape, reverse-engineer, disrupt, overload, resell, or sublicense the Service except where law expressly permits.</li>
            </ul>
          </Section>

          <Section title="10. Xvault intellectual property">
            <p>The software, interface, branding, and non-user content are owned by or licensed to Xvault Studio. These Terms do not grant a right to copy or distribute them outside normal use of the Service.</p>
          </Section>

          <Section title="11. Service disclaimers">
            <p>To the fullest extent permitted by law, the Service is provided &quot;as is&quot; and &quot;as available&quot;. We do not promise uninterrupted operation, error-free output, or that AI output will meet a particular creative or commercial goal. Consumer rights that cannot legally be excluded remain unaffected.</p>
          </Section>

          <Section title="12. Limitation of liability">
            <p>To the fullest extent permitted by law, Xvault Studio is not liable for indirect, incidental, special, consequential, or punitive loss arising from use of the Service. Our total liability for claims relating to the Service will not exceed the amount you paid in the 12 months before the event giving rise to the claim, or USD $50, whichever is greater. This does not exclude liability that applicable law does not allow us to exclude.</p>
          </Section>

          <Section title="13. Ending use of Xvault">
            <p>You may stop using Xvault and request account deletion at any time. We may suspend or terminate an account for a material breach, security risk, unlawful activity, or if the Service is discontinued. We will provide reasonable notice where practical and legally permitted.</p>
          </Section>

          <Section title="14. Changes to these Terms">
            <p>We may update these Terms as Xvault evolves. We will give at least 14 days&apos; notice by email or in the app before a material change takes effect, unless an urgent legal or security change requires less notice.</p>
          </Section>

          <Section title="15. Governing law">
            <p>These Terms are governed by the laws of England and Wales, without regard to conflict-of-law principles. Courts in England and Wales will have jurisdiction, except where the mandatory law of your home country gives you the right to bring a claim elsewhere.</p>
          </Section>

          <Section title="16. Contact">
            <p>Questions about these Terms can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
          </Section>
        </div>

        <div className="mt-16 flex items-center gap-6 border-t border-violet-950/[0.07] pt-8 text-xs text-violet-950/45">
          <Link href="/privacy" className="transition-colors hover:text-violet-700">Privacy Policy</Link>
          <Link href="/" className="transition-colors hover:text-violet-700">Back to home</Link>
        </div>
      </main>
    </div>
  );
}

function Promise({ title, text }: { title: string; text: string }) {
  return <div><p className="text-sm font-semibold text-violet-900">{title}</p><p className="mt-1.5 text-xs leading-5 text-violet-950/50">{text}</p></div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold tracking-tight text-[#211B32]">{title}</h2>
      <div className="space-y-3 [&_a]:text-violet-700 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-violet-950/80 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">{children}</div>
    </section>
  );
}
