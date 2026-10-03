const problems = [
  {
    number: "01",
    marker: "Continuity",
    title: "A detail changes quietly.",
    body: "A scar moves. A journey takes two days here and five later. Each detail feels small until a reader notices it.",
  },
  {
    number: "02",
    marker: "Plot",
    title: "A promise disappears.",
    body: "A clue, threat, or relationship beat enters the story, then gets buried beneath the next thirty thousand words.",
  },
  {
    number: "03",
    marker: "Character",
    title: "A change happens off the page.",
    body: "A character reaches an emotional turn, but the scenes that should have earned it never made it into the draft.",
  },
] as const;

export default function ProblemSection() {
  return (
    <section id="problem" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">
              The long-draft problem
            </p>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/55">
              Memory versus manuscript
            </p>
          </div>

          <div>
            <h2 className="max-w-[980px] font-display text-[clamp(3.4rem,6.4vw,6.8rem)] leading-[0.91] tracking-[-0.055em]">
              The draft gets longer. Your working memory does not.
            </h2>
            <p className="ml-auto mt-10 max-w-[620px] border-l border-[#A6402D]/70 pl-5 text-base leading-8 text-[#191714]/68">
              Once a novel spans dozens of chapters, the facts you need are rarely in the scene you are editing. They are scattered across the manuscript, competing with every new decision you make.
            </p>
          </div>
        </div>

        <div className="mt-20 border-t border-[#191714]/15">
          <div className="hidden grid-cols-[70px_180px_0.9fr_1.1fr] gap-8 border-b border-[#191714]/15 py-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[#191714]/55 lg:grid">
            <span>Ref.</span>
            <span>Where it breaks</span>
            <span>What happens</span>
            <span>What the reader feels</span>
          </div>

          <ol>
            {problems.map((problem) => (
              <li
                key={problem.number}
                className="grid gap-5 border-b border-[#191714]/15 py-9 lg:grid-cols-[70px_180px_0.9fr_1.1fr] lg:gap-8 lg:py-10"
              >
                <span className="font-mono text-[10px] text-[#A6402D]">{problem.number}</span>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#191714]/58">
                  {problem.marker}
                </p>
                <h3 className="max-w-[310px] font-display text-[1.9rem] leading-[1.05] tracking-[-0.03em]">
                  {problem.title}
                </h3>
                <p className="max-w-[480px] text-sm leading-7 text-[#191714]/68">
                  {problem.body}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-5 text-right font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/55">
          Small gaps become structural problems
        </p>
      </div>
    </section>
  );
}
