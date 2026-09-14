import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Crown } from "lucide-react";
import { getUser, getProfile } from "@/lib/auth";
import { isInTrial, trialDaysLeft, PLAN_LABELS, PLAN_LIMITS } from "@/lib/supabase";
import AccountSignOut from "./_components/account-sign-out";
import ReferralCard from "@/app/dashboard/_components/referral-card";

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
  const isFounder = profile.is_lifetime === true || profile.plan === "founder_circle";
  const resetDate = new Date(profile.requests_reset_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white/90">Account</h1>

      {/* Profile */}
      <section className="divide-y divide-black/[0.05] rounded-2xl border border-black/[0.07] bg-white dark:divide-white/[0.06] dark:border-white/[0.07] dark:bg-[#161329]">
        <div className="px-6 py-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#1A1A1A]/35 dark:text-white/35">Profile</p>
          <Row label="Email" value={user.email ?? "-"} />
          <Row label="Plan" value={planLabel} highlight={inTrial} />
          {inTrial && profile.trial_ends_at && (
            <Row
              label="Trial ends"
              value={new Date(profile.trial_ends_at).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            />
          )}

          {!isFounder && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-violet-200/70 bg-violet-50/70 px-4 py-3.5 dark:border-violet-500/20 dark:bg-violet-500/[0.08] sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-950 dark:text-violet-100">
                  <Crown size={13} />
                  {profile.plan === "hobbyist" ? "Want lifetime access?" : "Ready to keep writing?"}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-violet-900/55 dark:text-violet-200/55">
                  {profile.plan === "hobbyist"
                    ? "Compare your plan with the limited Founder's Circle offer."
                    : "Compare Hobbyist and Founder's Circle without leaving your account."}
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
              >
                View plans <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* AI Usage */}
        <div className="px-6 py-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#1A1A1A]/35 dark:text-white/35">AI Usage</p>
          <Row
            label="Requests this month"
            value={inTrial ? `${aiUsed} (unlimited during trial)` : `${aiUsed} / ${aiLimit}`}
          />
          {!inTrial && (
            <div className="mt-3 mb-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((aiUsed / aiLimit) * 100))}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#1A1A1A]/35 dark:text-white/35">
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

      {/* Referral */}
      {profile.referral_code && (
        <div className="mt-6">
          <ReferralCard
            referralCode={profile.referral_code}
            referralCount={profile.referral_count ?? 0}
            bonusCredits={profile.bonus_credits ?? 0}
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-[#1A1A1A]/50 dark:text-white/50">{label}</span>
      <span className={`text-right font-medium ${highlight ? "text-violet-600 dark:text-violet-400" : "text-[#1A1A1A] dark:text-white/85"}`}>
        {value}
      </span>
    </div>
  );
}
