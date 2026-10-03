import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import ArticleLayout from "@/components/editorial/ArticleLayout";
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
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `https://xvault.dev/guides/${guide.slug}` },
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

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",   item: "https://xvault.dev" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://xvault.dev/guides" },
      { "@type": "ListItem", position: 3, name: guide.title, item: `https://xvault.dev/guides/${guide.slug}` },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.date || new Date().toISOString().split("T")[0],
    dateModified: guide.date || new Date().toISOString().split("T")[0],
    author: {
      "@type": "Organization",
      name: "Xvault Studio",
      url: "https://xvault.dev",
    },
    publisher: {
      "@type": "Organization",
      name: "Xvault Studio",
      url: "https://xvault.dev",
      logo: { "@type": "ImageObject", url: "https://xvault.dev/XVault.svg" },
    },
    url: `https://xvault.dev/guides/${guide.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://xvault.dev/guides/${guide.slug}`,
    },
    about: { "@type": "Thing", name: `${guide.genre} Fiction Writing` },
    keywords: `${guide.genre} novel writing, how to write a ${guide.genre.toLowerCase()} novel, fiction writing guide`,
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
        section="Writing guide"
        title={guide.title}
        description={guide.description}
        details={["Xvault Studio", `${guide.readTime} min read`]}
        tags={[guide.genre, "Novel craft"]}
        backHref="/guides"
        backLabel="All writing guides"
      >
          <MDXRemote source={guide.content} />
      </ArticleLayout>
    </>
  );
}
