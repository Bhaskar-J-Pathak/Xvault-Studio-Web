"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Feather, Loader2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { CONTEST_CREDITS } from "@/lib/supabase";

export default function ContestInvite() {
  const router = useRouter();
  const ph = usePostHog();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enterContest() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/contest/enroll", { method: "POST" });
      const result = await response.json() as { projectId?: string; error?: string; alreadyEnrolled?: boolean };
      if (!response.ok || !result.projectId) throw new Error(result.error || "Could not create your challenge workspace.");
      ph?.capture("contest_enrolled", { source: "dashboard", already_enrolled: Boolean(result.alreadyEnrolled) });
      router.push(`/studio/${result.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enter the challenge.");
      setLoading(false);
    }
  }

  return (
    <aside className="mb-5 rounded-2xl border border-violet-200/70 bg-violet-50/55 px-4 py-4 sm:flex sm:items-center sm:gap-5 sm:px-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
        <Feather size={16} />
      </span>
      <div className="mt-3 min-w-0 flex-1 sm:mt-0">
        <p className="text-sm font-medium text-[#292333] dark:text-white/90">The 10K Story Challenge</p>
        <p className="mt-1 text-xs leading-5 text-[#716A7A] dark:text-white/50">
          September 15–30. One dedicated manuscript with {CONTEST_CREDITS} challenge credits.
          By entering, you agree to the <Link href="/contest" className="text-violet-600 underline underline-offset-2">challenge rules</Link>.
        </p>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
      <button
        onClick={enterContest}
        disabled={loading}
        className="mt-4 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60 sm:mt-0 sm:w-auto"
      >
        {loading ? <><Loader2 size={14} className="animate-spin" /> Preparing</> : <>Enter challenge <ArrowRight size={14} /></>}
      </button>
    </aside>
  );
}
