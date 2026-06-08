import { notFound, redirect } from "next/navigation";
import { getUser, getProfile, createServerSupabaseClient } from "@/lib/auth";
import WorldBoardView from "./_components/world-board-view";
import type { Chapter } from "./_components/world-board-view";
import TutorialOverlay from "../_components/tutorial-overlay";

export default async function WorldBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const user = await getUser();
  if (!user) redirect("/auth");

  const [profile, supabase] = await Promise.all([
    getProfile(user.id),
    createServerSupabaseClient(),
  ]);

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) notFound();

  // Fetch entities, relationships, and chapters in parallel
  const [{ data: entities }, { data: relationships }, { data: chapters }] = await Promise.all([
    supabase
      .from("entities")
      .select("id, name, type, attributes, confidence, position, first_seen_chapter_id")
      .eq("project_id", projectId)
      .order("name"),
    supabase
      .from("relationships")
      .select("id, source_id, target_id, label")
      .eq("project_id", projectId),
    supabase
      .from("chapters")
      .select("id, title, position")
      .eq("project_id", projectId)
      .order("position"),
  ]);

  const safeEntities      = entities      ?? [];
  const safeRelationships = relationships ?? [];
  const safeChapters      = (chapters     ?? []) as Chapter[];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2.5">
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            className="text-[#1A1A1A]/40"
          >
            <circle cx="12" cy="5"  r="2" />
            <circle cx="5"  cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
            <line x1="12" y1="7" x2="5.5"  y2="17" />
            <line x1="12" y1="7" x2="18.5" y2="17" />
          </svg>
          <h1 className="text-sm font-semibold text-[#1A1A1A]">World Board</h1>
          {safeEntities.length > 0 && (
            <span className="text-xs text-[#1A1A1A]/35">
              {safeEntities.length} {safeEntities.length === 1 ? "entity" : "entities"}
              {safeRelationships.length > 0 && (
                <> · {safeRelationships.length} {safeRelationships.length === 1 ? "relationship" : "relationships"}</>
              )}
            </span>
          )}
        </div>
        <p className="text-xs text-[#1A1A1A]/30 hidden sm:block">
          Auto-updates as you write · drag to rearrange
        </p>
      </div>

      {/* View (Canvas + Debug tabs) */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <WorldBoardView
          initialEntities={safeEntities as Parameters<typeof WorldBoardView>[0]["initialEntities"]}
          initialRelationships={safeRelationships}
          projectId={projectId}
          chapters={safeChapters}
        />
      </div>

      {/* Tutorial overlay — step 7 (World Board) */}
      {profile && !profile.onboarding_done &&
        profile.onboarding_step >= 1 && profile.onboarding_step <= 8 && (
        <TutorialOverlay
          projectId={projectId}
          initialStep={profile.onboarding_step}
          initialDone={false}
        />
      )}
    </div>
  );
}
