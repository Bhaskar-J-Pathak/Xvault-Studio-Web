import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | Xvault Studio",
  description: "Writing craft, AI tools for novelists, and the thinking behind Xvault Studio.",
  openGraph: {
    title: "Blog | Xvault Studio",
    description: "Writing craft, AI tools for novelists, and the thinking behind Xvault Studio.",
    type: "website",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

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
            The Xvault Blog
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-stone-900 leading-tight mb-4">
            Writing craft &amp; tools<br className="hidden sm:block" /> for novelists
          </h1>
          <p className="text-stone-500 text-lg leading-relaxed max-w-xl">
            Practical advice on outlining, worldbuilding, revision, and how AI fits into a serious writing practice.
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <p className="text-stone-400 text-sm">No posts yet.</p>
        ) : (
          <div className="divide-y divide-stone-200">
            {posts.map((post) => (
              <article key={post.slug} className="py-8 group">
                <Link href={`/blog/${post.slug}`} className="block">
                  {/* Tags */}
                  <div className="flex gap-3 mb-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold tracking-widest uppercase text-violet-600/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="font-display text-2xl sm:text-[1.6rem] font-semibold text-stone-900 leading-snug mb-3 group-hover:text-violet-700 transition-colors">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="text-stone-500 text-base leading-relaxed mb-4 max-w-2xl">
                    {post.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span>{formatDate(post.date)}</span>
                    <span>·</span>
                    <span>{post.readTime} min read</span>
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
