import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllGuides, getGuideBySlug } from "@/lib/guides";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return {
    title: `${guide.title} — Xvault Studio`,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
  };
}

const GENRE_COLOR: Record<string, string> = {
  Fantasy:  "text-violet-600/70",
  Mystery:  "text-amber-600/70",
  Romance:  "text-rose-500/70",
  Thriller: "text-red-600/70",
  General:  "text-stone-400",
};

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      {/* Nav */}
      <header className="border-b border-black/[0.06] bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/guides"
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            ← All guides
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-4">
            <span className={`text-[10px] font-semibold tracking-widest uppercase ${GENRE_COLOR[guide.genre] ?? "text-stone-400"}`}>
              {guide.genre}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-stone-900 leading-tight mb-5">
            {guide.title}
          </h1>

          <p className="text-stone-500 text-lg leading-relaxed mb-6 max-w-2xl">
            {guide.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-stone-400 pb-10 border-b border-stone-200">
            <span>Xvault Studio</span>
            <span>·</span>
            <span>{guide.readTime} min read</span>
          </div>
        </div>

        {/* Content */}
        <div className="blog-prose">
          <MDXRemote source={guide.content} />
        </div>

        {/* CTA */}
        <div className="mt-16 pt-10 border-t border-stone-200">
          <div className="rounded-2xl bg-violet-50 border border-violet-200/60 p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-violet-600 mb-2">
              Xvault Studio
            </p>
            <h2 className="font-display text-2xl font-semibold text-stone-900 mb-3">
              The AI writing studio built for novelists
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              A co-author that reads your manuscript, a story bible that builds itself, and prose generation trained on your voice.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
            >
              Start free — 14 days, 100 credits
            </Link>
          </div>
        </div>

        <div className="mt-10">
          <Link
            href="/guides"
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            ← Back to all guides
          </Link>
        </div>
      </main>
    </div>
  );
}
