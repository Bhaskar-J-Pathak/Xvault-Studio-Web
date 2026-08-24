import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/auth";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

async function getExcerpt(token: string) {
  const service = createServiceClient();

  const { data, error } = await service
    .from("shared_excerpts")
    .select("excerpt_title, novel_title, author_display_name, content, word_count, created_at")
    .eq("token", token)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const excerpt = await getExcerpt(token);
  if (!excerpt) return { title: "Excerpt not found" };

  const title  = excerpt.excerpt_title ?? "An excerpt";
  const novel  = excerpt.novel_title   ?? "";
  const author = excerpt.author_display_name ?? "";
  const desc   = excerpt.content.slice(0, 200).replace(/\n/g, " ") + "…";

  return {
    title:       `${title}${novel ? ` - ${novel}` : ""}`,
    description: desc,
    openGraph: {
      title:       `${title}${novel ? ` from ${novel}` : ""}${author ? ` by ${author}` : ""}`,
      description: desc,
      type:        "article",
    },
    twitter: {
      card:        "summary",
      title:       `${title}${novel ? ` - ${novel}` : ""}`,
      description: desc,
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const excerpt = await getExcerpt(token);
  if (!excerpt) notFound();

  const paragraphs = (excerpt.content as string)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const wordCount  = excerpt.word_count ?? paragraphs.join(" ").split(/\s+/).length;
  const readingMin = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">

      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
        <Link href="/" className="flex items-center gap-1.5 group">
          <span className="text-[13px] font-semibold tracking-tight text-[#1A1A1A]/50 group-hover:text-[#1A1A1A]/80 transition-colors">
            Xvault Studio
          </span>
        </Link>
        <Link
          href="/?ref=share"
          className="text-[12px] font-medium text-violet-600 hover:text-violet-700 transition-colors"
        >
          Write your novel with AI
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-[680px] mx-auto px-6 sm:px-8 py-16 sm:py-24">

        {/* Chapter / excerpt title */}
        <div className="mb-10">
          {excerpt.novel_title && (
            <p className="text-[12px] font-medium uppercase tracking-widest text-[#1A1A1A]/35 mb-3">
              {excerpt.novel_title}
            </p>
          )}
          <h1 className="font-display text-[28px] sm:text-[34px] font-semibold leading-tight text-[#1A1A1A] mb-3">
            {excerpt.excerpt_title}
          </h1>
          <div className="flex items-center gap-3 text-[13px] text-[#1A1A1A]/40">
            {excerpt.author_display_name && (
              <>
                <span>by {excerpt.author_display_name}</span>
                <span className="text-[#1A1A1A]/20">·</span>
              </>
            )}
            <span>{wordCount.toLocaleString()} words</span>
            <span className="text-[#1A1A1A]/20">·</span>
            <span>{readingMin} min read</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-[#1A1A1A]/15 mb-10" />

        {/* Excerpt body */}
        <article className="prose-excerpt">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={`text-[17px] sm:text-[18px] leading-[1.85] text-[#1A1A1A] font-display mb-6 ${
                i === 0
                  ? "first-letter:text-[3.5rem] first-letter:font-bold first-letter:float-left first-letter:leading-[0.75] first-letter:mr-2 first-letter:mt-1"
                  : ""
              }`}
            >
              {para}
            </p>
          ))}
        </article>

        {/* End mark */}
        <div className="flex items-center gap-3 mt-12 mb-16">
          <div className="flex-1 h-px bg-[#1A1A1A]/08" />
          <span className="text-[#1A1A1A]/20 text-sm">✦</span>
          <div className="flex-1 h-px bg-[#1A1A1A]/08" />
        </div>

        {/* Xvault CTA */}
        <div className="rounded-2xl border border-black/[0.08] bg-white px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-[#1A1A1A] mb-0.5">
              Written with Xvault Studio
            </p>
            <p className="text-[12px] text-[#1A1A1A]/45 leading-relaxed max-w-sm">
              An AI co-author that reads your entire manuscript before it says a word.
              Free 14-day trial, no credit card.
            </p>
          </div>
          <Link
            href="/?ref=share"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-[13px] font-semibold hover:bg-[#1A1A1A]/80 transition-colors"
          >
            Start writing free
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 text-center py-8 text-[11px] text-[#1A1A1A]/25">
        Shared via{" "}
        <Link href="/" className="hover:text-[#1A1A1A]/50 transition-colors">
          Xvault Studio
        </Link>
      </footer>
    </div>
  );
}
