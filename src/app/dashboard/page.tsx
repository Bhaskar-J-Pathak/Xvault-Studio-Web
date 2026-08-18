import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, BookOpen, Zap, ArrowRight, Clock } from "lucide-react";
import Image from "next/image";
import DefaultCover from "./_components/default-cover";
import { getUser, getProfile, createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { isInTrial, creditsRemaining, creditsCap, TRIAL_CREDITS } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";
import type { DbProject } from "@/types/database";
import DashboardClient from "./_components/dashboard-client";
import ProjectCardActions from "./_components/project-card-actions";
import ReferralLinker from "./_components/referral-linker";
import ReferralCard from "./_components/referral-card";

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

const GENRE_PILLS: Record<string, string> = {
  fantasy:  "bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/40",
  scifi:    "bg-blue-50   dark:bg-blue-900/25   text-blue-700   dark:text-blue-300   border-blue-200   dark:border-blue-700/40",
  thriller: "bg-red-50    dark:bg-red-900/25    text-red-700    dark:text-red-300    border-red-200    dark:border-red-700/40",
  romance:  "bg-pink-50   dark:bg-pink-900/25   text-pink-700   dark:text-pink-300   border-pink-200   dark:border-pink-700/40",
  mystery:  "bg-amber-50  dark:bg-amber-900/25  text-amber-700  dark:text-amber-300  border-amber-200  dark:border-amber-700/40",
  horror:   "bg-zinc-100  dark:bg-zinc-800/40   text-zinc-600   dark:text-zinc-400   border-zinc-200   dark:border-zinc-600/40",
  literary: "bg-teal-50   dark:bg-teal-900/25   text-teal-700   dark:text-teal-300   border-teal-200   dark:border-teal-700/40",
  other:    "bg-zinc-50   dark:bg-zinc-800/30   text-zinc-500   dark:text-zinc-400   border-zinc-200   dark:border-zinc-700/30",
};

const GENRE_LABELS: Record<string, string> = {
  fantasy: "Fantasy", scifi: "Sci-Fi", thriller: "Thriller",
  romance: "Romance", mystery: "Mystery", horror: "Horror",
  literary: "Literary", other: "Other",
};

type ProjectWithStats = DbProject & {
  total_words:      number;
  chapter_count:    number;
  cover_image_url?: string | null;
  synopsis?:        string | null;
  writing_status?:  string | null;
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/auth");

  const [profile, supabase] = await Promise.all([
    getProfile(user.id),
    createServerSupabaseClient(),
  ]);

  const { data: raw } = await supabase
    .from("projects")
    .select("*, chapters(word_count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const projects: ProjectWithStats[] = (raw ?? []).map((p: DbProject & { chapters: { word_count: number }[] }) => ({
    ...p,
    total_words:   (p.chapters ?? []).reduce((s, c) => s + (c.word_count ?? 0), 0),
    chapter_count: (p.chapters ?? []).length,
  }));

  const totalWords = projects.reduce((s, p) => s + p.total_words, 0);
  const inTrial    = profile ? isInTrial(profile as any) : false;
  const credits    = profile ? creditsRemaining(profile as any) : 0;
  const cap        = profile ? creditsCap(profile as any) : TRIAL_CREDITS;
  const aiUsed     = profile?.ai_requests_this_month ?? 0;
  const aiLimit    = profile ? (inTrial ? null : creditsCap(profile)) : null;

  // Welcome email (fires once)
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

  const needsOnboarding = !profile || (profile.onboarding_step === 0 && !profile.onboarding_done);
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name    = user.email?.split("@")[0] ?? "writer";

  return (
    <>
      <ReferralLinker />
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[#A1A1AA] dark:text-white/30 uppercase tracking-widest mb-1">
              {greeting}
            </p>
            <h1 className="text-[22px] font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight leading-tight truncate">
              {name}
            </h1>
            <p className="text-[13px] text-[#71717A] dark:text-white/40 mt-1">
              {projects.length === 0
                ? "Create your first project to start writing."
                : `${projects.length} project${projects.length !== 1 ? "s" : ""} · ${formatWords(totalWords)} words written`}
            </p>
          </div>
          <div className="flex-shrink-0">
            <DashboardClient
              needsOnboarding={needsOnboarding}
              isBeta={process.env.BETA_MODE === "true"}
            />
          </div>
        </div>

        {/* ── Trial banner ── */}
        {profile && inTrial && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] ${
            credits <= 20
              ? "bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-700/30 text-amber-800 dark:text-amber-300"
              : "bg-violet-50 dark:bg-violet-900/15 border-violet-200 dark:border-violet-700/30 text-violet-800 dark:text-violet-300"
          }`}>
            <Zap size={14} fill="currentColor" className="shrink-0" />
            <span>
              <span className="font-semibold">{credits}</span> of {cap} trial credits remaining
              {" · "}
              <span className="font-semibold">
                {Math.max(0, Math.ceil((new Date(profile.trial_ends_at!).getTime() - Date.now()) / 86_400_000))}
              </span> days left
            </span>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Projects"
            value={projects.length.toString()}
            icon={<FileText size={15} />}
          />
          <StatCard
            label="Total words"
            value={formatWords(totalWords)}
            icon={<BookOpen size={15} />}
          />
          <StatCard
            label="AI credits"
            value={inTrial
              ? `${credits} / ${cap}`
              : aiLimit !== null
              ? `${aiUsed} / ${aiLimit}`
              : String(credits)}
            sub={inTrial
              ? "Trial"
              : aiLimit !== null
              ? `${Math.round((aiUsed / aiLimit) * 100)}% used`
              : undefined}
            icon={<Zap size={15} fill="currentColor" />}
          />
        </div>

        {/* ── Referrals ── */}
        {profile && (
          <section>
            <SectionLabel>Referrals</SectionLabel>
            <ReferralCard
              referralCode={profile.referral_code}
              referralCount={profile.referral_count ?? 0}
              bonusCredits={profile.bonus_credits ?? 0}
            />
          </section>
        )}

        {/* ── Projects ── */}
        <section>
          <SectionLabel>
            Projects
            {projects.length > 0 && (
              <span className="ml-1.5 text-[10px] font-semibold bg-[#E4E4E7] dark:bg-white/[0.08] text-[#71717A] dark:text-white/40 px-1.5 py-0.5 rounded-md">
                {projects.length}
              </span>
            )}
          </SectionLabel>

          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-[11px] font-semibold text-[#A1A1AA] dark:text-white/30 uppercase tracking-widest flex items-center gap-1.5">
        {children}
      </h2>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#161329] rounded-2xl ring-1 ring-black/[0.06] dark:ring-white/[0.07] px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-[#A1A1AA] dark:text-white/30 uppercase tracking-widest">
          {label}
        </p>
        <span className="text-[#D4D4D8] dark:text-white/15">{icon}</span>
      </div>
      <p className="text-[26px] font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight leading-none">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-[#A1A1AA] dark:text-white/30 mt-1.5">{sub}</p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-[#E4E4E7] dark:border-white/[0.08] text-center">
      <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] dark:bg-white/[0.05] flex items-center justify-center mb-3">
        <BookOpen size={18} className="text-[#A1A1AA] dark:text-white/25" />
      </div>
      <p className="text-[13px] font-medium text-[#71717A] dark:text-white/40">No projects yet</p>
      <p className="text-[12px] text-[#A1A1AA] dark:text-white/25 mt-1">
        Hit &ldquo;New project&rdquo; to get started.
      </p>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  drafting:  "Drafting",
  paused:    "Paused",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  drafting:  "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700/30",
  paused:    "bg-amber-50  dark:bg-amber-900/20  text-amber-600  dark:text-amber-400  border-amber-200  dark:border-amber-700/30",
  completed: "bg-green-50  dark:bg-green-900/20  text-green-600  dark:text-green-400  border-green-200  dark:border-green-700/30",
};

function ProjectCard({ project }: { project: ProjectWithStats }) {
  const genreLabel    = project.genre ? (GENRE_LABELS[project.genre] ?? project.genre) : null;
  const statusLabel   = project.writing_status ? (STATUS_LABELS[project.writing_status] ?? null) : null;
  const statusClass   = project.writing_status ? (STATUS_COLORS[project.writing_status] ?? STATUS_COLORS.drafting) : null;

  return (
    <div className="group bg-white dark:bg-[#161329] rounded-2xl ring-1 ring-black/[0.06] dark:ring-white/[0.07] hover:ring-black/[0.11] dark:hover:ring-white/[0.13] flex flex-col transition-all duration-150 overflow-hidden">

      {/* Cover image */}
      <div className="relative h-[160px] w-full shrink-0 bg-[#F4F4F5] dark:bg-white/[0.04]">
        {project.cover_image_url ? (
          <Image
            src={project.cover_image_url}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <DefaultCover genre={project.genre} title={project.title} />
        )}

        {/* Actions overlay */}
        <div className="absolute top-2 right-2">
          <ProjectCardActions
            project={{
              id:             project.id,
              title:          project.title,
              genre:          project.genre ?? null,
              synopsis:       project.synopsis ?? null,
              writing_status: project.writing_status ?? null,
              cover_image_url: project.cover_image_url ?? null,
            }}
          />
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {genreLabel && (
            <span className={`inline-flex items-center px-2 py-[3px] rounded-md text-[10px] font-medium border ${GENRE_PILLS[project.genre!] ?? GENRE_PILLS.other}`}>
              {genreLabel}
            </span>
          )}
          {statusLabel && statusClass && (
            <span className={`inline-flex items-center px-2 py-[3px] rounded-md text-[10px] font-medium border ${statusClass}`}>
              {statusLabel}
            </span>
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1">
          <h3 className="text-[14px] font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] leading-snug line-clamp-2">
            {project.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-[#A1A1AA] dark:text-white/30">
              {formatWords(project.total_words)} words
              {project.chapter_count > 0 && ` · ${project.chapter_count} ch.`}
            </span>
            <span className="text-[#E4E4E7] dark:text-white/10">·</span>
            <span className="flex items-center gap-1 text-[11px] text-[#A1A1AA] dark:text-white/25">
              <Clock size={9} />
              {relativeDate(project.updated_at)}
            </span>
          </div>
          {project.synopsis && (
            <p className="text-[11px] text-[#A1A1AA] dark:text-white/30 mt-2 line-clamp-2 leading-relaxed">
              {project.synopsis}
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/studio/${project.id}`}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F4F4F5] dark:bg-white/[0.05] hover:bg-[#0F0F0F] dark:hover:bg-white text-[#71717A] dark:text-white/40 hover:text-white dark:hover:text-[#0E0C1B] text-[12px] font-medium transition-all duration-150 group/btn"
        >
          Open in Studio
          <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform duration-150" />
        </Link>
      </div>
    </div>
  );
}
