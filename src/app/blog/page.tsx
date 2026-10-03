import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { formatDate, getAllPosts, type PostMeta } from "@/lib/blog";

export const metadata: Metadata = {
  title: "The Xvault Journal | Writing Craft for Novelists",
  description:
    "Practical essays on writing craft, revision, continuity, and the tools novelists use to finish long fiction.",
  alternates: { canonical: "https://xvault.dev/blog" },
  openGraph: {
    title: "The Xvault Journal | Writing Craft for Novelists",
    description:
      "Practical essays on writing craft, revision, continuity, and the tools novelists use to finish long fiction.",
    url: "https://xvault.dev/blog",
    type: "website",
  },
};

function PostMetaLine({ post }: { post: PostMeta }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#191714]/62">
      <span>{formatDate(post.date)}</span>
      <span aria-hidden="true" className="text-[#A6402D]">/</span>
      <span>{post.readTime} min read</span>
      <span aria-hidden="true" className="text-[#A6402D]">/</span>
      <span>{post.author}</span>
    </div>
  );
}

export default function BlogPage() {
  const posts = getAllPosts();
  const [featuredPost, ...archivePosts] = posts;

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#191714]">
      <Navbar />

      <main className="pt-[72px]">
        <section className="px-6 pb-16 pt-16 lg:px-10 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
            <div className="grid gap-10 lg:grid-cols-[0.32fr_1fr] lg:gap-16">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">
                  The Xvault Journal
                </p>
                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[#191714]/58">
                  Craft / Process / Long fiction
                </p>
              </div>

              <div>
                <h1 className="max-w-[940px] font-display text-[clamp(4.25rem,9vw,9.2rem)] leading-[0.86] tracking-[-0.065em]">
                  Notes for the long draft.
                </h1>
                <div className="mt-10 grid gap-8 border-t border-[#191714]/15 pt-7 sm:grid-cols-[1fr_auto] sm:items-end lg:mt-14">
                  <p className="max-w-[650px] text-base leading-8 text-[#191714]/70">
                    Practical essays about structure, character, continuity, revision, and the tools that help a novelist hold an entire book in mind.
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#191714]/58">
                    {posts.length.toString().padStart(2, "0")} essays in the archive
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {featuredPost ? (
          <section className="px-6 pb-20 lg:px-10 lg:pb-28">
            <div className="mx-auto max-w-[1280px] border-y border-[#191714]/15">
              <div className="grid lg:grid-cols-[0.32fr_1fr]">
                <div className="border-b border-[#191714]/15 py-7 lg:border-b-0 lg:border-r lg:py-10 lg:pr-10">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">
                    Latest field note
                  </p>
                  <p className="mt-8 font-display text-4xl tracking-[-0.04em] text-[#191714]/25 lg:mt-16 lg:text-6xl">
                    01
                  </p>
                </div>

                <article className="group py-9 lg:px-14 lg:py-12">
                  <Link href={`/blog/${featuredPost.slug}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#A6402D]">
                    <div className="flex flex-wrap gap-x-3 gap-y-2">
                      {featuredPost.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#A6402D]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h2 className="mt-6 max-w-[960px] font-display text-[clamp(2.8rem,5.4vw,6rem)] leading-[0.94] tracking-[-0.05em] transition-colors group-hover:text-[#A6402D]">
                      {featuredPost.title}
                    </h2>

                    <div className="mt-9 grid gap-8 border-t border-[#191714]/15 pt-7 md:grid-cols-[1fr_auto] md:items-end">
                      <div>
                        <p className="max-w-[720px] text-[15px] leading-7 text-[#191714]/70">
                          {featuredPost.description}
                        </p>
                        <div className="mt-6">
                          <PostMetaLine post={featuredPost} />
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.16em]">
                        Read the essay <span aria-hidden="true" className="text-lg text-[#A6402D]">→</span>
                      </span>
                    </div>
                  </Link>
                </article>
              </div>
            </div>
          </section>
        ) : null}

        <section className="px-6 pb-24 lg:px-10 lg:pb-32">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-8 border-t border-[#191714]/15 pt-8 lg:grid-cols-[0.32fr_1fr] lg:gap-16 lg:pt-10">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">
                  The archive
                </p>
                <p className="mt-5 max-w-[250px] text-sm leading-6 text-[#191714]/66">
                  Read from newest to oldest, or follow the subject that meets your manuscript where it is.
                </p>
              </div>

              {archivePosts.length > 0 ? (
                <div className="border-t border-[#191714]/15">
                  {archivePosts.map((post, index) => (
                    <article key={post.slug} className="group border-b border-[#191714]/15">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="grid gap-5 py-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A6402D] md:grid-cols-[52px_1fr_180px] md:gap-7 md:py-10"
                      >
                        <span className="font-mono text-[9px] font-semibold text-[#A6402D]">
                          {(index + 2).toString().padStart(2, "0")}
                        </span>

                        <div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {post.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#191714]/55">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h2 className="mt-3 max-w-[760px] font-display text-[clamp(2rem,3.4vw,3.6rem)] leading-[1] tracking-[-0.045em] transition-colors group-hover:text-[#A6402D]">
                            {post.title}
                          </h2>
                          <p className="mt-4 max-w-[700px] text-sm leading-7 text-[#191714]/68">
                            {post.description}
                          </p>
                        </div>

                        <div className="flex items-end justify-between gap-4 md:flex-col md:items-start md:justify-between">
                          <div className="font-mono text-[9px] uppercase leading-5 tracking-[0.12em] text-[#191714]/58">
                            <p>{formatDate(post.date)}</p>
                            <p>{post.readTime} min read</p>
                          </div>
                          <span aria-hidden="true" className="text-xl text-[#A6402D] transition-transform group-hover:translate-x-1">→</span>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="border-t border-[#191714]/15 py-8 text-sm text-[#191714]/60">
                  The first field note is being prepared.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
