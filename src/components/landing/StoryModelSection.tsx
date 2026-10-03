import Image from "next/image";

const worldBoardDetails = [
  ["Entities", "Characters, locations, factions, objects, events, and lore"],
  ["Connections", "Relationships drawn from what the manuscript establishes"],
  ["Control", "Filter by chapter, rearrange the board, and edit what Xvault found"],
] as const;

const storyBibleDetails = [
  ["Story context", "Project intent, genre, voice notes, and an editable synopsis"],
  ["Chapter memory", "Summaries and indexed passages kept with the manuscript"],
  ["Living reference", "Character profiles, world details, and unresolved threads"],
] as const;

function DetailList({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <dl className="mt-9 border-t border-[#191714]/15">
      {items.map(([term, detail]) => (
        <div key={term} className="grid grid-cols-[105px_1fr] gap-5 border-b border-[#191714]/15 py-4">
          <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">{term}</dt>
          <dd className="text-sm leading-6 text-[#191714]/68">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function StoryModelSection() {
  return (
    <section id="story-model" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">The story model</p>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58">Two connected views</p>
          </div>
          <div>
            <h2 className="max-w-[900px] font-display text-[clamp(3.4rem,6vw,6.4rem)] leading-[0.93] tracking-[-0.055em]">
              From scattered details to a story you can navigate.
            </h2>
            <p className="mt-8 max-w-[680px] text-base leading-8 text-[#191714]/70">
              Story Scan feeds two working references. The World Board shows how the story&apos;s elements connect. The Story Bible keeps the knowledge behind those connections organized and editable.
            </p>
          </div>
        </div>

        <article className="mt-24 grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:gap-16">
          <figure className="lg:order-1">
            <div className="overflow-hidden border border-[#191714]/18 bg-white shadow-[12px_14px_0_rgba(25,23,20,0.07)]">
              <Image
                src="/landing/world-board-example.png"
                alt="Xvault World Board showing characters, locations, objects, lore, and the relationships between them"
                width={1440}
                height={900}
                sizes="(max-width: 1024px) 100vw, 760px"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-4 flex flex-col justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58 sm:flex-row">
              <span>Current World Board interface</span>
              <span>Example manuscript data</span>
            </figcaption>
          </figure>

          <div className="lg:order-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">02 / World Board</p>
            <h3 className="mt-5 font-display text-[clamp(2.8rem,4.2vw,4.6rem)] leading-[0.95] tracking-[-0.05em]">
              See who and what connects.
            </h3>
            <p className="mt-7 text-base leading-8 text-[#191714]/70">
              Names in the manuscript become a visual map of people, places, objects, factions, events, and lore. Relationships stay visible, so one detail never has to live in isolation.
            </p>
            <DetailList items={worldBoardDetails} />
          </div>
        </article>

        <article className="mt-28 grid gap-10 border-t border-[#191714]/15 pt-20 lg:grid-cols-[0.65fr_1.35fr] lg:items-center lg:gap-16 lg:pt-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">03 / Story Bible</p>
            <h3 className="mt-5 font-display text-[clamp(2.8rem,4.2vw,4.6rem)] leading-[0.95] tracking-[-0.05em]">
              Keep the facts beside the draft.
            </h3>
            <p className="mt-7 text-base leading-8 text-[#191714]/70">
              The Story Bible brings project intent, voice, summaries, characters, and open threads into one editable reference. Memory coverage shows which chapters are ready for Alex to retrieve while you write.
            </p>
            <DetailList items={storyBibleDetails} />
          </div>

          <figure>
            <div className="overflow-hidden border border-[#191714]/18 bg-white shadow-[12px_14px_0_rgba(25,23,20,0.07)]">
              <Image
                src="/landing/story-bible-example.png"
                alt="Xvault Story Bible showing memory coverage, project intent, genre, and style notes"
                width={1000}
                height={1000}
                sizes="(max-width: 1024px) 100vw, 760px"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-4 flex flex-col justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58 sm:flex-row">
              <span>Current Story Bible interface</span>
              <span>Example manuscript data</span>
            </figcaption>
          </figure>
        </article>
      </div>
    </section>
  );
}
