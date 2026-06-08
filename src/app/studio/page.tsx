import { redirect } from "next/navigation";
import { getUser, createServerSupabaseClient } from "@/lib/auth";

/**
 * /studio — redirects to the user's most recently updated project.
 * If no projects exist yet, sends the user to the dashboard to create one.
 */
export default async function StudioIndexPage() {
  const user = await getUser();
  if (!user) redirect("/auth");

  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (project) {
    redirect(`/studio/${project.id}`);
  }

  // No projects yet — go create one from the dashboard
  redirect("/dashboard");
}
