import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, BookOpen, Zap, ArrowRight, Clock } from "lucide-react";
import { getUser, getProfile, createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { isInTrial, PLAN_LIMITS, creditsRemaining, creditsCap, TRIAL_CREDITS } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";
import type { DbProject } from "@/types/database";
import DashboardClient from "./_components/dashboard-client";
import ProjectCardActions from "./_components/project-card-actions";
import ReferralCard from "./_components/referral-card";
import ReferralLinker from "./_components/referral-linker";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const GENRE_STYLES: Record<string, string> = {
  fantasy:  "bg-violet-50  text-violet-700  border-violet-100",
  scifi:    "bg-blue-50    text-blue-700    border-blue-100",
  thriller: "bg-red-50     text-red-700     border-red-100",
  romance:  "bg-pink-50    text-pink-700    border-pink-100",
  mystery:  "bg-amber-50   text-amber-700   border-amber-100",
  horror:   "bg-zinc-100   text-zinc-700    border-zinc-200",
  literary: "bg-teal-50    text-teal-700    border-teal-100",
  other:    "bg-gray-50    text-gray-600    border-gray-200",
};

const GENRE_LABELS: Record<string, string> = {
  fantasy:  "Fantasy",
  scifi:    "Sci-Fi",
  thriller: "Thriller",
  romance:  "Romance",
  mystery:  "Mystery",
  horror:   "Horror",
  literary: "Literary",
  other:    "Other",
};

// ── Types ────────────────────────────────────────────────────────────────────

type ProjectWithStats = DbProject & {
  total_words:   number;
  chapter_count: number;
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/auth");

  const [profile, supabase] = await Promise.all([
    getProfile(user.id),
    createServerSupabaseClient(),
  ]);

  // Fetch projects + chapter word counts in one query
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

  // Global stats
  const totalWords    = projects.reduce((s, p) => s + p.total_words, 0);
  const inTrial       = profile ? isInTrial(profile as Parameters<typeof isInTrial>[0]) : false;
  const credits       = profile ? creditsRemaining(profile as Parameters<typeof creditsRemaining>[0]) : 0;
  const cap           = profile ? creditsCap(profile as Parameters<typeof creditsCap>[0]) : TRIAL_CREDITS;
  const aiUsed        = profile?.ai_requests_this_month ?? 0;
  const aiLimit       = profile ? (inTrial ? null : PLAN_LIMITS[profile.plan] + (profile.bonus_credits ?? 0)) : null;

  // Welcome email — fires once for OTP users (who never pass through /auth/callback).
  // Atomic: only the first render that flips welcome_email_sent from false → true sends it.
  if (profile && !profile.welcome_email_sent && user.email) {
    const service = createServiceClient();
    const { data: emailUpdated } = await service
      .from("profiles")
      .update({ welcome_email_sent: true })
      .eq("id", user.id)
      .eq("welcome_email_sent", false)
      .select("id");
    if (emailUpdated && emailUpdated.length > 0) {
      sendWelcomeEmail(user.email).catch((e) =>
        console.error("[dashboard] welcome email failed:", e)
      );
    }
  }

  // First-login: show genre picker when onboarding hasn't started.
  // Also covers the case where profile is null (trigger failure) — new users
  // with no profile row should always see the genre picker; seed-sample will
  // create the profile via its service-client guard.
  const needsOnboarding = !profile
    || (profile.onboarding_step === 0 && !profile.onboarding_done);

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = user.email?.split("@")[0] ?? "writer";

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">
      {/* Links referral code from localStorage after signup — renders nothing */}
      <ReferralLinker />

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">
            {greeting}, {name}.
          </h1>
          <p className="text-sm text-[#1A1A1A]/45 mt-1">
            {projects.length === 0
              ? "Create your first project to start writing."
              : `You have ${projects.length} project${projects.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
        {/* New project button — client component handles modal + genre picker */}
        <DashboardClient
          needsOnboarding={needsOnboarding}
          isBeta={process.env.BETA_MODE === "true"}
        />
      </div>

      {/* Trial banner */}
      {profile && inTrial && (
        <div className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border ${
          credits <= 20 ? "bg-amber-50 border-amber-100" : "bg-violet-50 border-violet-100"
        }`}>
          <div className="flex items-center gap-2.5">
            <Zap size={15} className={credits <= 20 ? "text-amber-600" : "text-violet-600"} fill="currentColor" />
            <span className={`text-sm font-medium ${credits <= 20 ? "text-amber-800" : "text-violet-800"}`}>
              {credits} of {cap} trial credits remaining ·{" "}
              {Math.max(
                0,
                Math.ceil(
                  (new Date(profile.trial_ends_at!).getTime() - Date.now()) /
                    86_400_000
                )
              )}{" "}
              days left
            </span>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<FileText size={16} className="text-[#1A1A1A]/40" />}
          label="Projects"
          value={projects.length.toString()}
        />
        <StatCard
          icon={<BookOpen size={16} className="text-[#1A1A1A]/40" />}
          label="Total words"
          value={formatWords(totalWords)}
        />
        <StatCard
          icon={<Zap size={16} className="text-[#1A1A1A]/40" />}
          label="AI credits"
          value={inTrial ? `${credits} left` : aiLimit !== null ? `${aiUsed} / ${aiLimit}` : `${credits}`}
          sub={inTrial ? `of ${TRIAL_CREDITS} trial credits` : aiLimit !== null ? `${Math.round((aiUsed / aiLimit) * 100)}% used` : "No active plan"}
        />
      </div>

      {/* Referral card */}
      {profile && (
        <ReferralCard
          referralCode={profile.referral_code}
          referralCount={profile.referral_count ?? 0}
          bonusCredits={profile.bonus_credits ?? 0}
        />
      )}

      {/* Projects grid */}
      <section>
        <h2 className="text-sm font-semibold text-[#1A1A1A]/50 uppercase tracking-widest mb-4">
          Your projects
        </h2>

        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">{value}</p>
        <p className="text-xs text-[#1A1A1A]/45 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-[#1A1A1A]/35 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectWithStats }) {
  const genreStyle = project.genre ? (GENRE_STYLES[project.genre] ?? GENRE_STYLES.other) : null;
  const genreLabel = project.genre ? (GENRE_LABELS[project.genre] ?? project.genre) : null;

  return (
    <div className="group bg-white rounded-2xl border border-black/[0.07] p-5 flex flex-col gap-4 hover:border-black/[0.12] hover:shadow-sm transition-all">
      {/* Top row */}
      <div className="flex items-center justify-between">
        {genreLabel ? (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${genreStyle}`}
          >
            {genreLabel}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border bg-gray-50 text-gray-400 border-gray-100">
            No genre
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] text-[#1A1A1A]/35">
            <Clock size={11} />
            {relativeDate(project.updated_at)}
          </span>
          <ProjectCardActions projectId={project.id} projectTitle={project.title} />
        </div>
      </div>

      {/* Title */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-[#1A1A1A] leading-snug line-clamp-2">
          {project.title}
        </h3>
        <p className="text-xs text-[#1A1A1A]/40 mt-1.5">
          {formatWords(project.total_words)} words
          {project.chapter_count > 0 &&
            ` · ${project.chapter_count} chapter${project.chapter_count !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Open button */}
      <Link
        href={`/studio/${project.id}`}
        className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#1A1A1A]/[0.03] hover:bg-[#1A1A1A] text-[#1A1A1A]/60 hover:text-white text-xs font-medium transition-all group/btn"
      >
        Open in Studio
        <ArrowRight
          size={13}
          className="opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-transform"
        />
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-black/[0.08] text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A]/[0.04] flex items-center justify-center mb-4">
        <BookOpen size={22} className="text-[#1A1A1A]/25" />
      </div>
      <p className="text-sm font-medium text-[#1A1A1A]/60">No projects yet</p>
      <p className="text-xs text-[#1A1A1A]/35 mt-1 mb-5">
        Create your first project to start writing.
      </p>
    </div>
  );
}
