import { notFound, redirect } from "next/navigation";
import { getUser, getProfile, createServerSupabaseClient } from "@/lib/auth";
import { creditsRemaining, isInTrial } from "@/lib/supabase";
import ZenEditor from "./_components/zen-editor";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ projectId: string; chapterId: string }>;
}) {
  const { projectId, chapterId } = await params;

  const user = await getUser();
  if (!user) redirect("/auth");

  const supabase = await createServerSupabaseClient();

  const [profile, { data: chapter }, { data: coauthor }] = await Promise.all([
    getProfile(user.id),
    supabase
      .from("chapters")
      .select("id, title, content, word_count, project_id, position, last_extracted_word, last_embedded_word, summary")
      .eq("id", chapterId)
      .eq("project_id", projectId)
      .single(),
    supabase
      .from("coauthors")
      .select("id, project_id, name, personality, created_at, updated_at")
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);

  if (!chapter) notFound();

  const initialCredits = profile ? creditsRemaining(profile as Parameters<typeof creditsRemaining>[0]) : 0;
  const isTrial        = profile ? isInTrial(profile as Parameters<typeof isInTrial>[0]) : false;
  const onboardingStep = profile?.onboarding_step ?? 9;
  const onboardingDone = profile?.onboarding_done ?? true;

  return (
    <ZenEditor
      key={chapterId}
      chapterId={chapterId}
      chapterTitle={chapter.title}
      initialContent={chapter.content as Record<string, unknown> | null}
      initialWordCount={chapter.word_count}
      projectId={projectId}
      chapterNumber={(chapter.position ?? 0) + 1}
      initialLastExtracted={chapter.last_extracted_word ?? 0}
      initialLastEmbedded={chapter.last_embedded_word ?? 0}
      initialSummary={(chapter.summary as string | null) ?? null}
      initialCoauthor={coauthor ?? null}
      initialCredits={initialCredits}
      isTrial={isTrial}
      onboardingStep={onboardingStep}
      onboardingDone={onboardingDone}
    />
  );
}
