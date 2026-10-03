import Link from "next/link";

const assurances = [
  ["01", "Start free", "14 days of access"],
  ["02", "100 credits", "Included at signup"],
  ["03", "No card", "Import before paying"],
] as const;

export default function CTA() {
  return (
    <section id="get-started" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 pb-24 pt-16 text-[#191714] lg:px-10 lg:pb-32 lg:pt-20">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">12 / Start with the draft</p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
          <h2 className="max-w-[850px] font-display text-[clamp(4rem,8vw,8.5rem)] leading-[0.88] tracking-[-0.065em]">
            Bring the draft. See the book as a whole.
          </h2>

          <div className="lg:pb-3">
            <p className="max-w-[540px] text-base leading-8 text-[#191714]/70">
              Import the manuscript you already have. Xvault will map the opening chapters and give you a clearer way to understand what is on the page before you continue writing.
            </p>
            <Link
              href="/auth?mode=signup&next=%2Fdashboard%3Fscan%3D1"
              className="mt-8 inline-flex min-h-14 items-center gap-5 bg-[#191714] px-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F4F0E8] transition-colors hover:bg-[#A6402D]"
            >
              Map my first chapters
              <span aria-hidden="true" className="text-lg">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid border-y border-[#191714]/15 sm:grid-cols-3 lg:mt-20">
          {assurances.map(([number, title, detail], index) => (
            <div
              key={number}
              className={`grid grid-cols-[36px_1fr] gap-4 py-7 sm:block sm:px-7 sm:py-8 ${index > 0 ? "border-t border-[#191714]/15 sm:border-l sm:border-t-0" : ""}`}
            >
              <span className="font-mono text-[9px] font-semibold text-[#A6402D]">{number}</span>
              <div className="sm:mt-6">
                <p className="font-display text-[1.8rem] leading-none tracking-[-0.035em]">{title}</p>
                <p className="mt-3 text-xs leading-5 text-[#191714]/64">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
