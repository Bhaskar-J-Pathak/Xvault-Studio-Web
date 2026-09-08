import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient, getUser } from "@/lib/auth";
import StoryPulseView from "./story-pulse-view";

export const dynamic = "force-dynamic";

export default async function StoryPulsePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await getUser();
  if (!user) redirect("/auth");
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase.from("projects").select("id, title")
    .eq("id", projectId).eq("user_id", user.id).single();
  if (!project) notFound();

  const [{ data: chapters }, { data: observations, error: observationsError }] = await Promise.all([
    supabase.from("chapters").select("id, title, position, word_count")
      .eq("project_id", projectId).order("position"),
    supabase.from("story_pulse_observations").select("id, chapter_id, character_name, emotional_state, desire, fear, change_summary, evidence_quote, continuity_note, severity, confidence")
      .eq("project_id", projectId).order("created_at"),
  ]);

  return <StoryPulseView
    projectId={projectId}
    chapters={chapters ?? []}
    initialObservations={observations ?? []}
    setupRequired={Boolean(observationsError)}
  />;
}
