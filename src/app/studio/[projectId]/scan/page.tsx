import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient, getUser } from "@/lib/auth";
import StoryScanView from "./story-scan-view";

export const dynamic = "force-dynamic";

export default async function StoryScanPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await getUser();
  if (!user) redirect("/auth");
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase.from("projects").select("id,title")
    .eq("id", projectId).eq("user_id", user.id).single();
  if (!project) notFound();

  const [
    { data: chapters },
    { data: entities },
    { data: relationships },
    { data: threads },
    { data: observations },
    { data: profile },
  ] = await Promise.all([
    supabase.from("chapters").select("id,title,position,word_count").eq("project_id", projectId).order("position"),
    supabase.from("entities").select("id,name,type").eq("project_id", projectId).order("name"),
    supabase.from("relationships").select("id").eq("project_id", projectId),
    supabase.from("plot_threads").select("id,description,status").eq("project_id", projectId).order("created_at"),
    supabase.from("story_pulse_observations").select("id,chapter_id,character_name,emotional_state,severity,continuity_note").eq("project_id", projectId).order("created_at"),
    supabase.from("profiles").select("plan,is_lifetime,subscription_status").eq("id", user.id).maybeSingle(),
  ]);

  // Fail closed: if the profile cannot be loaded, do not show a paid-plan ad
  // to someone who may already be subscribed.
  const showUpgradePrompt = profile
    ? !(profile.is_lifetime || profile.plan === "founder_circle" || profile.plan === "hobbyist")
    : false;

  return <StoryScanView
    projectId={projectId}
    projectTitle={project.title}
    chapters={chapters ?? []}
    entities={entities ?? []}
    relationshipCount={relationships?.length ?? 0}
    threads={threads ?? []}
    observations={observations ?? []}
    showUpgradePrompt={showUpgradePrompt}
  />;
}
