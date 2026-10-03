import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { getAllGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Writing Guides for Novelists",
  description:
    "Practical guides to plotting fantasy, mystery, romance, thrillers, and complete novels from first decision to final chapter.",
  alternates: { canonical: "https://xvault.dev/guides" },
  openGraph: {
    title: "Writing Guides for Novelists | Xvault Studio",
    description:
      "Practical guides to plotting fantasy, mystery, romance, thrillers, and complete novels from first decision to final chapter.",
    url: "https://xvault.dev/guides",
    type: "website",
  },
};

export default function GuidesPage() {
  const guides = getAllGuides();

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#191714]">
      <Navbar />

      <main className="pt-[72px]">
        <section className="px-6 pb-16 pt-16 lg:px-10 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
            <div className="grid gap-10 lg:grid-cols-[0.32fr_1fr] lg:gap-16">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">
                  The craft shelf
                </p>
                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[#191714]/62">
                  Structure / Genre / Practice
                </p>
              </div>

              <div>
                <h1 className="max-w-[980px] font-display text-[clamp(4.1rem,8.6vw,8.8rem)] leading-[0.87] tracking-[-0.065em]">
                  Learn the shape of your story.
                </h1>
                <div className="mt-10 grid gap-8 border-t border-[#191714]/15 pt-7 sm:grid-cols-[1fr_auto] sm:items-end lg:mt-14">
                  <p className="max-w-[680px] text-base leading-8 text-[#191714]/70">
                    Practical, genre-specific guides for the decisions that hold a novel together, from the first promise to the final turn.
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#191714]/62">
                    {guides.length.toString().padStart(2, "0")} guides
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 lg:px-10 lg:pb-32">
          <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15">
            {guides.length > 0 ? (
              <div className="grid md:grid-cols-2">
                {guides.map((guide, index) => (
                  <article
                    key={guide.slug}
                    className={`group border-b border-[#191714]/15 ${index % 2 === 0 ? "md:border-r" : ""}`}
                  >
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="flex min-h-full flex-col px-0 py-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A6402D] md:px-9 md:py-11 lg:px-12 lg:py-14"
                    >
                      <div className="flex items-center justify-between gap-6 font-mono text-[9px] font-semibold uppercase tracking-[0.15em]">
                        <span className="text-[#A6402D]">{guide.genre}</span>
                        <span className="text-[#191714]/56">{(index + 1).toString().padStart(2, "0")}</span>
                      </div>

                      <h2 className="mt-8 max-w-[520px] font-display text-[clamp(2.5rem,4.3vw,4.8rem)] leading-[0.96] tracking-[-0.05em] transition-colors group-hover:text-[#A6402D]">
                        {guide.title}
                      </h2>
                      <p className="mt-6 max-w-[540px] text-sm leading-7 text-[#191714]/68">
                        {guide.description}
                      </p>

                      <div className="mt-auto flex items-end justify-between gap-5 border-t border-[#191714]/15 pt-8 md:mt-12">
                        <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#191714]/60">
                          {guide.readTime} min read
                        </span>
                        <span aria-hidden="true" className="text-xl text-[#A6402D] transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="py-10 text-sm text-[#191714]/60">The first guide is being prepared.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
