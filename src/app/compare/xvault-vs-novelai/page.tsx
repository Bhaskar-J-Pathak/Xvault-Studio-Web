import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Xvault Studio vs NovelAI (2026): Honest Comparison",
  description: "NovelAI is the go-to for uncensored fiction but its prose quality and lack of project management leave serious novelists wanting more. Here is the comparison.",
  alternates: { canonical: "https://xvault.dev/compare/xvault-vs-novelai" },
  openGraph: {
    title: "Xvault Studio vs NovelAI: Honest Comparison",
    description: "Content restrictions, prose quality, manuscript memory, and project management compared honestly.",
    type: "article",
  },
};

function Yes()     { return <Check size={16} className="text-emerald-500 mx-auto" />; }
function No()      { return <X    size={16} className="text-red-400   mx-auto" />; }
function Partial() { return <Minus size={16} className="text-amber-400 mx-auto" />; }

const rows: { feature: string; xvault: React.ReactNode; opponent: React.ReactNode; note?: string }[] = [
  { feature: "Free trial",                xvault: <Yes />,    opponent: <Yes />,     note: "Xvault: 14 days, 100 credits, no card. NovelAI: limited trial, no credit card required." },
  { feature: "Monthly price",             xvault: "$11.99",   opponent: "$10–$25",   note: "NovelAI Tablet ~$10/mo, Opus ~$25/mo." },
  { feature: "Dark / mature fiction",     xvault: <Yes />,    opponent: <Yes />,     note: "NovelAI has minimal content filtering, which is its strongest advantage for dark fiction writers." },
  { feature: "Reads full manuscript",     xvault: <Yes />,    opponent: <Partial />, note: "NovelAI has a 128K token Lorebook context. Long novels can still exceed this." },
  { feature: "Auto story bible",          xvault: <Yes />,    opponent: <No />,      note: "NovelAI has no plot thread tracking or continuity checking." },
  { feature: "Auto world board",          xvault: <Yes />,    opponent: <No />,      note: "NovelAI's Lorebook requires manual entry of all world facts." },
  { feature: "Voice matching",            xvault: <Yes />,    opponent: <No /> },
  { feature: "Plot thread tracking",      xvault: <Yes />,    opponent: <No /> },
  { feature: "Continuity checking",       xvault: <Yes />,    opponent: <No /> },
  { feature: "Prose quality (literary)",  xvault: <Yes />,    opponent: <Partial />, note: "NovelAI is optimised for high-volume drafting. Writers consistently report flat emotional register." },
  { feature: "Stable connection",         xvault: <Yes />,    opponent: <Partial />, note: "NovelAI has a reported history of mid-response disconnections that break writing momentum." },
  { feature: "Lifetime option",           xvault: <Yes />,    opponent: <No /> },
  { feature: "Fiction-specific model",    xvault: <No />,     opponent: <Yes />,     note: "NovelAI uses fine-tuned fiction models designed specifically for narrative generation." },
];

const comparisonSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Xvault Studio vs NovelAI (2026): Honest Comparison",
  description:
    "NovelAI is the go-to for uncensored fiction but its prose quality and lack of project management leave serious novelists wanting more. Here is the comparison.",
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
  url: "https://xvault.dev/compare/xvault-vs-novelai",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://xvault.dev/compare/xvault-vs-novelai",
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
      name: "NovelAI",
      applicationCategory: "WritingApplication",
      url: "https://novelai.net",
      offers: { "@type": "Offer", price: "10", priceCurrency: "USD" },
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does Xvault Studio allow uncensored dark fiction like NovelAI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Xvault Studio does not apply blanket content restrictions to dark fiction, horror, grimdark, or mature narrative content. Writers can explore morally complex, violent, or dark themes without their account being flagged.",
      },
    },
    {
      "@type": "Question",
      name: "Is Xvault's prose quality better than NovelAI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault's Ghost Writing feature generates prose scored against your existing manuscript for voice match. Writers consistently report that NovelAI's output is competent at the plot level but flat in emotional register and character interiority. Xvault aims to produce suggestions that require less rewriting because they sound like you, not like a generic AI tool.",
      },
    },
    {
      "@type": "Question",
      name: "Does Xvault have plot thread tracking that NovelAI lacks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Xvault's Story Bible tracks every open and resolved plot thread across your manuscript and surfaces threads that were introduced but never resolved. NovelAI has no plot tracking or continuity checking features.",
      },
    },
    {
      "@type": "Question",
      name: "How does Xvault's manuscript context compare to NovelAI's Lorebook?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault reads your entire written manuscript and builds context automatically from the prose itself. NovelAI's Lorebook requires manual entry of world facts, characters, and locations. If you do not enter something into the Lorebook, NovelAI does not know it exists regardless of what is written in your manuscript.",
      },
    },
    {
      "@type": "Question",
      name: "Which is better for dark fantasy writers, Xvault Studio or NovelAI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Both allow dark fantasy content, but Xvault Studio provides features NovelAI lacks for long-form work: automatic continuity checking, plot thread tracking, voice-matched prose generation, and a World Board that builds itself from your manuscript. NovelAI suits writers who prioritise content freedom and high-volume drafting without project management tools.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",    item: "https://xvault.dev" },
    { "@type": "ListItem", position: 2, name: "Compare", item: "https://xvault.dev/compare" },
    { "@type": "ListItem", position: 3, name: "Xvault vs NovelAI", item: "https://xvault.dev/compare/xvault-vs-novelai" },
  ],
};

