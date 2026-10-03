import Link from "next/link";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

interface ArticleLayoutProps {
  section: string;
  title: string;
  description: string;
  details: string[];
  tags?: string[];
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
}

export default function ArticleLayout({
  section,
  title,
  description,
  details,
  tags = [],
  backHref,
  backLabel,
  children,
}: ArticleLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#191714]">
      <Navbar />

      <main className="pt-[72px]">
        <header className="px-6 pb-16 pt-14 lg:px-10 lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
            <div className="grid gap-10 lg:grid-cols-[0.28fr_1fr] lg:gap-16">
              <div>
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#191714]/68 transition-colors hover:text-[#A6402D]"
                >
                  <span aria-hidden="true" className="text-[#A6402D]">←</span>
                  {backLabel}
                </Link>
                <p className="mt-8 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">
                  {section}
                </p>
              </div>

              <div>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-2">
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#A6402D]">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <h1 className="mt-5 max-w-[1000px] font-display text-[clamp(3.5rem,7vw,7.7rem)] leading-[0.91] tracking-[-0.058em]">
                  {title}
                </h1>

                <div className="mt-10 grid gap-8 border-t border-[#191714]/15 pt-7 md:grid-cols-[1fr_auto] md:items-end lg:mt-14">
                  <p className="max-w-[760px] text-base leading-8 text-[#191714]/70">
                    {description}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.13em] text-[#191714]/62 md:max-w-[240px] md:justify-end">
                    {details.map((detail, index) => (
                      <span key={detail} className="inline-flex items-center gap-3">
                        {index > 0 ? <span aria-hidden="true" className="text-[#A6402D]">/</span> : null}
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="px-6 pb-24 lg:px-10 lg:pb-32">
          <div className="mx-auto grid max-w-[1280px] gap-10 border-t border-[#191714]/15 pt-10 lg:grid-cols-[0.28fr_1fr] lg:gap-16 lg:pt-14">
            <aside className="hidden lg:block">
              <div className="sticky top-28 max-w-[220px]">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">
                  Reading note
                </p>
                <p className="mt-5 text-sm leading-6 text-[#191714]/62">
                  Keep the manuscript open. Take what serves the book and leave what does not.
                </p>
              </div>
            </aside>

            <div className="max-w-[780px]">
              <article className="editorial-prose">{children}</article>

              <aside className="mt-20 border-y border-[#191714]/15 py-10 lg:mt-24 lg:py-12">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">
                  Xvault Studio
                </p>
                <h2 className="mt-5 max-w-[670px] font-display text-[clamp(2.5rem,5vw,4.8rem)] leading-[0.95] tracking-[-0.05em]">
                  Let the studio remember the manuscript.
                </h2>
                <p className="mt-6 max-w-[620px] text-sm leading-7 text-[#191714]/68">
                  Import the draft, map its characters and open threads, and keep the story context beside you while you write.
                </p>
                <Link
                  href="/auth?mode=signup&next=%2Fdashboard%3Fscan%3D1"
                  className="mt-8 inline-flex min-h-12 items-center gap-5 bg-[#191714] px-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#F4F0E8] transition-colors hover:bg-[#A6402D]"
                >
                  Map my first chapters <span aria-hidden="true" className="text-lg">→</span>
                </Link>
              </aside>

              <Link
                href={backHref}
                className="mt-10 inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#191714]/68 transition-colors hover:text-[#A6402D]"
              >
                <span aria-hidden="true" className="text-[#A6402D]">←</span>
                {backLabel}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
