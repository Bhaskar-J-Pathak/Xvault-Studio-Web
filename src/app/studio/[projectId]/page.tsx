import { redirect } from "next/navigation";
import { getUser, createServerSupabaseClient } from "@/lib/auth";

export default async function StudioProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const user = await getUser();
  if (!user) redirect("/auth");

  const supabase = await createServerSupabaseClient();

  // Get existing chapters ordered by position
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (chapters && chapters.length > 0) {
    redirect(`/studio/${projectId}/${chapters[0].id}`);
  }

  // No chapters yet — create the first one
  const { data: newChapter } = await supabase
    .from("chapters")
    .insert({ project_id: projectId, title: "Chapter 1", position: 0 })
    .select("id")
    .single();

  if (!newChapter) redirect("/dashboard");

  redirect(`/studio/${projectId}/${newChapter.id}`);
}
