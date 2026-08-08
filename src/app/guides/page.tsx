import type { Metadata } from "next";
import Link from "next/link";
import { getAllGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Writing Guides | Xvault Studio",
  description: "Practical guides for writing novels in every genre. Fantasy, mystery, romance, thriller, and the craft of plotting, written for serious novelists.",
  openGraph: {
    title: "Writing Guides | Xvault Studio",
    description: "Practical guides for writing novels in every genre. Fantasy, mystery, romance, thriller, and the craft of plotting.",
    type: "website",
  },
};

const GENRE_COLOR: Record<string, string> = {
  Fantasy:  "text-violet-600/70",
  Mystery:  "text-amber-600/70",
  Romance:  "text-rose-500/70",
  Thriller: "text-red-600/70",
  General:  "text-stone-400",
};

export default function GuidesPage() {
  const guides = getAllGuides();

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      {/* Nav */}
      <header className="border-b border-black/[0.06] bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/"
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            ← Xvault Studio
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-violet-600 mb-3">
            Writing Guides
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-stone-900 leading-tight mb-4">
            How to write your novel.<br className="hidden sm:block" /> Genre by genre.
          </h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-xl">
            Practical craft guides for serious novelists. Each one focuses on the structural
            problems specific to that genre, the ones that cause most writers to give up
            before the final chapter.
          </p>
        </div>

        {/* Guides list */}
        {guides.length === 0 ? (
          <p className="text-stone-400 text-sm">No guides yet.</p>
        ) : (
          <div className="divide-y divide-stone-200">
            {guides.map((guide) => (
              <article key={guide.slug} className="py-8 group">
                <Link href={`/guides/${guide.slug}`} className="block">
                  <div className="flex gap-3 mb-3">
                    <span className={`text-[10px] font-semibold tracking-widest uppercase ${GENRE_COLOR[guide.genre] ?? "text-stone-400"}`}>
                      {guide.genre}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-[1.6rem] font-semibold text-stone-900 leading-snug mb-3 group-hover:text-violet-700 transition-colors">
                    {guide.title}
                  </h2>

                  <p className="text-stone-500 text-base leading-relaxed mb-4 max-w-2xl">
                    {guide.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span>{guide.readTime} min read</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
