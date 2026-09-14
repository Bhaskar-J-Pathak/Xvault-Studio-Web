"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { CONTEST_CREDITS } from "@/lib/supabase";

export default function ContestEntry({ signedIn, enrolled, active, upcoming, closed, projectId }: { signedIn: boolean; enrolled: boolean; active: boolean; upcoming: boolean; closed: boolean; projectId?: string | null }) {
  const router = useRouter();
  const ph = usePostHog();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function enter() {
    if (enrolled && projectId) { router.push(`/studio/${projectId}`); return; }
    if (closed) return;
    if (!signedIn) {
      router.push("/auth?next=/contest");
      return;
    }
    if (!agreed) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/contest/enroll", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not enter the challenge.");
      ph?.capture("contest_enrolled", { already_enrolled: Boolean(result.alreadyEnrolled) });
      router.push(`/studio/${result.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enter the challenge.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-violet-200/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(76,29,149,.09)] backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><ShieldCheck size={19}/></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-normal">{enrolled ? active ? "Your challenge is active" : upcoming ? "Your workspace is ready" : "The challenge has ended" : closed ? "Entries are now closed" : "Create your challenge workspace"}</h2>
          <p className="mt-1 text-sm leading-6 text-violet-950/48">{enrolled ? active ? "Continue your dedicated manuscript with the contest credits attached." : upcoming ? "You can open your manuscript now. Contest credits become available on September 15." : "Your manuscript remains in your account and your regular Xvault allowance is available." : closed ? "The September 2026 challenge is no longer accepting entries." : `Chapter 1 and ${CONTEST_CREDITS} manuscript-only credits are prepared automatically.`}</p>
        </div>
      </div>
      {!enrolled && <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-violet-100 py-4 text-xs text-violet-950/52">{["Chapter 1 ready", `${CONTEST_CREDITS} manuscript-only credits`, "September 15–30"].map(item => <p key={item} className="flex items-center gap-1.5"><Check size={13} className="text-violet-500"/> {item}</p>)}</div>}
      {signedIn && !enrolled && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-violet-950/55">
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${agreed ? "border-violet-600 bg-violet-600 text-white" : "border-violet-300 bg-white"}`}>
            {agreed && <Check size={13} strokeWidth={3} />}
          </span>
          <input className="sr-only" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>I am entering an original story and agree to the challenge rules shown on this page.</span>
        </label>
      )}
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button
        onClick={enter}
        disabled={loading || closed || (signedIn && !enrolled && !agreed)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(109,40,217,.16)] transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-200 disabled:text-violet-500 disabled:shadow-none"
      >
        {loading ? <><Loader2 size={17} className="animate-spin" /> Preparing your manuscript</> : <>{enrolled ? active ? "Continue writing" : upcoming ? "Open workspace" : "Go to dashboard" : closed ? "Entries closed" : signedIn ? "Enter the challenge" : "Create free account"}{!closed && <ArrowRight size={17} />}</>}
      </button>
      <p className="mt-3 text-center text-xs text-violet-950/40">
        {enrolled ? "Your regular plan was not consumed or cancelled." : signedIn ? "Your contest manuscript and credits will be ready immediately." : "Already have an account? The same button signs you in."}
      </p>
      <p className="mt-2 text-center text-[11px] text-violet-950/35">
        <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="underline underline-offset-2">Terms</Link>
      </p>
    </div>
  );
}
