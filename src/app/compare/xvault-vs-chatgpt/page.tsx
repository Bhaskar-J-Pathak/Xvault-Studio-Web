import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Xvault Studio vs ChatGPT for Novel Writing (2026): Honest Comparison",
  description: "ChatGPT is powerful but it is not a novel-writing tool. No manuscript memory, no continuity tracking, no voice matching. Here is what serious fiction writers actually need.",
  alternates: { canonical: "https://xvault.dev/compare/xvault-vs-chatgpt" },
  openGraph: {
    title: "Xvault Studio vs ChatGPT for Novel Writing: Honest Comparison",
    description: "Manuscript memory, fiction-specific features, content restrictions, and what ChatGPT cannot do for novelists compared honestly.",
    type: "article",
  },
};

function Yes()     { return <Check size={16} className="text-emerald-500 mx-auto" />; }
function No()      { return <X    size={16} className="text-red-400   mx-auto" />; }
function Partial() { return <Minus size={16} className="text-amber-400 mx-auto" />; }

const rows: { feature: string; xvault: React.ReactNode; opponent: React.ReactNode; note?: string }[] = [
  { feature: "Free tier",                xvault: <Yes />,    opponent: <Yes />,     note: "Xvault: 14-day trial, 100 credits, no card. ChatGPT: free tier with limited model access." },
  { feature: "Monthly price",            xvault: "$11.99",   opponent: "$20",       note: "ChatGPT Plus is $20/mo. ChatGPT Team is $25–$30/mo per user." },
  { feature: "Lifetime option",          xvault: <Yes />,    opponent: <No />,      note: "Xvault Founder's Circle: $49 one-time." },
  { feature: "Reads full manuscript",    xvault: <Yes />,    opponent: <No />,      note: "ChatGPT requires you to paste context manually each session. Projects can store some files but do not load your manuscript into active context automatically." },
  { feature: "Auto story bible",         xvault: <Yes />,    opponent: <No />,      note: "ChatGPT has no story tracking. You maintain your own notes externally." },
  { feature: "Auto world board",         xvault: <Yes />,    opponent: <No /> },
  { feature: "Plot thread tracking",     xvault: <Yes />,    opponent: <No /> },
  { feature: "Continuity checking",      xvault: <Yes />,    opponent: <No />,      note: "ChatGPT will not flag when a chapter contradicts an earlier one unless you specifically ask and provide both chapters." },
  { feature: "Voice matching score",     xvault: <Yes />,    opponent: <No />,      note: "ChatGPT can mimic a style from examples you provide, but produces no consistency score and drifts across sessions." },
  { feature: "Dark / mature fiction",    xvault: <Yes />,    opponent: <Partial />, note: "ChatGPT applies content policies that restrict graphic violence, explicit content, and some dark narrative territory depending on context." },
  { feature: "Built for novel writing",  xvault: <Yes />,    opponent: <No />,      note: "ChatGPT is a general-purpose assistant. It writes well, but has no fiction-specific infrastructure." },
  { feature: "General purpose tasks",    xvault: <No />,     opponent: <Yes />,     note: "ChatGPT handles research, coding, summarising, emails, and everything else. Xvault does not." },
  { feature: "Internet access",          xvault: <No />,     opponent: <Yes />,     note: "ChatGPT can search the web. Xvault is focused on your manuscript." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I use ChatGPT to write a novel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, but it is not built for it. ChatGPT has no manuscript memory, so you must re-paste character details and world context at the start of every session. It has no continuity checking, no plot thread tracking, and no automatic worldbuilding extraction. Writers using ChatGPT for long fiction spend significant time on context management rather than writing.",
      },
    },
    {
      "@type": "Question",
      name: "What does Xvault do that ChatGPT cannot?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault reads your entire manuscript automatically before every response. It tracks every character, location, and plot thread across your manuscript, flags continuity errors, and generates prose scored against your existing writing for voice consistency. ChatGPT can do none of these without significant manual effort from the writer each session.",
      },
    },
    {
      "@type": "Question",
      name: "Does ChatGPT remember my characters across sessions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not automatically. ChatGPT's Projects feature can store files and some instructions, but it does not load your manuscript into active context or track characters and plot threads as you write. Each session effectively starts fresh unless you manually re-establish the context.",
      },
    },
    {
      "@type": "Question",
      name: "Is ChatGPT or Xvault better for dark fantasy writing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault is better for dark fantasy. ChatGPT applies content policies that restrict graphic violence and some dark narrative content depending on how it is framed. Xvault is built for serious fiction including dark genres and does not apply restrictions that would interfere with horror, grimdark, or dark fantasy content.",
      },
    },
    {
      "@type": "Question",
      name: "Is Xvault cheaper than ChatGPT Plus for novelists?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault Studio costs $11.99 per month versus ChatGPT Plus at $20 per month. Xvault also includes a $49 lifetime option. For novelists specifically, Xvault provides manuscript loading, story bible, world board, and voice matching that ChatGPT does not offer at any price.",
      },
    },
  ],
};

const comparisonSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Xvault Studio vs ChatGPT for Novel Writing (2026): Honest Comparison",
  description:
    "ChatGPT is powerful but it is not a novel-writing tool. No manuscript memory, no continuity tracking, no voice matching. Here is what serious fiction writers actually need.",
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
  url: "https://xvault.dev/compare/xvault-vs-chatgpt",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://xvault.dev/compare/xvault-vs-chatgpt",
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
      name: "ChatGPT",
      applicationCategory: "AIAssistant",
      url: "https://chat.openai.com",
      offers: { "@type": "Offer", price: "20", priceCurrency: "USD" },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",    item: "https://xvault.dev" },
    { "@type": "ListItem", position: 2, name: "Compare", item: "https://xvault.dev/compare" },
    { "@type": "ListItem", position: 3, name: "Xvault vs ChatGPT", item: "https://xvault.dev/compare/xvault-vs-chatgpt" },
  ],
};

