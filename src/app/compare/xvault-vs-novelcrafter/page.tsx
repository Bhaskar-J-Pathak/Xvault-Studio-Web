import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Xvault Studio vs NovelCrafter (2026): Honest Comparison",
  description: "NovelCrafter has 157,000 users but requires API keys and unpredictable monthly costs. Xvault just works. Here is the honest comparison.",
  alternates: { canonical: "https://xvault.dev/compare/xvault-vs-novelcrafter" },
  openGraph: {
    title: "Xvault Studio vs NovelCrafter: Honest Comparison",
    description: "API keys, pricing, manuscript memory, and worldbuilding compared honestly.",
    type: "article",
  },
};

function Yes()     { return <Check size={16} className="text-emerald-500 mx-auto" />; }
function No()      { return <X    size={16} className="text-red-400   mx-auto" />; }
function Partial() { return <Minus size={16} className="text-amber-400 mx-auto" />; }

const rows: { feature: string; xvault: React.ReactNode; opponent: React.ReactNode; note?: string }[] = [
  { feature: "Free trial",                 xvault: <Yes />,     opponent: <Yes />,     note: "Xvault: 14 days, 100 credits, no card. NovelCrafter: free tier exists." },
  { feature: "Monthly price",              xvault: "$11.99",    opponent: "$24–$44",   note: "NovelCrafter subscription ($4–$20/mo) + API costs ($15–$25/mo typical). Effective cost is unpredictable." },
  { feature: "Annual price",               xvault: "$119/yr",   opponent: "Variable",  note: "NovelCrafter annual subscription is cheaper, but API costs continue on top." },
  { feature: "API key required",           xvault: <No />,      opponent: <Yes />,     note: "NovelCrafter requires you to create and manage accounts with OpenAI, Anthropic, or Google separately." },
  { feature: "Predictable monthly cost",   xvault: <Yes />,     opponent: <No />,      note: "NovelCrafter's effective cost depends on how much you write, as API costs scale with usage." },
  { feature: "Reads full manuscript",      xvault: <Yes />,     opponent: <Partial />, note: "NovelCrafter uses a Codex. You must manually enter character and world data. It does not read your prose." },
  { feature: "Auto world board",           xvault: <Yes />,     opponent: <No />,      note: "Xvault extracts entities automatically. NovelCrafter's Codex is built manually." },
  { feature: "Auto story bible",           xvault: <Yes />,     opponent: <No /> },
  { feature: "Voice matching",             xvault: <Yes />,     opponent: <No /> },
  { feature: "Lifetime option",            xvault: <Yes />,     opponent: <No /> },
  { feature: "Choose your AI model",       xvault: <No />,      opponent: <Yes />,     note: "NovelCrafter supports OpenAI, Anthropic, Google, and local models." },
  { feature: "Established user base",      xvault: <No />,      opponent: <Yes />,     note: "NovelCrafter has 157,000+ users and an active community." },
];

const comparisonSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Xvault Studio vs NovelCrafter (2026): Honest Comparison",
  description:
    "NovelCrafter has 157,000 users but requires API keys and unpredictable monthly costs. Xvault just works. Here is the honest comparison.",
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
  url: "https://xvault.dev/compare/xvault-vs-novelcrafter",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://xvault.dev/compare/xvault-vs-novelcrafter",
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
      name: "NovelCrafter",
      applicationCategory: "WritingApplication",
      url: "https://novelcrafter.com",
      offers: { "@type": "Offer", price: "4", priceCurrency: "USD" },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",       item: "https://xvault.dev" },
    { "@type": "ListItem", position: 2, name: "Compare",    item: "https://xvault.dev/compare" },
    { "@type": "ListItem", position: 3, name: "Xvault vs NovelCrafter", item: "https://xvault.dev/compare/xvault-vs-novelcrafter" },
  ],
};

