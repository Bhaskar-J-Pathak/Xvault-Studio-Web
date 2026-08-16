import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getUser, createServerSupabaseClient } from "@/lib/auth";
import StudioShell from "./_components/studio-shell";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

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
    <StudioShell
      projectId={projectId}
      projectTitle={project.title}
      initialChapters={chapters ?? []}
    >
      {children}
    </StudioShell>
  );
}
