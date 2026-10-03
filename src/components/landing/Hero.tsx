import Link from "next/link";

const findings = [
  ["Character", "Nadia Voronova", "cautious · distrustful of Marcus"],
  ["Open thread", "The missing dossier", "introduced in Chapter 2 · unresolved"],
  ["Continuity", "The silver locket", "described as gold in Chapter 3"],
] as const;

export default function Hero() {
  return (
    <section className="bg-[#F4F0E8] px-6 pb-20 pt-32 text-[#191714] lg:px-10 lg:pb-24 lg:pt-36">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15">
        <div className="grid gap-14 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20 lg:py-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">
              Manuscript intelligence for novelists
            </p>

            <h1 className="mt-7 max-w-[700px] font-display text-[clamp(4rem,7.2vw,7.2rem)] leading-[0.88] tracking-[-0.055em]">
              Your whole novel, mapped.
            </h1>

            <p className="mt-8 max-w-[600px] text-[1.08rem] leading-8 text-[#191714]/70">
              Upload your manuscript. Xvault finds the characters, relationships, open plot threads, and continuity details already on the page. It keeps that story context beside you while you write.
            </p>

            <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center">
              <Link
                href="/auth?mode=signup&next=%2Fdashboard%3Fscan%3D1"
                className="inline-flex min-h-12 items-center justify-center bg-[#A6402D] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#7F2F22]"
              >
                Map my first chapters&nbsp;&nbsp;→
              </Link>
              <Link
                href="/continuity-check"
                className="group inline-flex min-h-12 items-center justify-center text-sm font-semibold sm:justify-start"
              >
                <span className="border-b border-[#191714]/35 pb-1 transition-colors group-hover:border-[#A6402D] group-hover:text-[#A6402D]">
                  Try the free continuity check
                </span>
              </Link>
            </div>

            <p className="mt-5 text-xs tracking-wide text-[#191714]/62">
              100 credits included · No credit card · Your original file stays untouched
            </p>
          </div>

          <figure>
            <div className="border border-[#191714]/15 bg-[#FFFDF8] shadow-[12px_14px_0_rgba(25,23,20,0.07)]">
              <div className="flex items-center justify-between border-b border-[#191714]/12 px-5 py-4 sm:px-7">
                <div>
                  <p className="font-display text-lg">The Glass Meridian</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#191714]/58">Sample manuscript · Chapter 7</p>
                </div>
                <span className="font-mono text-[10px] text-[#A6402D]">2,841 words</span>
              </div>

              <div className="grid md:grid-cols-[1.05fr_0.95fr]">
                <div className="border-b border-[#191714]/12 px-6 py-8 md:border-b-0 md:border-r sm:px-8 sm:py-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#191714]/58">From the manuscript</p>
                  <blockquote className="mt-8 font-display text-[1.55rem] leading-[1.55] tracking-[-0.02em] text-[#191714]/82">
                    “Marcus was already at the archive when Nadia arrived. She touched the silver locket at her throat and wondered how he had passed the sealed doors.”
                  </blockquote>
                  <p className="mt-8 border-l-2 border-[#A6402D] pl-4 text-xs leading-5 text-[#191714]/65">
                    Xvault connects this passage to details established elsewhere in the draft.
                  </p>
                </div>

                <div className="px-6 py-8 sm:px-7 sm:py-10">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#191714]/58">What it surfaces</p>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#A6402D]">For your review</span>
                  </div>

                  <div className="mt-6 border-t border-[#191714]/12">
                    {findings.map(([type, title, detail], index) => (
                      <div key={type} className="grid grid-cols-[28px_1fr] gap-3 border-b border-[#191714]/12 py-5">
                        <span className="font-mono text-[9px] text-[#A6402D]">0{index + 1}</span>
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#191714]/58">{type}</p>
                          <p className="mt-1.5 font-display text-lg leading-6">{title}</p>
                          <p className="mt-1 text-[11px] leading-5 text-[#191714]/64">{detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <figcaption className="mt-4 text-right font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/55">
              Example analysis from a sample manuscript
            </figcaption>
          </figure>
        </div>

        <div className="flex flex-col justify-between gap-2 border-y border-[#191714]/15 py-4 text-xs text-[#191714]/62 sm:flex-row sm:items-center">
          <span>The manuscript remains the source of truth. You decide what every finding means.</span>
          <span>Built for long fiction, not one-off prompts.</span>
        </div>
      </div>
    </section>
  );
}
