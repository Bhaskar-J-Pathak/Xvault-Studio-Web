import Link from "next/link";

const promises = [
  {
    number: "01",
    title: "Private by default",
    body: "A manuscript stays inside your account unless you deliberately create and share a reading link.",
  },
  {
    number: "02",
    title: "Never training material",
    body: "Xvault does not sell your manuscript or use your writing to train AI models.",
  },
  {
    number: "03",
    title: "Yours to take",
    body: "Export the manuscript as a Word document whenever you want, or delete the project from your dashboard.",
  },
] as const;

const aiFlow = [
  ["You ask", "An AI feature begins only when you choose to use it."],
  ["Context is selected", "Xvault sends the instructions and story context needed for that request."],
  ["You review", "The response returns as a suggestion for you to keep, change, or discard."],
] as const;

export default function ManuscriptOwnershipSection() {
  return (
    <section id="ownership" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">07 / Ownership and privacy</p>
            <h2 className="mt-7 max-w-[790px] font-display text-[clamp(3.5rem,6.3vw,6.8rem)] leading-[0.91] tracking-[-0.055em]">
              Your manuscript is work, not training data.
            </h2>
          </div>
          <p className="max-w-[540px] text-base leading-8 text-[#191714]/70 lg:pb-2">
            Writing a book requires trust. Your draft belongs to you, remains private by default, and enters an AI request only when you choose a feature that needs it.
          </p>
        </div>

        <div className="mt-16 grid border-y border-[#191714]/15 lg:mt-20 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="py-10 lg:border-r lg:border-[#191714]/15 lg:py-14 lg:pr-14">
            <div className="flex items-baseline justify-between gap-6 border-b border-[#191714]/15 pb-5">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#191714]/64">The plain language promise</p>
              <p className="font-display text-2xl italic tracking-[-0.03em] text-[#A6402D]">Still yours.</p>
            </div>

            <dl>
              {promises.map((promise) => (
                <div key={promise.number} className="grid gap-4 border-b border-[#191714]/15 py-7 sm:grid-cols-[52px_190px_1fr] sm:gap-6 sm:py-8">
                  <dt className="contents">
                    <span className="font-mono text-[9px] font-semibold text-[#A6402D]">{promise.number}</span>
                    <span className="font-display text-[1.55rem] leading-tight tracking-[-0.025em]">{promise.title}</span>
                  </dt>
                  <dd className="text-sm leading-7 text-[#191714]/68">{promise.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border-t border-[#191714]/15 py-10 lg:border-t-0 lg:py-14 lg:pl-14">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#191714]/64">When you use an AI feature</p>
            <h3 className="mt-6 max-w-[460px] font-display text-[clamp(2.5rem,4vw,4.4rem)] leading-[0.96] tracking-[-0.045em]">
              Your draft is used for the task you requested.
            </h3>

            <ol className="mt-10 border-t border-[#191714]/15">
              {aiFlow.map(([title, body], index) => (
                <li key={title} className="grid grid-cols-[34px_1fr] gap-4 border-b border-[#191714]/15 py-6">
                  <span className="font-mono text-[9px] text-[#A6402D]">0{index + 1}</span>
                  <div>
                    <h4 className="text-sm font-semibold tracking-[-0.01em]">{title}</h4>
                    <p className="mt-2 text-sm leading-6 text-[#191714]/68">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link href="/privacy" className="mt-8 inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#191714] underline decoration-[#A6402D]/50 underline-offset-8 transition-colors hover:text-[#A6402D]">
              Read the full privacy policy
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <p className="mt-5 max-w-[850px] font-mono text-[10px] leading-5 uppercase tracking-[0.12em] text-[#191714]/64">
          AI requests are processed through Google Cloud Vertex AI. Manuscript text and private form entries are masked from session replay.
        </p>
      </div>
    </section>
  );
}
