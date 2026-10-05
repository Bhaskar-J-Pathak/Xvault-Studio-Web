import Link from "next/link";
import { HomepageSectionLink } from "./HomepageSectionLink";

const questions = [
  {
    question: "Can I try Xvault before paying?",
    answer: "Yes. Every new account includes 14 days of access and 100 AI credits. You can start without entering a credit card.",
  },
  {
    question: "What can I bring into the studio?",
    answer: "Import a .docx or .txt manuscript. Xvault detects the chapters and keeps the original file untouched. Your first Story Scan can map up to three eligible chapters.",
  },
  {
    question: "What does Xvault build from my manuscript?",
    answer: "Story Scan identifies characters, locations, relationships, threads, and emotional movement. Those findings feed the Story Bible, World Board, and Story Pulse so you can inspect the book from different angles.",
  },
  {
    question: "What is Alex?",
    answer: "Alex is the manuscript-aware assistant inside the studio. It receives relevant project context before responding, so you can discuss characters, chapters, and open threads without rebuilding the story in a separate chat.",
  },
  {
    question: "Does generated prose enter my chapter automatically?",
    answer: "No. Writing suggestions appear in a separate preview. You can refine, insert, or dismiss them, and the chapter stays unchanged until you choose to insert something.",
  },
  {
    question: "Can I export my manuscript?",
    answer: "Yes. You can export the current manuscript as a Word document from the studio sidebar whenever you want.",
  },
  {
    question: "How is my manuscript handled?",
    answer: "Manuscripts are private by default. Xvault uses encrypted connections and account access controls, masks manuscript text from session replay, and does not sell your writing or use it to train AI models.",
  },
  {
    question: "Do I need to install anything?",
    answer: "No. Xvault runs in a modern web browser and saves your work to the cloud, so you can return to the project from another supported device.",
  },
] as const;

export default function FAQ() {
  return (
    <section id="faq" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-24 text-[#191714] lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
        <div className="grid gap-16 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div>
            <div className="lg:sticky lg:top-28">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">11 / Questions</p>
              <h2 className="mt-7 max-w-[560px] font-display text-[clamp(3.5rem,5.6vw,6rem)] leading-[0.92] tracking-[-0.055em]">
                Before you bring the draft.
              </h2>
              <p className="mt-8 max-w-[480px] text-base leading-8 text-[#191714]/70">
                Straight answers about starting, manuscript context, author control, and what happens to your writing.
              </p>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4 border-t border-[#191714]/15 pt-6 text-[10px] font-semibold uppercase tracking-[0.14em]">
                <HomepageSectionLink targetId="pricing" className="underline decoration-[#A6402D]/45 underline-offset-8 transition-colors hover:text-[#A6402D]">View pricing</HomepageSectionLink>
                <Link href="/privacy" className="underline decoration-[#A6402D]/45 underline-offset-8 transition-colors hover:text-[#A6402D]">Privacy policy</Link>
                <a href="mailto:support@xvault.dev" className="underline decoration-[#A6402D]/45 underline-offset-8 transition-colors hover:text-[#A6402D]">Ask a question</a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#191714]/15">
            {questions.map((item, index) => (
              <details key={item.question} className="group border-b border-[#191714]/15" open={index === 0}>
                <summary className="grid cursor-pointer list-none grid-cols-[34px_1fr_24px] items-start gap-4 py-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A6402D] [&::-webkit-details-marker]:hidden sm:grid-cols-[46px_1fr_28px] sm:gap-6 sm:py-8">
                  <span className="pt-1 font-mono text-[9px] font-semibold text-[#A6402D]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[clamp(1.55rem,2.6vw,2.35rem)] leading-[1.08] tracking-[-0.035em]">{item.question}</span>
                  <span aria-hidden="true" className="relative mt-1 block h-6 w-6 text-[#191714]">
                    <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 bg-current" />
                    <span className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-200 group-open:scale-y-0" />
                  </span>
                </summary>
                <div className="grid grid-cols-[34px_1fr] gap-4 pb-8 sm:grid-cols-[46px_1fr] sm:gap-6 sm:pb-10">
                  <span aria-hidden="true" />
                  <p className="max-w-[650px] border-l border-[#A6402D]/45 pl-5 text-[15px] leading-8 text-[#191714]/70 sm:pl-7">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
