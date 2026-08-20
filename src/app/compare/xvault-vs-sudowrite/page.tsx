import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Xvault Studio vs Sudowrite (2026): Honest Comparison",
  description: "Sudowrite is expensive and now restricts dark fiction. Xvault Studio reads your entire manuscript and doesn't police your story. Here is the honest comparison.",
  alternates: { canonical: "https://xvault.dev/compare/xvault-vs-sudowrite" },
  openGraph: {
    title: "Xvault Studio vs Sudowrite: Honest Comparison",
    description: "Pricing, manuscript memory, content restrictions, and prose quality compared honestly.",
    type: "article",
  },
};

function Yes() { return <Check size={16} className="text-emerald-500 mx-auto" />; }
function No()  { return <X    size={16} className="text-red-400   mx-auto" />; }
function Partial() { return <Minus size={16} className="text-amber-400 mx-auto" />; }

const rows: { feature: string; xvault: React.ReactNode; opponent: React.ReactNode; note?: string }[] = [
  { feature: "Free trial",                 xvault: <Yes />, opponent: <Yes />,     note: "Xvault: 14 days, 100 credits, no card. Sudowrite: 10,000 words free." },
  { feature: "Monthly price",              xvault: "$11.99", opponent: "$19–$59",  note: "Sudowrite's Hobby tier starts at $19/mo. Professional at $39/mo." },
  { feature: "Annual price",               xvault: "$119/yr", opponent: "$120–$528/yr" },
  { feature: "Lifetime option",            xvault: <Yes />, opponent: <No />,      note: "Xvault Founder's Circle: $49 lifetime." },
  { feature: "Reads full manuscript",      xvault: <Yes />, opponent: <Partial />, note: "Sudowrite has context window limits that cause it to lose character details in long manuscripts." },
  { feature: "Auto story bible",           xvault: <Yes />, opponent: <No />,      note: "Xvault extracts plot threads automatically. Sudowrite requires manual Story Bible entry." },
  { feature: "Auto world board",           xvault: <Yes />, opponent: <No /> },
  { feature: "Voice matching score",       xvault: <Yes />, opponent: <No /> },
  { feature: "Dark / mature fiction",      xvault: <Yes />, opponent: <No />,      note: "Sudowrite now issues account warnings for dark content after migrating to Claude-based models." },
  { feature: "Stable pricing history",     xvault: <Yes />, opponent: <No />,      note: "Sudowrite has restructured credits multiple times, reducing access for existing subscribers." },
  { feature: "Proprietary fiction model",  xvault: <No />,  opponent: <Yes />,     note: "Sudowrite's Muse model is fine-tuned on published novels." },
];

const comparisonSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Xvault Studio vs Sudowrite (2026): Honest Comparison",
  description:
    "Sudowrite is expensive and now restricts dark fiction. Xvault Studio reads your entire manuscript and doesn't police your story. Here is the honest comparison.",
  datePublished: "2026-08-01",
  dateModified: "2026-08-12",
  author: {
    "@type": "Organization",
    name: "Xvault Studio",
    url: "https://xvault.dev",
  },
  publisher: {
    "@type": "Organization",
    name: "Xvault Studio",
    url: "https://xvault.dev",
    logo: { "@type": "ImageObject", url: "https://xvault.dev/XVault.svg" },
  },
  url: "https://xvault.dev/compare/xvault-vs-sudowrite",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://xvault.dev/compare/xvault-vs-sudowrite",
  },
  about: [
    {
      "@type": "SoftwareApplication",
      name: "Xvault Studio",
      applicationCategory: "WritingApplication",
      url: "https://xvault.dev",
      offers: { "@type": "Offer", price: "11.99", priceCurrency: "USD" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Sudowrite",
      applicationCategory: "WritingApplication",
      url: "https://www.sudowrite.com",
      offers: { "@type": "Offer", price: "19", priceCurrency: "USD" },
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is Xvault Studio cheaper than Sudowrite?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Xvault Studio costs $11.99 per month or $119 per year. Sudowrite starts at $19 per month and goes up to $59 per month. Xvault also offers a $49 one-time lifetime access option that Sudowrite does not have.",
      },
    },
    {
      "@type": "Question",
      name: "Does Xvault Studio allow dark fiction and mature content?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Xvault Studio is built for the full range of literary fiction, including horror, dark fantasy, grimdark, and mature content. Sudowrite, after migrating to Claude-based models, began restricting dark content and has issued account warnings to writers for content within the range of published commercial fiction.",
      },
    },
    {
      "@type": "Question",
      name: "Does Xvault read the entire manuscript unlike Sudowrite?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault's AI co-author Alex reads your complete manuscript before every response. Sudowrite has context window limitations that cause it to lose track of character details and world facts in longer manuscripts, leading to suggestions that contradict things established in earlier chapters.",
      },
    },
    {
      "@type": "Question",
      name: "Which is better for horror and dark fantasy writers, Xvault or Sudowrite?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault Studio is the better choice for horror and dark fantasy writers. Sudowrite now restricts dark content after its move to Claude-based models, with writers receiving account warnings for morally dark scenarios. Xvault does not apply content restrictions that would make it unusable for dark genres.",
      },
    },
    {
      "@type": "Question",
      name: "Does Xvault Studio have a story bible?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, and it builds itself automatically. Xvault's Story Bible extracts characters, locations, factions, and plot threads from your manuscript as you write. Sudowrite requires manual entry into its Story Bible, meaning anything you forget to add is not tracked.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",       item: "https://xvault.dev" },
    { "@type": "ListItem", position: 2, name: "Compare",    item: "https://xvault.dev/compare" },
    { "@type": "ListItem", position: 3, name: "Xvault vs Sudowrite", item: "https://xvault.dev/compare/xvault-vs-sudowrite" },
  ],
};

