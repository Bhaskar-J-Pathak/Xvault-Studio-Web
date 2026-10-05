const notes = [
  {
    subject: "Voice",
    copy: "The AI matches my voice very well.",
    name: "Sacha Ken",
    genre: "Fantasy writer",
    isQuote: true,
  },
  {
    subject: "Long-form memory",
    copy: "Six months in, 90,000 words, a cast of twenty. It hasn't lost a single character yet.",
    name: "Davis",
    genre: "Dark fantasy writer",
    isQuote: true,
  },
  {
    subject: "Inspired Story Pulse",
    copy: "Shayon's idea sparked Story Pulse: a way to see whether a character's emotional journey still connects from chapter to chapter.",
    name: "Shayon",
    genre: "Founder's Circle",
    isQuote: false,
  },
] as const;

export default function SocialProof() {
  return (
    <section id="writer-feedback" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">09 / From writers</p>
            <h2 className="mt-7 max-w-[700px] font-display text-[clamp(3.5rem,6vw,6.4rem)] leading-[0.92] tracking-[-0.055em]">
              What writers notice is context.
            </h2>
          </div>
          <p className="max-w-[560px] text-base leading-8 text-[#191714]/70 lg:pb-2">
            The useful moment is rarely a flashy sentence. It is when the studio remembers a person, a thread, or a voice the writer expected to explain again.
          </p>
        </div>

        <div className="mt-16 grid border-y border-[#191714]/15 lg:mt-20 lg:grid-cols-[1.2fr_0.8fr]">
          <figure className="relative overflow-hidden py-12 lg:border-r lg:border-[#191714]/15 lg:py-16 lg:pr-16">
            <span aria-hidden="true" className="pointer-events-none absolute -left-3 top-7 font-display text-[11rem] leading-none text-[#A6402D]/10 lg:text-[15rem]">
              “
            </span>
            <div className="relative">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">Manuscript memory</p>
              <blockquote className="mt-12 max-w-[790px] font-display text-[clamp(2.7rem,5vw,5.5rem)] leading-[0.98] tracking-[-0.05em]">
                “It could recall the character I wanted to know about with just a description, across the entire manuscript. That level of intelligence surprised me.”
              </blockquote>
              <figcaption className="mt-10 flex items-center gap-4 border-t border-[#191714]/15 pt-5">
                <span className="font-display text-xl tracking-[-0.025em]">Tamera Johnson</span>
                <span className="h-px w-8 bg-[#A6402D]/55" />
                <span className="text-xs text-[#191714]/64">Dark fantasy writer</span>
              </figcaption>
            </div>
          </figure>

          <div className="border-t border-[#191714]/15 lg:border-t-0 lg:pl-14">
            {notes.map((note, index) => (
              <figure key={note.subject} className={`py-10 lg:py-12 ${index > 0 ? "border-t border-[#191714]/15" : ""}`}>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">{note.subject}</p>
                {note.isQuote ? (
                  <blockquote className="mt-7 font-display text-[clamp(2rem,3.3vw,3.6rem)] leading-[1.02] tracking-[-0.04em]">
                    “{note.copy}”
                  </blockquote>
                ) : (
                  <p className="mt-7 font-display text-[clamp(2rem,3.3vw,3.6rem)] leading-[1.02] tracking-[-0.04em]">
                    {note.copy}
                  </p>
                )}
                <figcaption className="mt-7">
                  <span className="text-sm font-semibold">{note.name}</span>
                  <span className="mx-2 text-[#A6402D]">·</span>
                  <span className="text-xs text-[#191714]/64">{note.genre}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="grid gap-5 border-b border-[#191714]/15 py-7 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#191714]/64">
            Feedback from writers using Xvault Studio on active fiction projects
          </p>
          <p className="font-display text-xl italic tracking-[-0.025em] text-[#A6402D]">The manuscript remembered.</p>
        </div>
      </div>
    </section>
  );
}
