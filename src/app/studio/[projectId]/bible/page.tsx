import { notFound, redirect } from "next/navigation";
import { getUser, getProfile, createServerSupabaseClient } from "@/lib/auth";
import BibleView from "./_components/bible-view";
import TutorialOverlay from "../_components/tutorial-overlay";

export const dynamic = "force-dynamic";

export default async function BiblePage({
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

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, genre")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project) notFound();

  const [
    { data: bible },
    { data: chapters },
    { data: entities },
    { data: threads },
  ] = await Promise.all([
    supabase
      .from("story_bibles")
      .select("id, project_intent, style_notes, synopsis")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("chapters")
      .select("id, title, position, word_count, summary")
      .eq("project_id", projectId)
      .order("position"),
    supabase
      .from("entities")
      .select("id, name, type, description, attributes")
      .eq("project_id", projectId)
      .order("name"),
    supabase
      .from("plot_threads")
      .select("id, description, status")
      .eq("project_id", projectId)
      .neq("status", "dead")
      .order("created_at"),
  ]);

  return (
    <>
      <BibleView
        projectId={projectId}
        projectTitle={project.title}
        projectGenre={project.genre ?? ""}
        bible={bible ?? null}
        chapters={chapters ?? []}
        entities={entities ?? []}
        threads={threads ?? []}
      />

      {/* Tutorial overlay */}
      {profile && !profile.onboarding_done &&
        profile.onboarding_step >= 1 && profile.onboarding_step <= 8 && (
        <TutorialOverlay
          projectId={projectId}
          initialStep={profile.onboarding_step}
          initialDone={false}
        />
      )}
    </>
  );
}
