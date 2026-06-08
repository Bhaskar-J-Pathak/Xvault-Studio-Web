import { notFound, redirect } from "next/navigation";
import { getUser, createServerSupabaseClient } from "@/lib/auth";
import StudioSidebar from "./_components/studio-sidebar";

export default async function StudioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const user = await getUser();
  if (!user) redirect("/auth");

  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, word_count, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <StudioSidebar
        projectId={projectId}
        projectTitle={project.title}
        initialChapters={chapters ?? []}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
