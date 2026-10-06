import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import ArticleLayout from "@/components/editorial/ArticleLayout";
import { getAllPosts, getPostBySlug, formatDate } from "@/lib/blog";
import { ContradictionDemo } from "@/components/blog/ContradictionDemo";
import { StoryBiblePreview } from "@/components/blog/StoryBiblePreview";
import { SevenBeatSpine } from "@/components/blog/SevenBeatSpine";
import { FiveQuestionsCards } from "@/components/blog/FiveQuestionsCards";
import { CharacterDriftLog } from "@/components/blog/CharacterDriftLog";
import { SubplotWebDiagram } from "@/components/blog/SubplotWebDiagram";
import { BibleGrowthTimeline } from "@/components/blog/BibleGrowthTimeline";
import { RevisionModeComparison } from "@/components/blog/RevisionModeComparison";
import { TwoPassageContinuityMap } from "@/components/blog/TwoPassageContinuityMap";

const mdxComponents = {
  ContradictionDemo,
  StoryBiblePreview,
  SevenBeatSpine,
  FiveQuestionsCards,
  CharacterDriftLog,
  SubplotWebDiagram,
  BibleGrowthTimeline,
  RevisionModeComparison,
  TwoPassageContinuityMap,
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
    title: post.title,
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <ArticleLayout
        section="The Xvault Journal"
        title={post.title}
        description={post.description}
        details={[post.author, formatDate(post.date), `${post.readTime} min read`]}
        tags={post.tags}
        backHref="/blog"
        backLabel="All journal essays"
      >
          <MDXRemote source={post.content} components={mdxComponents} />
      </ArticleLayout>
    </>
  );
}
