import Image from "next/image";

const readingKey = [
  ["Wants", "The immediate desire pulling the character through the chapter"],
  ["Fears", "The pressure or loss shaping how that desire is pursued"],
  ["Change", "The emotional movement created by what happens on the page"],
  ["Evidence", "A line from the manuscript that grounds the observation"],
] as const;

export default function StoryPulseSection() {
  return (
    <section id="story-pulse" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="mx-auto max-w-[1050px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">04 / Story Pulse</p>
          <h2 className="mt-7 font-display text-[clamp(3.5rem,6.5vw,7rem)] leading-[0.91] tracking-[-0.055em]">
            Plot tells you what happened. Story Pulse tracks what it changed.
          </h2>
          <p className="mx-auto mt-9 max-w-[700px] text-base leading-8 text-[#191714]/70">
            A believable character arc is built between events. Story Pulse follows what a character wants, fears, and carries forward, then connects each observation to evidence in the manuscript.
          </p>
        </div>

        <figure className="mt-16">
          <div className="overflow-hidden border border-[#191714]/18 bg-[#FAFAF8] shadow-[14px_16px_0_rgba(25,23,20,0.07)]">
            <Image
              src="/landing/story-pulse-example.png"
              alt="Xvault Story Pulse showing a character's wants, fears, emotional changes, manuscript evidence, and a possible continuity issue across three chapters"
              width={1200}
              height={1200}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-5 flex flex-col justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58 sm:flex-row">
            <span>Current Story Pulse interface</span>
            <span>Example manuscript data: The Glass Meridian</span>
          </figcaption>
        </figure>

        <div className="mt-16 border-t border-[#191714]/15">
          <p className="py-4 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#191714]/58">
            How to read the timeline
          </p>
          <dl className="grid border-t border-[#191714]/15 sm:grid-cols-2 lg:grid-cols-4">
            {readingKey.map(([term, detail], index) => (
              <div
                key={term}
                className={`border-b border-[#191714]/15 py-7 sm:px-6 lg:min-h-[170px] lg:py-8 ${
                  index % 2 === 1 ? "sm:border-l" : ""
                } ${index > 1 ? "sm:border-t lg:border-t-0" : ""} ${index > 0 ? "lg:border-l" : ""}`}
              >
                <dt className="font-display text-[1.7rem] tracking-[-0.025em]">{term}</dt>
                <dd className="mt-3 text-sm leading-6 text-[#191714]/68">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-20 grid gap-8 border-y border-[#191714]/15 py-10 lg:grid-cols-[220px_1fr] lg:gap-16 lg:py-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A6402D]">Possible discontinuity</p>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58">A prompt to review</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:gap-16">
            <blockquote className="font-display text-[clamp(2.2rem,3.8vw,4.2rem)] leading-[1.02] tracking-[-0.04em]">
              Her trust returns, but the scene that earns it may be missing.
            </blockquote>
            <p className="text-base leading-8 text-[#191714]/70">
              Xvault points to the shift and the evidence around it. You decide whether the change is intentional, whether the setup lives elsewhere, or whether the draft needs another beat.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
