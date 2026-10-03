import Image from "next/image";

const decisions = [
  {
    number: "01",
    action: "Preview",
    detail: "Read the suggestion beside the passage before it becomes part of the chapter.",
  },
  {
    number: "02",
    action: "Refine",
    detail: "Ask for a different emphasis, pace, or direction without starting the scene again.",
  },
  {
    number: "03",
    action: "Insert or dismiss",
    detail: "Keep the prose that serves the chapter, or remove the suggestion without changing the draft.",
  },
] as const;

export default function WritingContextSection() {
  return (
    <section id="writing-with-context" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">
              05 / Writing with context
            </p>
            <h2 className="mt-7 max-w-[700px] font-display text-[clamp(3.5rem,6vw,6.4rem)] leading-[0.92] tracking-[-0.055em]">
              Write with the story beside you.
            </h2>
          </div>
          <div className="lg:pb-2">
            <p className="max-w-[620px] text-base leading-8 text-[#191714]/70">
              Place the cursor where the scene should continue and describe what you need. Alex can use the manuscript context already stored in Xvault, so you do not have to rebuild the story inside a separate chat.
            </p>
            <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58">
              Cursor-aware prose · Adjustable length · Context from your project
            </p>
          </div>
        </div>

        <figure className="mt-16">
          <div className="overflow-hidden border border-[#191714]/18 bg-[#F8F3E8] shadow-[14px_16px_0_rgba(25,23,20,0.07)]">
            <Image
              src="/landing/writing-studio-context.png"
              alt="Xvault writing studio with a manuscript open and the cursor-aware Write command bar visible"
              width={1920}
              height={937}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-5 flex flex-col justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/58 sm:flex-row">
            <span>Xvault writing studio interface</span>
            <span>Write at the cursor without leaving the chapter</span>
          </figcaption>
        </figure>

        <div className="mt-20 grid gap-12 border-y border-[#191714]/15 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A6402D]">The approval boundary</p>
            <h3 className="mt-6 max-w-[520px] font-display text-[clamp(2.8rem,4.6vw,5rem)] leading-[0.96] tracking-[-0.05em]">
              Nothing enters the chapter until you choose it.
            </h3>
            <p className="mt-7 max-w-[500px] text-base leading-8 text-[#191714]/70">
              Xvault proposes prose in a separate preview. The manuscript remains unchanged while you decide what belongs.
            </p>
          </div>

          <ol className="border-t border-[#191714]/15">
            {decisions.map((decision) => (
              <li
                key={decision.number}
                className="grid grid-cols-[42px_115px_1fr] gap-4 border-b border-[#191714]/15 py-6 sm:grid-cols-[55px_150px_1fr] sm:gap-6 sm:py-7"
              >
                <span className="font-mono text-[10px] text-[#A6402D]">{decision.number}</span>
                <h4 className="font-display text-xl tracking-[-0.025em]">{decision.action}</h4>
                <p className="text-sm leading-7 text-[#191714]/68">{decision.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
