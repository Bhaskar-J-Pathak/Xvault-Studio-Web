import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug, formatDate } from "@/lib/blog";
import { ContradictionDemo } from "@/components/blog/ContradictionDemo";
import { StoryBiblePreview } from "@/components/blog/StoryBiblePreview";
import { SevenBeatSpine } from "@/components/blog/SevenBeatSpine";
import { FiveQuestionsCards } from "@/components/blog/FiveQuestionsCards";
import { CharacterDriftLog } from "@/components/blog/CharacterDriftLog";
import { SubplotWebDiagram } from "@/components/blog/SubplotWebDiagram";
import { BibleGrowthTimeline } from "@/components/blog/BibleGrowthTimeline";
import { RevisionModeComparison } from "@/components/blog/RevisionModeComparison";

const mdxComponents = {
  ContradictionDemo,
  StoryBiblePreview,
  SevenBeatSpine,
  FiveQuestionsCards,
  CharacterDriftLog,
  SubplotWebDiagram,
  BibleGrowthTimeline,
  RevisionModeComparison,
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Xvault Blog`,
    description: post.description,
    alternates: { canonical: `https://xvault.dev/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",  item: "https://xvault.dev" },
      { "@type": "ListItem", position: 2, name: "Blog",  item: "https://xvault.dev/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://xvault.dev/blog/${post.slug}` },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: "Bhaskar",
      jobTitle: "Founder",
      worksFor: {
        "@type": "Organization",
        name: "Xvault Studio",
        url: "https://xvault.dev",
      },
    },
    publisher: {
      "@type": "Organization",
      name: "Xvault Studio",
      url: "https://xvault.dev",
      logo: { "@type": "ImageObject", url: "https://xvault.dev/XVault.svg" },
    },
    url: `https://xvault.dev/blog/${post.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://xvault.dev/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
    articleSection: post.tags[0] ?? "Writing",
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* Nav */}
      <header className="border-b border-black/[0.06] bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/blog"
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            ← All posts
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        {/* Post header */}
        <div className="mb-12">
          <div className="flex gap-3 mb-4">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold tracking-widest uppercase text-violet-600/70"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-stone-900 leading-tight mb-5">
            {post.title}
          </h1>

          <p className="text-stone-500 text-lg leading-relaxed mb-6 max-w-2xl">
            {post.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-stone-400 pb-10 border-b border-stone-200">
            <span>{post.author}</span>
            <span>·</span>
            <span>Last updated {formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readTime} min read</span>
          </div>
        </div>

        {/* Post content */}
        <div className="blog-prose">
          <MDXRemote source={post.content} components={mdxComponents} />
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
              Start free: 14 days, 100 credits
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-10">
          <Link
            href="/blog"
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            ← Back to all posts
          </Link>
        </div>
      </main>
    </div>
  );
}