export default function VsSudowritePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <header className="border-b border-black/[0.06] bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <Link href="/compare" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
            ← All comparisons
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-violet-600/70 mb-3">
            Comparison
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-stone-900 leading-tight mb-5">
            Xvault Studio vs Sudowrite
          </h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl">
            Sudowrite was the first serious AI writing tool built for fiction writers.
            It still has real strengths. It also has a pricing history that has left
            many writers feeling misled, and content restrictions that have made it
            unusable for horror, dark fantasy, and mature fiction.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-black/[0.06] overflow-hidden mb-14">
          <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-200 px-5 py-3">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Feature</div>
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider text-center">Xvault Studio</div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider text-center">Sudowrite</div>
          </div>
          {rows.map(({ feature, xvault, opponent, note }, i) => (
            <div key={feature} className={`grid grid-cols-3 px-5 py-4 ${i % 2 === 0 ? "bg-white" : "bg-stone-50/50"} border-b border-stone-100 last:border-0`}>
              <div>
                <p className="text-sm text-stone-700">{feature}</p>
                {note && <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">{note}</p>}
              </div>
              <div className="flex items-center justify-center text-sm font-medium text-stone-900">{xvault}</div>
              <div className="flex items-center justify-center text-sm font-medium text-stone-500">{opponent}</div>
            </div>
          ))}
        </div>

        {/* Written analysis */}
        <div className="blog-prose space-y-10">

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The Pricing Problem</h2>
            <p className="text-stone-600 leading-relaxed mb-4">Sudowrite has changed its credit system multiple times since launch. Writers who joined under "unlimited" plans found access significantly reduced after each restructure. The community shorthand for this ("so damn expensive") appears consistently in writing forums and has become part of how the tool is discussed.</p>
            <p className="text-stone-600 leading-relaxed mb-4">The current pricing is $19 to $59 per month at monthly rates, or $10 to $44 per month annually. These are not unreasonable numbers for a professional tool, but the history of changes makes writers understandably cautious about committing to an annual plan.</p>
            <p className="text-stone-600 leading-relaxed">Xvault's Hobbyist tier is $11.99 per month or $119 per year. The Founder's Circle lifetime access is $49, a one-time payment with no future credit restructures.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The Content Restriction Problem</h2>
            <p className="text-stone-600 leading-relaxed mb-4">After Sudowrite migrated to Claude-based models, its Story Engine mode began refusing content involving violence, explicit themes, and morally dark scenarios. Writers have received account warnings for content that falls within the range of published commercial and literary fiction.</p>
            <p className="text-stone-600 leading-relaxed mb-4">This is a direct product failure for horror novelists, grimdark writers, dark fantasy authors, and anyone writing fiction that deals honestly with adult themes. A writing tool that cannot follow you into the darker areas of your story is not a serious tool for serious fiction.</p>
            <p className="text-stone-600 leading-relaxed">Xvault is built for the full range of literary fiction, including work that explores darkness, moral complexity, violence, and mature content. We do not apply blanket restrictions that would make us unusable for significant genres.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Where Sudowrite Is Genuinely Better</h2>
            <p className="text-stone-600 leading-relaxed mb-4">Sudowrite's Muse model is fine-tuned specifically on published novels. This gives it a different quality of output than tools running on general-purpose models, particularly for prose at the sentence level. The Beat and Prose modes are well-designed for the specific task of generating scene-level content.</p>
            <p className="text-stone-600 leading-relaxed">If you write in genres with lighter content and can tolerate the pricing uncertainty, Sudowrite's output quality is genuinely strong. The tool has been iterated on for years and the craft-focused features show that experience.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The Manuscript Memory Difference</h2>
            <p className="text-stone-600 leading-relaxed mb-4">The central claim of Xvault is that every AI response is grounded in your complete manuscript. Alex, the AI co-author, reads everything you have written before responding to anything.</p>
            <p className="text-stone-600 leading-relaxed mb-4">Sudowrite's context window limitations mean it loses track of character details and established world facts in longer manuscripts. Writers in the Sudowrite community regularly report suggestions that contradict things established in earlier chapters, with characters behaving inconsistently and world details ignored.</p>
            <p className="text-stone-600 leading-relaxed">For a short novel or for scene-level work in isolation, this matters less. For a long, complex manuscript where continuity is load-bearing, it is a material difference.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Who Should Use What</h2>
            <p className="text-stone-600 leading-relaxed mb-3"><strong className="text-stone-800">Use Sudowrite if:</strong> You write in lighter genres, want access to the Muse model's prose quality, and are comfortable with the current pricing structure and credit system.</p>
            <p className="text-stone-600 leading-relaxed"><strong className="text-stone-800">Use Xvault if:</strong> You write horror, dark fantasy, grimdark, or mature fiction; you are writing a long manuscript where continuity matters; you want pricing that does not change after you commit; or you want a story bible and world board that build themselves.</p>
          </div>

        </div>

        {/* CTA */}
        <div className="mt-16 pt-10 border-t border-stone-200">
          <div className="rounded-2xl bg-violet-50 border border-violet-200/60 p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-violet-600 mb-2">Try it yourself</p>
            <h2 className="font-display text-2xl font-semibold text-stone-900 mb-3">
              14 days free. No credit card.
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              100 AI credits, full access to Alex, World Board, and Story Bible. Enough to know whether it works for your manuscript.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>

        <div className="mt-10">
          <Link href="/compare" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            ← Back to all comparisons
          </Link>
        </div>
      </main>
    </div>
  );
}