export default function VsNovelCrafterPage() {
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
            Xvault Studio vs NovelCrafter
          </h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl">
            NovelCrafter is the fastest-growing AI writing tool in the fiction space, with
            over 157,000 users. Its strength is a structured worldbuilding codex and
            flexibility in AI model choice. Its friction point, the one that limits
            mainstream adoption, is requiring writers to manage their own API keys and
            absorb unpredictable API costs on top of the subscription.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-black/[0.06] overflow-hidden mb-14">
          <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-200 px-5 py-3">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Feature</div>
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider text-center">Xvault Studio</div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider text-center">NovelCrafter</div>
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
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The API Key Problem</h2>
            <p className="text-stone-600 leading-relaxed mb-4">NovelCrafter's bring-your-own-key model is a deliberate architectural choice. It gives writers flexibility: you can connect any supported model, switch between them, and take advantage of the latest capabilities without waiting for NovelCrafter to update their infrastructure.</p>
            <p className="text-stone-600 leading-relaxed mb-4">The problem is what this requires of the writer. To use NovelCrafter fully, you need to:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-600 mb-4 pl-2">
              <li>Create an account with OpenAI, Anthropic, or Google</li>
              <li>Understand API billing and set spending limits</li>
              <li>Manage API keys securely</li>
              <li>Monitor usage to avoid unexpected charges</li>
            </ul>
            <p className="text-stone-600 leading-relaxed mb-4">For technically comfortable writers, this is a minor inconvenience. For the majority of novelists who want a writing tool rather than a software infrastructure project, it is a meaningful barrier. The unpredictability of API costs makes budgeting difficult.</p>
            <p className="text-stone-600 leading-relaxed">The effective monthly cost for a writer using NovelCrafter actively lands between $24 and $44 per month once API costs are included. The subscription starts at $4 per month, but that number is misleading without accounting for what you will pay your AI provider on top of it. Xvault's pricing is $11.99 per month or $119 per year. No API keys. No separate billing account. No usage-based surprises.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The Codex vs. Automatic Extraction</h2>
            <p className="text-stone-600 leading-relaxed mb-4">NovelCrafter's Codex is a well-designed worldbuilding system. You record your characters, locations, lore, and factions, and the AI references that Codex when generating suggestions. For writers who want structured control over their world data, it is genuinely good.</p>
            <p className="text-stone-600 leading-relaxed mb-4">The limitation is that the Codex is built manually. You record what you have established. You update it when things change. You decide what goes in and what does not. If you forget to add something, it is not in the Codex. If the AI is asked about something not in the Codex, it does not know it exists.</p>
            <p className="text-stone-600 leading-relaxed mb-4">Xvault's World Board works differently. It reads your manuscript and extracts entities automatically: every character named, every location described, every faction introduced. It builds the world record from what you have written rather than from what you remember to enter. The Story Bible similarly tracks open and resolved plot threads from the manuscript itself.</p>
            <p className="text-stone-600 leading-relaxed">This is not better in every situation. If you want to predefine your world before writing and have the AI work from that structure, NovelCrafter's approach has advantages. If you want the system to learn your world as you write it, Xvault's automatic extraction is the closer fit.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Where NovelCrafter Is Genuinely Better</h2>
            <p className="text-stone-600 leading-relaxed mb-4">NovelCrafter's 157,000-user community is a real asset. There is an active forum, shared resources, and collective knowledge about how to use the tool effectively. When you encounter a problem, there is a community that has likely encountered it before.</p>
            <p className="text-stone-600 leading-relaxed">The flexibility in AI model selection is also a genuine differentiator for power users. If you have strong opinions about which model produces the best fiction prose, or if you want to experiment with local models for privacy or cost reasons, NovelCrafter accommodates that in a way Xvault currently does not.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Who Should Use What</h2>
            <p className="text-stone-600 leading-relaxed mb-3"><strong className="text-stone-800">Use NovelCrafter if:</strong> You are technically comfortable managing API keys and separate billing, you want flexibility in which AI models you use, and the structured Codex system appeals to your worldbuilding workflow.</p>
            <p className="text-stone-600 leading-relaxed"><strong className="text-stone-800">Use Xvault if:</strong> You want a single predictable monthly cost, you want your world board and story bible to build themselves from your writing, you want voice matching that keeps AI suggestions sounding like you, or you simply want a tool that requires no API infrastructure to set up.</p>
          </div>

        </div>

        <div className="mt-16 pt-10 border-t border-stone-200">
          <div className="rounded-2xl bg-violet-50 border border-violet-200/60 p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-violet-600 mb-2">Try it yourself</p>
            <h2 className="font-display text-2xl font-semibold text-stone-900 mb-3">
              14 days free. No credit card. No API keys.
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              100 AI credits, full access. See how it handles your manuscript before you commit to anything.
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