export default function VsChatGPTPage() {
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
            Xvault Studio vs ChatGPT
          </h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl">
            ChatGPT is the most capable general-purpose AI assistant available. Millions of writers
            use it, and it writes well. It is also not a novel-writing tool. It has no manuscript
            memory, no fiction-specific infrastructure, and requires significant manual effort
            to maintain context across a long manuscript.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-black/[0.06] overflow-hidden mb-14">
          <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-200 px-5 py-3">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Feature</div>
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider text-center">Xvault Studio</div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider text-center">ChatGPT</div>
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
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Why Writers Reach for ChatGPT</h2>
            <p className="text-stone-600 leading-relaxed mb-4">ChatGPT writes. That is the beginning and end of why novelists use it. The prose quality on GPT-4o is genuinely high. It can brainstorm, generate scenes, write dialogue, and draft characters with apparent fluency. And because most writers already have a ChatGPT account, the friction to starting is near zero.</p>
            <p className="text-stone-600 leading-relaxed">The problems surface as the manuscript grows. What works for a scene does not work for a novel. A novel has memory requirements that a general-purpose assistant was not built to handle.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">The Session Memory Problem</h2>
            <p className="text-stone-600 leading-relaxed mb-4">ChatGPT's context window is large. GPT-4o handles up to 128,000 tokens, roughly 90,000 words. In theory, you could paste an entire novel draft into a single conversation. In practice, this is not how writers work. Sessions end. New conversations start. And when a new conversation starts, everything established in the previous one is gone.</p>
            <p className="text-stone-600 leading-relaxed mb-4">ChatGPT's Projects feature allows storing instructions and files, but it does not automatically load your full manuscript into active context before every response. Writers using ChatGPT for long fiction develop workarounds: character sheets pasted at the start of every session, running summaries of previous chapters, manual context-setting that can take ten to fifteen minutes before actual writing begins.</p>
            <p className="text-stone-600 leading-relaxed">This is not writing. It is context administration. The more complex the manuscript, the larger the cast, the more detailed the world, the longer the work, the more time goes to administration rather than writing.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">No Continuity Infrastructure</h2>
            <p className="text-stone-600 leading-relaxed mb-4">ChatGPT will not tell you when chapter seventeen contradicts something you established in chapter four. It does not track which plot threads are open and which have been resolved. It does not notice when a character who died in act two appears in act three. It has no concept of your manuscript as a document with internal consistency requirements.</p>
            <p className="text-stone-600 leading-relaxed mb-4">You can ask ChatGPT to check continuity, if you provide it with both the earlier passage and the new passage and ask it to compare them. This is possible. It is also time-consuming, manual, and easy to miss across a 90,000-word manuscript with dozens of established facts.</p>
            <p className="text-stone-600 leading-relaxed">Xvault's continuity checking reads the whole manuscript. It does not rely on you to know which earlier scenes are relevant to flag. It knows, because it has read everything.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Voice Matching Across Sessions</h2>
            <p className="text-stone-600 leading-relaxed mb-4">ChatGPT can be asked to write in a specific style. If you provide a sample of your prose and ask it to match your voice, it will produce something approximating your style within that session. In the next session, unless you paste the sample again, the style instruction is gone. There is also no consistency measurement: no way to know whether the suggestion sounds like you at 60% or 90%.</p>
            <p className="text-stone-600 leading-relaxed">Xvault's Ghost Writing feature scores every suggestion against your manuscript for voice match. The score is not an aesthetic judgment. It reflects how closely the suggestion's sentence patterns, vocabulary, and rhythmic tendencies align with what you have written. This works because the model has read your actual prose, not a brief style description.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Where ChatGPT Is Genuinely Better</h2>
            <p className="text-stone-600 leading-relaxed mb-4">ChatGPT's breadth is unmatched. Research, plotting, worldbuilding before you start writing, generating names, writing query letters, summarising your work, brainstorming marketing copy for your book: ChatGPT handles all of it. Xvault does none of it. Xvault is a writing tool. ChatGPT is a general assistant that can also write.</p>
            <p className="text-stone-600 leading-relaxed">Many writers use both. ChatGPT for the work around the manuscript. Xvault for the manuscript itself.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Who Should Use What</h2>
            <p className="text-stone-600 leading-relaxed mb-3"><strong className="text-stone-800">Use ChatGPT if:</strong> You need a general-purpose assistant that can handle research, worldbuilding before you start, query letters, and work outside the manuscript. Or if you are writing short fiction where session memory limitations do not accumulate into a problem.</p>
            <p className="text-stone-600 leading-relaxed"><strong className="text-stone-800">Use Xvault if:</strong> You are writing a novel and want an AI that has actually read your manuscript before it responds to anything. The context management that ChatGPT requires manually is what Xvault does automatically.</p>
          </div>

        </div>

        <div className="mt-16 pt-10 border-t border-stone-200">
          <div className="rounded-2xl bg-violet-50 border border-violet-200/60 p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-violet-600 mb-2">Try it yourself</p>
            <h2 className="font-display text-2xl font-semibold text-stone-900 mb-3">
              14 days free. No credit card.
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              Load your manuscript and see what happens when the AI already knows your story before you ask it anything.
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
