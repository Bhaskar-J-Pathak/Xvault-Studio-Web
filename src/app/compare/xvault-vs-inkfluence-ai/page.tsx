import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Xvault Studio vs Inkfluence AI (2026): Honest Comparison",
  description: "Inkfluence AI is built for content creators and marketing copy. Xvault is built for novelists writing long manuscripts. Here is how they compare for fiction writers.",
  alternates: { canonical: "https://xvault.dev/compare/xvault-vs-inkfluence-ai" },
  openGraph: {
    title: "Xvault Studio vs Inkfluence AI: Honest Comparison",
    description: "Manuscript memory, fiction features, content restrictions, and pricing compared for novelists.",
    type: "article",
  },
};

function Yes()     { return <Check size={16} className="text-emerald-500 mx-auto" />; }
function No()      { return <X    size={16} className="text-red-400   mx-auto" />; }
function Partial() { return <Minus size={16} className="text-amber-400 mx-auto" />; }

const rows: { feature: string; xvault: React.ReactNode; opponent: React.ReactNode; note?: string }[] = [
  { feature: "Free trial",               xvault: <Yes />,    opponent: <Yes />,     note: "Xvault: 14 days, 100 credits, no card required." },
  { feature: "Monthly price",            xvault: "$11.99",   opponent: "Varies",    note: "Inkfluence AI pricing depends on plan and usage tier." },
  { feature: "Lifetime option",          xvault: <Yes />,    opponent: <No />,      note: "Xvault Founder's Circle: $49 one-time, 500 credits/month." },
  { feature: "Built for novel writing",  xvault: <Yes />,    opponent: <No />,      note: "Inkfluence AI is designed for content creators and marketing copy, not long-form fiction." },
  { feature: "Reads full manuscript",    xvault: <Yes />,    opponent: <No />,      note: "Inkfluence AI has no manuscript loading. It generates from prompts." },
  { feature: "Auto story bible",         xvault: <Yes />,    opponent: <No /> },
  { feature: "Auto world board",         xvault: <Yes />,    opponent: <No /> },
  { feature: "Plot thread tracking",     xvault: <Yes />,    opponent: <No /> },
  { feature: "Continuity checking",      xvault: <Yes />,    opponent: <No /> },
  { feature: "Voice matching",           xvault: <Yes />,    opponent: <Partial />, note: "Inkfluence AI offers brand voice features, optimised for short-form content rather than literary prose." },
  { feature: "Dark / mature fiction",    xvault: <Yes />,    opponent: <No />,      note: "Inkfluence AI applies content moderation suited to marketing contexts, which restricts dark fiction." },
  { feature: "Social / marketing copy",  xvault: <No />,     opponent: <Yes />,     note: "Inkfluence AI is built for this. Xvault is not." },
  { feature: "Content calendar tools",   xvault: <No />,     opponent: <Yes />,     note: "Inkfluence AI includes scheduling and content planning features for creators." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I use Inkfluence AI to write a novel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Technically yes, but Inkfluence AI is not built for it. It has no manuscript memory, no continuity tracking, no story bible, and no plot management tools. Writers using it for long-form fiction have to manage all context manually, pasting in character details and world facts with each session.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between Xvault Studio and Inkfluence AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault Studio is built specifically for novelists writing long manuscripts. It reads your entire manuscript, tracks characters and plot threads automatically, and generates prose matched to your voice. Inkfluence AI is built for content creators producing short-form marketing and social media copy. They serve different audiences with different needs.",
      },
    },
    {
      "@type": "Question",
      name: "Does Inkfluence AI support dark fiction and mature content?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Inkfluence AI applies content moderation calibrated for marketing and brand contexts, which means dark fiction, horror, and mature literary content will be restricted. Xvault Studio is built for the full range of literary fiction including dark genres.",
      },
    },
    {
      "@type": "Question",
      name: "Is Xvault cheaper than Inkfluence AI for writers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault Studio costs $11.99 per month or $119 per year, with a $49 lifetime option. It includes everything a novelist needs: manuscript loading, story bible, world board, and voice-matched prose generation. Inkfluence AI pricing varies by plan and is structured around content creation volume rather than fiction writing use cases.",
      },
    },
    {
      "@type": "Question",
      name: "Which tool is better for fantasy and dark fantasy writers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault Studio. Fantasy and dark fantasy require tracking a large cast of characters, complex world rules, and long narrative arcs across 80,000 to 150,000 words. Xvault reads your full manuscript and tracks all of this automatically. Inkfluence AI is not designed for this use case and applies content restrictions that would interfere with dark fantasy content.",
      },
    },
  ],
};

const comparisonSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Xvault Studio vs Inkfluence AI (2026): Honest Comparison",
  description:
    "Inkfluence AI is built for content creators and marketing copy. Xvault is built for novelists writing long manuscripts. Here is how they compare for fiction writers.",
  datePublished: "2026-08-20",
  dateModified: "2026-08-20",
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
  url: "https://xvault.dev/compare/xvault-vs-inkfluence-ai",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://xvault.dev/compare/xvault-vs-inkfluence-ai",
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
      name: "Inkfluence AI",
      applicationCategory: "WritingApplication",
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",    item: "https://xvault.dev" },
    { "@type": "ListItem", position: 2, name: "Compare", item: "https://xvault.dev/compare" },
    { "@type": "ListItem", position: 3, name: "Xvault vs Inkfluence AI", item: "https://xvault.dev/compare/xvault-vs-inkfluence-ai" },
  ],
};

export default function VsInkfluenceAIPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <header className="border-b border-black/[0.06] bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <Link href="/compare" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
            ← All comparisons
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-violet-600/70 mb-3">Comparison</p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-stone-900 leading-tight mb-5">
            Xvault Studio vs Inkfluence AI
          </h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl">
            Inkfluence AI is a content creation tool built for marketers, influencers, and brand teams.
            It is good at what it is designed for. What it is not designed for is writing a novel:
            there is no manuscript memory, no continuity tracking, and content restrictions that make
            dark fiction genres unworkable.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-black/[0.06] overflow-hidden mb-14">
          <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-200 px-5 py-3">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Feature</div>
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider text-center">Xvault Studio</div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider text-center">Inkfluence AI</div>
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

        <div className="blog-prose space-y-10">

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Different Tools, Different Jobs</h2>
            <p className="text-stone-600 leading-relaxed mb-4">Inkfluence AI is built for content creators. Its features (brand voice tools, content calendars, social media copy generation, caption writing) are designed around the workflow of someone producing high-volume short-form content for an audience. That is a real and valuable use case.</p>
            <p className="text-stone-600 leading-relaxed mb-4">It is not the use case of a novelist writing a 90,000-word dark fantasy with twenty named characters, a developed magic system, and five interlocking subplots that need to pay off in the final act.</p>
            <p className="text-stone-600 leading-relaxed">The mismatch is not about quality. It is about architecture. A tool built for 280-character captions and short blog posts has fundamentally different requirements from a tool built for long-form narrative fiction. Comparing them is useful only as a reminder to choose the right tool for the right job.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The Manuscript Memory Gap</h2>
            <p className="text-stone-600 leading-relaxed mb-4">The central problem with using any general content tool for novel writing is the absence of persistent manuscript context. Every time you start a new session, you start from scratch. Whatever your protagonist established about their past in chapter three, whatever rules you set for your world in the opening chapters: none of it carries forward automatically.</p>
            <p className="text-stone-600 leading-relaxed mb-4">Writers who attempt long-form fiction in tools like Inkfluence AI end up spending significant time re-establishing context at the start of every session: pasting character sheets, summarising previous chapters, reminding the AI of world rules it has already forgotten. This is not writing. It is administration.</p>
            <p className="text-stone-600 leading-relaxed">Xvault loads your entire manuscript before Alex responds to anything. Every character, every established fact, every decision you have made about the world is in context. You write. The tool keeps up.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Content Restrictions for Dark Fiction</h2>
            <p className="text-stone-600 leading-relaxed mb-4">Inkfluence AI applies content moderation calibrated for marketing and brand-safe contexts. This is appropriate for its intended use: companies and creators cannot afford content that would damage their brand reputation. For novelists writing horror, dark fantasy, grimdark, or any fiction that explores violence, moral complexity, and darkness honestly, this content moderation is a hard blocker.</p>
            <p className="text-stone-600 leading-relaxed">Xvault is built for serious fiction, including work that goes to difficult places. The full range of literary content is supported, including genres where darkness is not incidental but structural.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Where Inkfluence AI Is Genuinely Better</h2>
            <p className="text-stone-600 leading-relaxed mb-4">If you are a writer who also manages social media, creates content for an author platform, writes newsletters, or produces marketing copy for your books, Inkfluence AI's tools for that work are well-designed and purpose-built. Content scheduling, brand voice consistency, caption generation: these are not things Xvault is built to do.</p>
            <p className="text-stone-600 leading-relaxed">The right answer for many authors may be both tools: Xvault for the manuscript, a content-focused tool for the author platform around it.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Who Should Use What</h2>
            <p className="text-stone-600 leading-relaxed mb-3"><strong className="text-stone-800">Use Inkfluence AI if:</strong> You are a content creator producing short-form marketing and social media copy and need a tool optimised for that workflow.</p>
            <p className="text-stone-600 leading-relaxed"><strong className="text-stone-800">Use Xvault if:</strong> You are writing a novel and need a tool that reads your manuscript, tracks your characters and world automatically, checks continuity, and generates prose that sounds like you. These are different products for different work.</p>
          </div>

        </div>

        <div className="mt-16 pt-10 border-t border-stone-200">
          <div className="rounded-2xl bg-violet-50 border border-violet-200/60 p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-violet-600 mb-2">Try it yourself</p>
            <h2 className="font-display text-2xl font-semibold text-stone-900 mb-3">
              14 days free. No credit card.
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              Load your manuscript, meet Alex, and see what a tool built for novels actually feels like.
            </p>
            <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
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
