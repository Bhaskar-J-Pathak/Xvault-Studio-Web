import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import DefaultCover from "./_components/default-cover";
import NewProjectCard from "./_components/new-project-card";
import ProjectCardActions from "./_components/project-card-actions";
import ReferralLinker from "./_components/referral-linker";
import UpgradeBanner from "./_components/upgrade-banner";
import { getUser, getProfile, createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { isInTrial, creditsRemaining, creditsCap, TRIAL_CREDITS } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";
import type { DbProject } from "@/types/database";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatWords(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function relativeDate(iso: string) {
  const diffMs   = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type ProjectWithStats = DbProject & {
  total_words:      number;
  chapter_count:    number;
  cover_image_url?: string | null;
  synopsis?:        string | null;
  writing_status?:  string | null;
  last_chapter_id?: string | null;
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/auth");

  const [profile, supabase, { preview }] = await Promise.all([
    getProfile(user.id),
    createServerSupabaseClient(),
    searchParams,
  ]);

  const { data: raw } = await supabase
    .from("projects")
    .select("*, chapters(id, word_count, updated_at)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const projects: ProjectWithStats[] = (raw ?? []).map((p: DbProject & { chapters: { id: string; word_count: number; updated_at: string }[] }) => {
    const chapters    = p.chapters ?? [];
    const lastChapter = chapters.length > 0
      ? chapters.reduce((a, b) => (b.updated_at > a.updated_at ? b : a))
      : null;
    return {
      ...p,
      total_words:     chapters.reduce((s, c) => s + (c.word_count ?? 0), 0),
      chapter_count:   chapters.length,
      last_chapter_id: lastChapter?.id ?? null,
    };
  });

  const totalWords = projects.reduce((s, p) => s + p.total_words, 0);
  let inTrial    = profile ? isInTrial(profile as Parameters<typeof isInTrial>[0]) : false;
  let credits    = profile ? creditsRemaining(profile as Parameters<typeof creditsRemaining>[0]) : 0;
  const cap      = profile ? creditsCap(profile as Parameters<typeof creditsCap>[0]) : TRIAL_CREDITS;

  // Preview mode — lifetime accounts only, so real users are never affected
  const isLifetime = profile?.is_lifetime === true;
  if (isLifetime && preview === "trial")    { inTrial = true;  credits = 12; }
  if (isLifetime && preview === "expired")  { inTrial = false; credits = 0; }

  // Welcome email — fires once
  if (profile && !profile.welcome_email_sent && user.email) {
    const service = createServiceClient();
    const { data: updated } = await service
      .from("profiles")
      .update({ welcome_email_sent: true })
      .eq("id", user.id)
      .eq("welcome_email_sent", false)
      .select("id");
    if (updated?.length) {
      sendWelcomeEmail(user.email, user.email.split("@")[0]).catch(console.error);
    }
  }

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name     = user.email?.split("@")[0] ?? "writer";

  return (
    <>
      <ReferralLinker />
      <div className="px-6 sm:px-10 py-10 sm:py-14 max-w-[1080px] mx-auto">

        {/* ── Greeting ── */}
        <div className="mb-10 sm:mb-12">
          <p className="text-[11px] text-[#A1A1AA] dark:text-white/55 mb-1.5 tracking-wide">
            {greeting}
          </p>
          <h1 className="text-[28px] sm:text-[32px] font-semibold text-[#0F0F0F] dark:text-white/90 tracking-tight leading-none">
            {name}
          </h1>
          {totalWords > 0 && (
            <p className="text-[13px] text-[#71717A] dark:text-white/50 mt-2.5">
              {formatWords(totalWords)} words written
            </p>
          )}
        </div>

        {/* ── Trial / upgrade banner ── */}
        {profile && inTrial && (
          <UpgradeBanner
            variant={credits <= 20 ? "trial-urgent" : "trial"}
            credits={credits}
            cap={cap}
            daysLeft={Math.max(0, Math.ceil((new Date(profile.trial_ends_at!).getTime() - Date.now()) / 86_400_000))}
          />
        )}

        {/* ── Post-trial free user banner ── */}
        {profile && !inTrial && (profile.plan === "free" || (isLifetime && preview === "expired")) && (
          <UpgradeBanner variant="expired" />
        )}

        {/* ── Books grid ── */}
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
            <NewProjectCard />
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}

      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/[0.06] ring-1 ring-black/[0.06] dark:ring-white/[0.10] shadow-sm flex items-center justify-center mb-5">
        <BookOpen size={18} className="text-[#A1A1AA] dark:text-white/40" />
      </div>
      <h2 className="text-[16px] font-semibold text-[#0F0F0F] dark:text-white/85 tracking-tight mb-2">
        Your first story starts here
      </h2>
      <p className="text-[13px] text-[#71717A] dark:text-white/50 max-w-[240px] leading-relaxed">
        Paste a scene you&apos;re stuck on, or start from a blank page.
      </p>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectWithStats }) {
  const href = project.last_chapter_id
    ? `/studio/${project.id}/${project.last_chapter_id}`
    : `/studio/${project.id}`;

  return (
    <div className="group relative transition-transform duration-300 hover:-translate-y-1.5">

      {/* ── Book cover (portrait) ── */}
      <Link href={href} className="block">
        <div
          className="relative aspect-[2/3] overflow-hidden rounded-[4px]
            shadow-[3px_0_0_0_#E6E3DF,5px_0_0_0_#DDD9D4,1px_5px_18px_rgba(0,0,0,0.14)]
            dark:shadow-[3px_0_0_0_#272424,5px_0_0_0_#201E1E,1px_5px_18px_rgba(0,0,0,0.55)]
            group-hover:shadow-[3px_0_0_0_#E6E3DF,5px_0_0_0_#DDD9D4,3px_12px_32px_rgba(0,0,0,0.22)]
            dark:group-hover:shadow-[3px_0_0_0_#272424,5px_0_0_0_#201E1E,3px_12px_32px_rgba(0,0,0,0.70)]
            transition-shadow duration-300"
        >
          {/* Cover art */}
          {project.cover_image_url ? (
            <Image
              src={project.cover_image_url}
              alt={project.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <DefaultCover genre={project.genre} title={project.title} />
          )}

          {/* Spine — left-edge gradient to simulate binding */}
          <div
            className="absolute inset-y-0 left-0 w-5 z-10 pointer-events-none"
            style={{
              background: "linear-gradient(to right, rgba(0,0,0,0.32), rgba(0,0,0,0.09) 55%, transparent)",
            }}
          />

          {/* Top sheen */}
          <div
            className="absolute top-0 inset-x-0 h-px z-10 pointer-events-none"
            style={{ background: "rgba(255,255,255,0.20)" }}
          />
        </div>
      </Link>

      {/* ── Actions on hover (overlay, top-right of cover) ── */}
      <div className="absolute top-2 right-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
        <ProjectCardActions
          project={{
            id:              project.id,
            title:           project.title,
            genre:           project.genre ?? null,
            synopsis:        project.synopsis ?? null,
            writing_status:  project.writing_status ?? null,
            cover_image_url: project.cover_image_url ?? null,
          }}
        />
      </div>

      {/* ── Text below the book ── */}
      <Link href={href} className="block mt-3 px-0.5">
        <h3 className="text-[13px] font-semibold text-[#0F0F0F] dark:text-white/85 truncate leading-snug">
          {project.title}
        </h3>
        <p className="text-[11px] text-[#71717A] dark:text-white/50 mt-0.5 truncate">
          {project.chapter_count} {project.chapter_count === 1 ? "ch" : "chs"}
          {project.total_words > 0 && <> · {formatWords(project.total_words)}w</>}
          {" · "}{relativeDate(project.updated_at)}
        </p>
      </Link>
    </div>
  );
}
