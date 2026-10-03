import Link from "next/link";

const steps = [
  {
    number: "01",
    verb: "Import",
    title: "Bring the draft you already have.",
    body: "Upload a .docx or .txt manuscript. Xvault detects the chapters and keeps the original file untouched.",
    note: ".docx · .txt",
  },
  {
    number: "02",
    verb: "Map",
    title: "Let Story Scan read the opening.",
    body: "Start with up to three chapters. Xvault finds the people, places, relationships, threads, and emotional movement already on the page.",
    note: "Up to three chapters",
  },
  {
    number: "03",
    verb: "Inspect",
    title: "See the manuscript from every angle.",
    body: "Move between the Story Bible, World Board, and Story Pulse. Each view returns to evidence from your own prose.",
    note: "Facts · links · arcs",
  },
  {
    number: "04",
    verb: "Continue",
    title: "Return to the chapter with context.",
    body: "Write, revise, and ask for help inside the studio. Preview every suggestion, then export the manuscript when you are ready.",
    note: "Write · revise · export",
  },
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">06 / How it works</p>
            <h2 className="mt-7 max-w-[690px] font-display text-[clamp(3.5rem,6vw,6.4rem)] leading-[0.92] tracking-[-0.055em]">
              Bring the manuscript. Keep writing from there.
            </h2>
          </div>
          <div className="lg:pb-2">
            <p className="max-w-[590px] text-base leading-8 text-[#191714]/70">
              Xvault starts with the work you have already done. One import turns the draft into a story you can inspect, understand, and continue inside the same studio.
            </p>
            <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58">
              No blank project · No manual story database · No repeated context
            </p>
          </div>
        </div>

        <div className="mt-16 border border-[#191714]/18 bg-[#F8F3E8] shadow-[14px_16px_0_rgba(25,23,20,0.07)] lg:mt-20">
          <div className="flex items-center justify-between border-b border-[#191714]/15 px-5 py-4 sm:px-7">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#191714]/58">A manuscript through Xvault</p>
            <p className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/55 sm:block">Four stages · One workspace</p>
          </div>

          <ol className="grid lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.number}
                className={`relative flex min-h-[360px] flex-col border-[#191714]/15 px-6 py-8 sm:px-8 lg:min-h-[430px] lg:py-10 ${
                  index > 0 ? "border-t lg:border-l lg:border-t-0" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#A6402D] font-mono text-[9px] font-semibold text-[#A6402D]">
                    {step.number}
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A6402D]">{step.verb}</span>
                </div>

                <div className="mt-10 lg:mt-16">
                  <h3 className="font-display text-[2rem] leading-[1.02] tracking-[-0.035em]">{step.title}</h3>
                  <p className="mt-5 text-sm leading-7 text-[#191714]/68">{step.body}</p>
                </div>

                <p className="mt-auto border-t border-[#191714]/15 pt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58">
                  {step.note}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 grid gap-8 border-y border-[#191714]/15 py-10 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-12 lg:py-12">
          <div>
            <p className="font-display text-[clamp(2rem,3.4vw,3.6rem)] leading-[0.98] tracking-[-0.04em]">Start with pages you have already written.</p>
            <p className="mt-4 text-sm leading-7 text-[#191714]/68">Create an account, import the draft, and map your first chapters free.</p>
          </div>
          <Link
            href="/auth?mode=signup&next=%2Fdashboard%3Fscan%3D1"
            className="inline-flex w-fit items-center gap-3 bg-[#191714] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F4F0E8] transition-colors hover:bg-[#A6402D]"
          >
            Map my first chapters
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
