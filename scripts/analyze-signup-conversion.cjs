/* eslint-disable no-console */
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase environment variables are required.");

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const DAY = 86_400_000;

function pct(value, total) {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

async function main() {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const cutoff = Date.now() - 30 * DAY;
  const recentUsers = users.filter((user) => new Date(user.created_at).getTime() >= cutoff);
  const recentIds = new Set(recentUsers.map((user) => user.id));

  const [{ data: profiles, error: profilesError }, { data: projects, error: projectsError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from("profiles").select("id,plan,is_lifetime,ai_requests_total,onboarding_done,onboarding_step,trial_ends_at"),
    supabase.from("projects").select("id,user_id,is_sample,created_at,updated_at,chapters(id,word_count,updated_at),entities(id),story_pulse_observations(id)"),
    supabase.from("orders").select("user_id,status,plan_purchased,created_at"),
  ]);
  if (profilesError) throw profilesError;
  if (projectsError) throw projectsError;
  if (ordersError) throw ordersError;

  const recentProfiles = (profiles ?? []).filter((profile) => recentIds.has(profile.id));
  const recentProjects = (projects ?? []).filter((project) => recentIds.has(project.user_id) && !project.is_sample);
  const projectUsers = new Set(recentProjects.map((project) => project.user_id));
  const textUsers = new Set(recentProjects.filter((project) => (project.chapters ?? []).some((chapter) => (chapter.word_count ?? 0) >= 100)).map((project) => project.user_id));
  const substantialUsers = new Set(recentProjects.filter((project) => (project.chapters ?? []).reduce((sum, chapter) => sum + (chapter.word_count ?? 0), 0) >= 1000).map((project) => project.user_id));
  const worldboardUsers = new Set(recentProjects.filter((project) => (project.entities ?? []).length > 0).map((project) => project.user_id));
  const pulseUsers = new Set(recentProjects.filter((project) => (project.story_pulse_observations ?? []).length > 0).map((project) => project.user_id));
  const aiUsers = new Set(recentProfiles.filter((profile) => (profile.ai_requests_total ?? 0) > 0).map((profile) => profile.id));
  const aiPowerUsers = new Set(recentProfiles.filter((profile) => (profile.ai_requests_total ?? 0) >= 10).map((profile) => profile.id));
  const paidUsers = new Set(recentProfiles.filter((profile) => profile.is_lifetime || profile.plan === "hobbyist" || profile.plan === "founder_circle").map((profile) => profile.id));
  const recentOrders = (orders ?? []).filter((order) => recentIds.has(order.user_id));
  const checkoutUsers = new Set(recentOrders.map((order) => order.user_id));
  const successfulOrderUsers = new Set(recentOrders.filter((order) => ["paid", "completed", "succeeded", "active"].includes(order.status)).map((order) => order.user_id));
  const orderStatuses = recentOrders.reduce((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
    return counts;
  }, {});

  const lastSignIn24h = recentUsers.filter((user) => user.last_sign_in_at && Date.now() - new Date(user.last_sign_in_at).getTime() < DAY).length;
  const returnEligible = recentUsers.filter((user) => Date.now() - new Date(user.created_at).getTime() >= DAY);
  const returnedAfter24h = returnEligible.filter((user) => user.last_sign_in_at && new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime() >= DAY).length;
  const total = recentUsers.length;

  console.log(JSON.stringify({
    window: "last_30_days",
    signups: total,
    signups_last_7_days: recentUsers.filter((user) => Date.now() - new Date(user.created_at).getTime() < 7 * DAY).length,
    signups_last_14_days: recentUsers.filter((user) => Date.now() - new Date(user.created_at).getTime() < 14 * DAY).length,
    signed_in_last_24h: lastSignIn24h,
    returned_after_24h: { users: returnedAfter24h, eligible_signups: returnEligible.length, rate: pct(returnedAfter24h, returnEligible.length) },
    created_real_project: { users: projectUsers.size, rate: pct(projectUsers.size, total) },
    added_100_words: { users: textUsers.size, rate: pct(textUsers.size, total) },
    reached_1000_words: { users: substantialUsers.size, rate: pct(substantialUsers.size, total) },
    used_any_ai_credit: { users: aiUsers.size, rate: pct(aiUsers.size, total) },
    used_10_ai_credits: { users: aiPowerUsers.size, rate: pct(aiPowerUsers.size, total) },
    populated_worldboard: { users: worldboardUsers.size, rate: pct(worldboardUsers.size, total) },
    populated_story_pulse: { users: pulseUsers.size, rate: pct(pulseUsers.size, total) },
    reached_checkout_order: { users: checkoutUsers.size, rate: pct(checkoutUsers.size, total), orders: recentOrders.length, statuses: orderStatuses },
    successful_order: { users: successfulOrderUsers.size, rate: pct(successfulOrderUsers.size, total) },
    paid_profile: { users: paidUsers.size, rate: pct(paidUsers.size, total) },
    onboarding_completed: { users: recentProfiles.filter((profile) => profile.onboarding_done).length, rate: pct(recentProfiles.filter((profile) => profile.onboarding_done).length, total) },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