export default function VsNovelAIPage() {
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
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-violet-600/70 mb-3">
            Comparison
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-stone-900 leading-tight mb-5">
            Xvault Studio vs NovelAI
          </h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl">
            NovelAI is the established choice for writers who need uncensored output. Horror,
            erotica, grimdark, and mature fiction all work without restrictions.
            The tradeoff is prose quality that tops out at competent drafting, and a complete
            absence of the project management tools serious novelists need for long-form work.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-black/[0.06] overflow-hidden mb-14">
          <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-200 px-5 py-3">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Feature</div>
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider text-center">Xvault Studio</div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider text-center">NovelAI</div>
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
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Where NovelAI Is Genuinely Better</h2>
            <p className="text-stone-600 leading-relaxed mb-4">NovelAI's core advantage is freedom. Its fine-tuned fiction models generate content without the content restrictions that have caused writers to leave Sudowrite. Horror, explicit romance, extreme violence, morally dark narratives: NovelAI does not interfere with these.</p>
            <p className="text-stone-600 leading-relaxed mb-4">The Lorebook system provides persistent memory across sessions. With a 128,000-token context window in current models, it can hold a significant amount of world data before running out of room. Writers who invest time in building detailed Lorebooks can get consistent references to their world across a long manuscript, provided the Lorebook is kept updated manually.</p>
            <p className="text-stone-600 leading-relaxed">For writers who prioritise content freedom above prose quality, and who are willing to do the manual work of building and maintaining a Lorebook, NovelAI has served as a reliable option for years.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The Prose Quality Ceiling</h2>
            <p className="text-stone-600 leading-relaxed mb-4">The consistent complaint about NovelAI among serious novelists is that its output feels flat at the emotional level. Action and plot movement are rendered competently. Character interiority, the internal voice, the emotional register, the specific way a character experiences a moment, tends to be generic.</p>
            <p className="text-stone-600 leading-relaxed mb-4">This matters more for some writers than others. If you are using AI primarily for first-draft volume, to generate rough text that you will substantially rewrite, NovelAI's quality ceiling is less of a problem. If you want AI suggestions that could plausibly have come from your manuscript without revision, the quality gap is more consequential.</p>
            <p className="text-stone-600 leading-relaxed">Xvault's Ghost Writing feature generates continuations scored against your existing prose. The voice match percentage reflects how closely the suggestion reflects your sentence patterns, vocabulary choices, and rhythmic tendencies. The goal is output that requires less rewriting: suggestions that sound like you, not like a generic AI writing tool.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The Project Management Gap</h2>
            <p className="text-stone-600 leading-relaxed mb-4">NovelAI is a generation tool. It produces text in response to prompts. What it does not do is help you manage the manuscript as a whole.</p>
            <p className="text-stone-600 leading-relaxed mb-4">There is no plot thread tracking. If you open a narrative question in chapter three and do not resolve it by chapter twenty, NovelAI will not notice. There is no continuity checker. If a character you established as dead in chapter seven speaks in chapter nineteen, NovelAI will not flag it. There is no automatic worldbuilding extraction. Every fact about your world must be manually entered into the Lorebook, or it does not exist as far as the AI is concerned.</p>
            <p className="text-stone-600 leading-relaxed mb-4">For a short story or a novella, these absences are manageable. For a 90,000-word novel with multiple subplots, a cast of significant characters, and a world with established rules, the absence of any project management infrastructure creates exactly the kind of continuity problems that revision cannot fully fix.</p>
            <p className="text-stone-600 leading-relaxed">Xvault's Story Bible, World Board, and continuity checking exist to address this gap. They are not bolt-on features. They are the core reason Xvault was built.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The Disconnection Problem</h2>
            <p className="text-stone-600 leading-relaxed">Writers using NovelAI report a recurring frustration: mid-response disconnections that interrupt generation mid-sentence and require the session to be restarted. This is a reliability issue, not a quality issue, but it breaks the writing flow in a way that is disproportionately disruptive during deep creative work.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Who Should Use What</h2>
            <p className="text-stone-600 leading-relaxed mb-3"><strong className="text-stone-800">Use NovelAI if:</strong> Content freedom is your absolute priority, prose quality is less important than volume, and you are comfortable doing manual Lorebook maintenance. It is the most reliable option for writers whose content would be flagged by more restrictive tools.</p>
            <p className="text-stone-600 leading-relaxed"><strong className="text-stone-800">Use Xvault if:</strong> You want uncensored fiction and a system that tracks your manuscript's continuity, extracts your world automatically, and generates suggestions that actually sound like your prose. You should not have to choose between freedom and project management.</p>
          </div>

        </div>

        <div className="mt-16 pt-10 border-t border-stone-200">
          <div className="rounded-2xl bg-violet-50 border border-violet-200/60 p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-violet-600 mb-2">Try it yourself</p>
            <h2 className="font-display text-2xl font-semibold text-stone-900 mb-3">
              14 days free. No credit card.
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              See how Alex handles your genre, your manuscript, and your voice before you commit to anything.
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
