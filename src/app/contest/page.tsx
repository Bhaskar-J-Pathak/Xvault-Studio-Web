import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Clock3, Feather, HeartPulse, Network, Sparkles, Trophy } from "lucide-react";
import { getProfile, getUser } from "@/lib/auth";
import { CONTEST_CREDITS, CONTEST_ENDS_AT, CONTEST_STARTS_AT, isInActiveContest } from "@/lib/supabase";
import ContestEntry from "./contest-entry";
import { isContestEnabled } from "@/lib/contest";

export const metadata: Metadata = {
  title: "10K Story Challenge",
  description: "Write a 5,000 to 10,000 word original story in Xvault Studio. The winning writer receives a Founder's Circle lifetime subscription.",
};

const details = [
  { icon: Trophy, title: "A lifetime prize", text: "The winner receives a Founder's Circle lifetime subscription with 500 credits every month." },
  { icon: Sparkles, title: `${CONTEST_CREDITS} contest credits`, text: "Reserved for your contest manuscript, so they cannot be spent on another project." },
  { icon: Clock3, title: "September 15–30", text: "Every writer shares the same two-week challenge window and closing date." },
];

const steps = [
  { number: "01", title: "Enter", text: "Create your free challenge workspace. Your manuscript opens with Chapter 1 ready." },
  { number: "02", title: "Write", text: "Draft 5,000 to 10,000 words with Story Pulse, World Board, Alex, and prose tools." },
  { number: "03", title: "Submit", text: "Confirm your finished entry before September 30 at 11:59 PM UTC." },
];

