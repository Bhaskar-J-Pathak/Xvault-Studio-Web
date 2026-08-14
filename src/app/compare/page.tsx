import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Xvault vs Other AI Writing Tools: Honest Comparisons",
  description: "How does Xvault Studio compare to Sudowrite, NovelCrafter, and NovelAI? Honest side-by-side comparisons of pricing, features, and manuscript memory.",
  openGraph: {
    title: "Xvault vs Other AI Writing Tools: Honest Comparisons",
    description: "Honest side-by-side comparisons of AI writing tools for novelists. Pricing, features, manuscript memory, and content restrictions.",
    type: "website",
  },
};

const comparisons = [
  {
    slug: "xvault-vs-sudowrite",
    opponent: "Sudowrite",
    tagline: "The established name, but pricing backlash and content restrictions are pushing writers away.",
    xvaultWins: ["No content restrictions for serious fiction", "Reads entire manuscript before responding", "Transparent, stable pricing"],
    opponentWins: ["Proprietary Muse model fine-tuned on published novels", "More established, larger community"],
  },
  {
    slug: "xvault-vs-novelcrafter",
    opponent: "NovelCrafter",
    tagline: "157,000 users and growing, but BYOK friction and unpredictable API costs are its ceiling.",
    xvaultWins: ["No API keys to manage", "Predictable flat pricing", "Automatic World Board, no manual entry"],
    opponentWins: ["Flexible AI model selection", "Strong worldbuilding codex structure"],
  },
  {
    slug: "xvault-vs-novelai",
    opponent: "NovelAI",
    tagline: "The uncensored option: strong on freedom, weaker on prose quality and project management.",
    xvaultWins: ["Voice matching keeps your prose sounding like you", "Auto story bible and plot thread tracking", "Full project management built in"],
    opponentWins: ["Minimal content filtering", "Established fiction-trained models"],
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      {/* Nav */}
      <header className="border-b border-black/[0.06] bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/"
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            ← Xvault Studio
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-violet-600 mb-3">
            Tool Comparisons
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-stone-900 leading-tight mb-5">
            Xvault vs the alternatives.<br className="hidden sm:block" /> Honestly.
          </h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-xl">
            Every AI writing tool makes the same claims. These pages compare the actual
            differences in pricing, manuscript memory, content restrictions, and what the
            tools are genuinely good and bad at.
          </p>
        </div>

        {/* Comparison cards */}
        <div className="space-y-5">
          {comparisons.map(({ slug, opponent, tagline, xvaultWins, opponentWins }) => (
            <Link
              key={slug}
              href={`/compare/${slug}`}
              className="block rounded-2xl bg-white border border-black/[0.06] p-7 hover:border-violet-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-violet-600/70 mb-1.5">
                    Xvault vs {opponent}
                  </p>
                  <h2 className="font-display text-xl font-semibold text-stone-900 group-hover:text-violet-700 transition-colors">
                    {tagline}
                  </h2>
                </div>
                <ArrowRight size={18} className="text-stone-300 group-hover:text-violet-500 transition-colors shrink-0 mt-1" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-emerald-600 mb-2">
                    Where Xvault wins
                  </p>
                  <ul className="space-y-1">
                    {xvaultWins.map((w) => (
                      <li key={w} className="text-xs text-stone-500 flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">+</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-amber-600 mb-2">
                    Where {opponent} wins
                  </p>
                  <ul className="space-y-1">
                    {opponentWins.map((w) => (
                      <li key={w} className="text-xs text-stone-500 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">+</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-14 pt-10 border-t border-stone-200">
          <p className="text-stone-500 text-sm leading-relaxed max-w-xl">
            These comparisons are written by the Xvault team and are therefore not neutral.
            We have tried to be honest about where competitors are genuinely stronger.
            Try Xvault free for 14 days, no credit card required. Make the decision yourself.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </main>
    </div>
  );
}
