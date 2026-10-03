import Image from "next/image";

const outcomes = [
  {
    number: "01",
    title: "The cast and world take shape",
    body: "Characters, locations, objects, lore, and relationships are grouped into a story model you can inspect.",
  },
  {
    number: "02",
    title: "Emotional movement becomes visible",
    body: "Chapter-level observations show what major characters want, fear, and carry into the next scene.",
  },
  {
    number: "03",
    title: "Open questions stay open",
    body: "Promises and unresolved threads are surfaced for review, without pretending there is only one correct answer.",
  },
] as const;

export default function StoryScanSection() {
  return (
    <section id="story-scan" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">
              01 / Story Scan
            </p>
            <h2 className="mt-6 max-w-[650px] font-display text-[clamp(3.4rem,5.6vw,5.8rem)] leading-[0.94] tracking-[-0.05em]">
              See the story already on the page.
            </h2>
          </div>

          <div className="lg:pb-2">
            <p className="max-w-[610px] text-base leading-8 text-[#191714]/70">
              Story Scan reads your opening chapters and organizes the characters, relationships, story elements, and emotional movement it finds. It does not rewrite or grade the draft. Every observation is yours to inspect.
            </p>
            <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58">
              First scan: up to three eligible chapters
            </p>
          </div>
        </div>

        <figure className="mt-16">
          <div className="overflow-hidden border border-[#191714]/18 bg-[#FAFAF8] shadow-[14px_16px_0_rgba(25,23,20,0.07)]">
            <Image
              src="/landing/story-scan-example.png"
              alt="Xvault Story Scan showing story elements, relationships, emotional arcs, and open questions from an example manuscript"
              width={1440}
              height={1000}
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-5 flex flex-col justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58 sm:flex-row">
            <span>Current Story Scan interface</span>
            <span>Example manuscript data: The Glass Meridian</span>
          </figcaption>
        </figure>

        <ol className="mt-14 grid border-t border-[#191714]/15 lg:grid-cols-3">
          {outcomes.map((outcome, index) => (
            <li
              key={outcome.number}
              className={`border-b border-[#191714]/15 py-8 lg:min-h-[220px] lg:px-8 lg:py-10 ${
                index > 0 ? "lg:border-l" : ""
              }`}
            >
              <span className="font-mono text-[10px] text-[#A6402D]">{outcome.number}</span>
              <h3 className="mt-7 max-w-[300px] font-display text-[1.8rem] leading-[1.08] tracking-[-0.03em]">
                {outcome.title}
              </h3>
              <p className="mt-4 max-w-[340px] text-sm leading-7 text-[#191714]/68">{outcome.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
