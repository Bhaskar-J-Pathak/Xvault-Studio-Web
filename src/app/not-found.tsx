import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Xvault Studio",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-violet-500 mb-4">
          404
        </p>
        <h1 className="font-display text-3xl font-semibold text-stone-900 mb-4 leading-tight">
          This page does not exist
        </h1>
        <p className="text-stone-500 text-base leading-relaxed mb-8">
          It may have moved or been removed. Try one of the links below.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
          >
            Back to home
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 hover:border-stone-300 text-stone-600 text-sm font-medium transition-colors"
          >
            Read the blog
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 hover:border-stone-300 text-stone-600 text-sm font-medium transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </div>
  );
}