export default async function ContestPage() {
  if (!isContestEnabled()) notFound();

  const user = await getUser();
  const profile = user ? await getProfile(user.id) : null;
  const enrolled = profile?.contest_slug === "xvault-10k-2026";
  const active = profile ? isInActiveContest(profile) : false;
  const now = new Date();
  const upcoming = now < new Date(CONTEST_STARTS_AT);
  const closed = now > new Date(CONTEST_ENDS_AT);

  return (
    <main id="top" className="min-h-screen overflow-hidden bg-[#F8F7FC] text-[#30283F]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(238,232,255,.75),transparent_38%)]" />

      <nav className="relative z-20 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full border border-violet-200/60 bg-white/75 px-5 py-3 shadow-sm backdrop-blur-xl sm:px-7">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-medium text-[#30283F]">
          <Image src="/XVault.svg" alt="Xvault Studio" width={25} height={25} /> Xvault Studio
        </Link>
        <Link href={user ? "/dashboard" : "/auth"} className="text-sm font-medium text-violet-900/55 transition hover:text-violet-800">{user ? "Dashboard" : "Sign in"}</Link>
      </nav>

      <section className="relative z-10 mx-auto max-w-5xl px-5 pb-20 pt-20 text-center sm:px-8 sm:pt-28">
        <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-white/65 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[.16em] text-violet-700 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-violet-600" /> Xvault 10K Story Challenge</p>
        <h1 className="mx-auto mt-8 max-w-4xl font-[family-name:var(--font-fraunces)] text-5xl font-normal leading-[1.04] tracking-[-.035em] text-[#4A4256] sm:text-6xl lg:text-[4.5rem]">Build a world.<br /><span className="text-violet-600">Finish the story.</span></h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-violet-950/50 sm:text-lg">Write one original story between September 15 and 30. Xvault gives you a focused workspace to help you reach the ending.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">{["5,000–10,000 words", "Any genre", "No card required"].map(item => <span key={item} className="rounded-full border border-violet-200/70 bg-white/55 px-3.5 py-1.5 text-xs font-medium text-violet-900/60">{item}</span>)}</div>

        <div className="mx-auto mt-14 max-w-4xl rounded-[28px] border border-violet-200/70 bg-white/80 p-7 text-left shadow-[0_20px_60px_rgba(76,29,149,.07)] sm:p-10">
          <div className="border-l-2 border-violet-400 pl-5 sm:pl-7">
            <p className="text-[11px] font-medium uppercase tracking-[.18em] text-violet-600">The prompt</p>
            <p className="mt-5 max-w-3xl font-[family-name:var(--font-fraunces)] text-2xl font-normal leading-snug text-[#51485D] sm:text-3xl">A character discovers that someone they trust remembers an event that never happened.</p>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-violet-950/48">Interpret it in any genre. The prompt should matter to the story, but it does not need to appear word for word.</p>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl text-left"><ContestEntry signedIn={Boolean(user)} enrolled={enrolled} active={active} upcoming={upcoming} closed={closed} projectId={profile?.contest_project_id} /></div>
      </section>

      <section className="relative z-10 border-y border-violet-200/60 bg-white/55 px-5 py-20 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center"><p className="text-[11px] font-semibold uppercase tracking-[.17em] text-violet-600">Everything you need to finish</p><h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-[-.025em] sm:text-5xl">A challenge with room to write.</h2></div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {details.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-violet-200/60 bg-white p-7 shadow-[0_12px_40px_rgba(76,29,149,.04)]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Icon size={18} /></span><h3 className="mt-6 text-base font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-violet-950/48">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div><p className="text-[11px] font-semibold uppercase tracking-[.17em] text-violet-600">Built into your workspace</p><h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-medium leading-tight tracking-[-.03em] sm:text-5xl">Keep the story&apos;s facts and feelings together.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-violet-950/50">The challenge is not a separate stripped-down editor. You write with the same manuscript-aware tools available throughout Xvault.</p></div>
          <div className="grid gap-4 sm:grid-cols-2"><ToolCard icon={<HeartPulse size={19} />} title="Story Pulse" text="Follow emotional states, desires, fears, and changes across chapters, with evidence from the prose." /><ToolCard icon={<Network size={19} />} title="World Board" text="See characters, locations, items, and relationships extracted from the story as the world grows." /></div>
        </div>

        <div className="mt-24">
          <div className="text-center"><p className="text-[11px] font-semibold uppercase tracking-[.17em] text-violet-600">How it works</p><h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-3xl font-medium sm:text-5xl">Three steps. One finished story.</h2></div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">{steps.map(step => <article key={step.number} className="rounded-3xl border border-violet-200/60 bg-white/60 p-7"><span className="font-mono text-xs font-medium text-violet-500">{step.number}</span><h3 className="mt-5 text-lg font-medium">{step.title}</h3><p className="mt-2 text-sm leading-6 text-violet-950/48">{step.text}</p></article>)}</div>
        </div>

        <div className="mx-auto mt-20 max-w-5xl rounded-[28px] border border-violet-200/60 bg-white/65 p-7 sm:p-10">
          <div className="grid gap-8 md:grid-cols-2"><div><h2 className="flex items-center gap-2 text-base font-medium"><Feather size={17} className="text-violet-600" /> The simple rules</h2><p className="mt-3 text-sm leading-7 text-violet-950/48">Your entry must be original, written between September 15 and 30, 2026, and between 5,000 and 10,000 words. Any genre is welcome. Xvault&apos;s AI may assist the process, but the creative decisions and final story must be yours.</p></div><div><h2 className="flex items-center gap-2 text-base font-medium"><BookOpenCheck size={17} className="text-violet-600" /> Judging and ownership</h2><p className="mt-3 text-sm leading-7 text-violet-950/48">Entries are judged on character depth, emotional impact, prose, dialogue, coherence, originality, and the ending. You retain complete ownership of your work. Heavy AI use does not improve a score.</p></div></div>
        </div>

        <div className="mt-16 flex flex-col items-center text-center"><h2 className="max-w-2xl font-[family-name:var(--font-fraunces)] text-3xl font-medium sm:text-5xl">A complete story, not another abandoned draft.</h2><a href="#top" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(109,40,217,.28)] transition hover:-translate-y-0.5 hover:bg-violet-600">Enter the challenge <ArrowRight size={16} /></a><p className="mt-5 text-xs text-violet-950/40">After the challenge, your manuscript remains yours and your normal Xvault allowance resumes.</p></div>
      </section>
    </main>
  );
}

function ToolCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="rounded-3xl border border-violet-200/60 bg-white p-7 shadow-[0_12px_40px_rgba(76,29,149,.04)]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">{icon}</span><h3 className="mt-6 text-base font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-violet-950/48">{text}</p></article>;
}
