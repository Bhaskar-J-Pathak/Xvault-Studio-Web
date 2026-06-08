import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/auth";
import { isInTrial, trialDaysLeft, PLAN_LABELS, PLAN_LIMITS } from "@/lib/supabase";
import AccountSignOut from "./_components/account-sign-out";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/auth");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/auth");

  const inTrial   = isInTrial(profile);
  const daysLeft  = trialDaysLeft(profile);
  const planLabel = inTrial ? `Trial (${daysLeft}d left)` : PLAN_LABELS[profile.plan];
  const aiLimit   = PLAN_LIMITS[profile.plan];
  const aiUsed    = profile.ai_requests_this_month;
  const resetDate = new Date(profile.requests_reset_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight mb-8">Account</h1>

      {/* Profile */}
      <section className="bg-white rounded-2xl border border-black/[0.07] divide-y divide-black/[0.05]">
        <div className="px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1A1A1A]/35 mb-4">Profile</p>
          <Row label="Email" value={user.email ?? "—"} />
          <Row label="Plan" value={planLabel} highlight={inTrial} />
          {inTrial && profile.trial_ends_at && (
            <Row
              label="Trial ends"
              value={new Date(profile.trial_ends_at).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            />
          )}
        </div>

        {/* AI Usage */}
        <div className="px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1A1A1A]/35 mb-4">AI Usage</p>
          <Row
            label="Requests this month"
            value={inTrial ? `${aiUsed} (unlimited during trial)` : `${aiUsed} / ${aiLimit}`}
          />
          {!inTrial && (
            <div className="mt-3 mb-2">
              <div className="h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((aiUsed / aiLimit) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-[#1A1A1A]/35 mt-1.5">
                Resets {resetDate} · {Math.max(0, aiLimit - aiUsed)} remaining
              </p>
            </div>
          )}
          <Row label="Total AI requests" value={profile.ai_requests_total.toLocaleString()} />
        </div>

        {/* Sign out */}
        <div className="px-6 py-5">
          <AccountSignOut />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-[#1A1A1A]/50">{label}</span>
      <span className={`font-medium ${highlight ? "text-violet-600" : "text-[#1A1A1A]"}`}>
        {value}
      </span>
    </div>
  );
}
