import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { CONTEST_CREDITS, CONTEST_ENDS_AT } from "@/lib/supabase";
import { isContestEnabled } from "@/lib/contest";

const CONTEST_SLUG = "xvault-10k-2026";

export async function POST() {
  if (!isContestEnabled()) {
    return Response.json({ error: "Challenge registration is not currently open." }, { status: 404 });
  }

  if (new Date() > new Date(CONTEST_ENDS_AT)) {
    return Response.json({ error: "The September 2026 challenge is closed." }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  await service.from("profiles").upsert({
    id: user.id,
    email: user.email ?? "",
    plan: "free",
    trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    referral_code: crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase(),
  }, { onConflict: "id", ignoreDuplicates: true });

  const { data: profile, error: profileError } = await service.from("profiles")
    .select("contest_slug, contest_project_id, contest_credits_remaining, contest_ends_at")
    .eq("id", user.id).single();
  if (profileError) return Response.json({ error: profileError.message }, { status: 500 });
  if (profile.contest_slug === CONTEST_SLUG && profile.contest_project_id) {
    return Response.json({ projectId: profile.contest_project_id, alreadyEnrolled: true });
  }

  const { data: project, error: projectError } = await service.from("projects").insert({
    user_id: user.id,
    title: "Xvault 10K Story Challenge",
    synopsis: "My entry for the Xvault 10K Story Challenge.",
    writing_status: "drafting",
  }).select("id").single();
  if (projectError || !project) {
    return Response.json({ error: projectError?.message ?? "Could not create your contest manuscript." }, { status: 500 });
  }

  const { error: chapterError } = await service.from("chapters").insert({
    project_id: project.id, title: "Chapter 1", position: 0,
  });
  if (chapterError) {
    await service.from("projects").delete().eq("id", project.id);
    return Response.json({ error: chapterError.message }, { status: 500 });
  }

  // Recreating a deleted contest manuscript must not reset the allowance.
  const enrollment = profile.contest_slug === CONTEST_SLUG
    ? { contest_project_id: project.id }
    : {
        contest_slug: CONTEST_SLUG,
        contest_credits_remaining: CONTEST_CREDITS,
        contest_ends_at: CONTEST_ENDS_AT,
        contest_project_id: project.id,
      };
  const { error: enrollError } = await service.from("profiles").update(enrollment).eq("id", user.id);
  if (enrollError) {
    await service.from("projects").delete().eq("id", project.id);
    return Response.json({ error: enrollError.message }, { status: 500 });
  }
  return Response.json({ projectId: project.id, alreadyEnrolled: false });
}
