import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

export const metadata: Metadata = {
  title: "Xvault vs Other AI Writing Tools: Honest Comparisons",
  description: "How Xvault Studio compares with Sudowrite, NovelCrafter, NovelAI, Inkfluence AI, and ChatGPT across manuscript memory, fiction tools, and pricing.",
  alternates: { canonical: "https://xvault.dev/compare" },
  openGraph: {
    title: "Xvault vs Other AI Writing Tools: Honest Comparisons",
    description: "Direct comparisons of AI writing tools for novelists, including the places where competing tools are stronger.",
    url: "https://xvault.dev/compare",
    type: "website",
  },
};

const comparisons = [
  {
    slug: "xvault-vs-sudowrite",
    opponent: "Sudowrite",
    tagline: "The established fiction platform with strong prose tools and a different approach to memory, restrictions, and pricing.",
    xvault: "Manuscript context and automatic story structure",
    other: "Mature craft tools and its proprietary Muse model",
  },
  {
    slug: "xvault-vs-novelcrafter",
    opponent: "NovelCrafter",
    tagline: "A flexible system for writers who want model choice and do not mind managing a codex and API access.",
    xvault: "Automatic context with no API setup",
    other: "Model flexibility and a detailed manual codex",
  },
  {
    slug: "xvault-vs-novelai",
    opponent: "NovelAI",
    tagline: "A permissive fiction generator built for drafting volume rather than complete manuscript management.",
    xvault: "Continuity, project structure, and voice context",
    other: "Content freedom and established fiction models",
  },
  {
    slug: "xvault-vs-inkfluence-ai",
    opponent: "Inkfluence AI",
    tagline: "A marketing content product compared with a studio designed around long-form fiction.",
    xvault: "Novel-specific memory and continuity tools",
    other: "Marketing workflows and content scheduling",
  },
  {
    slug: "xvault-vs-chatgpt",
    opponent: "ChatGPT",
    tagline: "A capable general assistant compared with a workspace that treats the manuscript as the source of truth.",
    xvault: "Persistent manuscript context and story tracking",
    other: "Breadth, research, and general-purpose work",
  },
] as const;

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#191714]">
      <Navbar />

      <main className="pt-[72px]">
        <section className="px-6 pb-16 pt-16 lg:px-10 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
            <div className="grid gap-10 lg:grid-cols-[0.32fr_1fr] lg:gap-16">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">Tool comparisons</p>
                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[#191714]/62">Memory / Craft / Cost</p>
              </div>
              <div>
                <h1 className="max-w-[980px] font-display text-[clamp(4.1rem,8.6vw,8.8rem)] leading-[0.87] tracking-[-0.065em]">Choose for the manuscript you have.</h1>
                <div className="mt-10 grid gap-8 border-t border-[#191714]/15 pt-7 sm:grid-cols-[1fr_auto] sm:items-end lg:mt-14">
                  <p className="max-w-[700px] text-base leading-8 text-[#191714]/70">Every writing tool makes broad claims. These comparisons focus on the workflow differences that become visible across a full novel.</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#191714]/62">Written by Xvault</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 lg:px-10 lg:pb-28">
          <div className="mx-auto max-w-[1280px] border-y border-[#191714]/15">
            <Link href="/continuity-check" className="group grid gap-8 py-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A6402D] md:grid-cols-[0.32fr_1fr_auto] md:items-end md:py-11">
              <div><p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">Interactive comparison</p></div>
              <div>
                <h2 className="font-display text-[clamp(2.5rem,4.5vw,4.8rem)] leading-[0.96] tracking-[-0.05em] transition-colors group-hover:text-[#A6402D]">Try the continuity workflow yourself.</h2>
                <p className="mt-4 max-w-[680px] text-sm leading-7 text-[#191714]/66">Paste two excerpts and inspect repeated characters and possible detail changes side by side.</p>
              </div>
              <span aria-hidden="true" className="text-xl text-[#A6402D] transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>

        <section className="px-6 pb-24 lg:px-10 lg:pb-32">
          <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15">
            {comparisons.map((comparison, index) => (
              <article key={comparison.slug} className="group border-b border-[#191714]/15">
                <Link href={`/compare/${comparison.slug}`} className="grid gap-6 py-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A6402D] md:grid-cols-[0.28fr_1fr_0.72fr_auto] md:gap-9 md:py-11">
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-[9px] font-semibold text-[#A6402D]">{(index + 1).toString().padStart(2, "0")}</span>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#191714]/58">Xvault vs {comparison.opponent}</p>
                  </div>
                  <div>
                    <h2 className="font-display text-[clamp(2.2rem,3.7vw,4.1rem)] leading-[0.98] tracking-[-0.045em] transition-colors group-hover:text-[#A6402D]">{comparison.tagline}</h2>
                  </div>
                  <div className="grid gap-5 text-sm leading-6 text-[#191714]/65 sm:grid-cols-2 md:grid-cols-1">
                    <p><span className="mb-1 block font-mono text-[8px] font-semibold uppercase tracking-[0.13em] text-[#A6402D]">Xvault strength</span>{comparison.xvault}</p>
                    <p><span className="mb-1 block font-mono text-[8px] font-semibold uppercase tracking-[0.13em] text-[#191714]/52">Their strength</span>{comparison.other}</p>
                  </div>
                  <span aria-hidden="true" className="self-end text-xl text-[#A6402D] transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </article>
            ))}

            <div className="grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end">
              <p className="max-w-[720px] text-sm leading-7 text-[#191714]/62">These comparisons are written by the Xvault team, so they are not neutral. Each one states where the competing product is stronger so you can judge the tradeoff yourself.</p>
              <Link href="/auth?mode=signup&next=%2Fdashboard%3Fscan%3D1" className="inline-flex min-h-12 items-center gap-4 bg-[#191714] px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F4F0E8] transition-colors hover:bg-[#A6402D]">Start free <span aria-hidden="true" className="text-lg">→</span></Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
