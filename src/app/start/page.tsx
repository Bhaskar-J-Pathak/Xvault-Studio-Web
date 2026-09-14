import { redirect } from "next/navigation";
import { getUser, createServerSupabaseClient, createServiceClient } from "@/lib/auth";

/**
 * /start — smart post-auth redirect.
 *
 * New users (0 projects):  go to the dashboard's choice screen so they can
 *                          import real work or deliberately start blank.
 * Returning users (≥1):    go to the dashboard.
 */
export default async function StartPage() {
  const user = await getUser();
  if (!user) redirect("/auth");

  const supabase = await createServerSupabaseClient();

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) > 0) {
    redirect("/dashboard");
  }

  // New user — ensure the profile exists, then let them choose their path.
  // Dropping someone into an empty "Untitled" editor hides Xvault's strongest
  // value (working with an existing manuscript) and gives them no clear win.
  const service = createServiceClient();
  await service.from("profiles").upsert(
    {
      id:             user.id,
      email:          user.email ?? "",
      plan:           "free",
      trial_ends_at:  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      referral_code:  Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 36).toString(36)
      ).join("").toUpperCase(),
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  redirect("/dashboard?welcome=1");
}
