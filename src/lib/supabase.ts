import { createBrowserClient } from "@supabase/ssr";

export type Plan = "free" | "scribe" | "pro";

export const TRIAL_DAYS    = 14;
export const TRIAL_CREDITS = 100; // total credits for the 14-day trial

export interface Profile {
  id: string;
  email: string;
  plan: Plan;
  ai_requests_this_month: number;
  ai_requests_total: number;
  requests_reset_at: string;
  trial_ends_at: string | null;
  onboarding_step: number;
  onboarding_done: boolean;
  updated_at: string;
}

/** Monthly credit limits per plan (post-trial). */
export const PLAN_LIMITS: Record<Plan, number> = {
  free:   15,
  scribe: 300,
  pro:    1200,
};

export const PLAN_LABELS: Record<Plan, string> = {
  free:   "Free",
  scribe: "Scribe",
  pro:    "Pro",
};

/** Credit costs per AI operation. Keep in sync with migration 004 RPC defaults. */
export const CREDITS = {
  chat:             1,
  suggestShort:     1,
  suggestLong:      2,
  globalChange:     3,
  worldboardAuto:   4,
  worldboardManual: 10,
} as const;

/** User is in trial if trial_ends_at exists and hasn't passed. */
export function isInTrial(profile: Profile): boolean {
  if (!profile.trial_ends_at) return false;
  return new Date(profile.trial_ends_at) > new Date();
}

/** Days remaining in trial (0 if expired or no trial). */
export function trialDaysLeft(profile: Profile): number {
  if (!profile.trial_ends_at) return 0;
  const ms = new Date(profile.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Credits remaining. For trial users: 100 - ai_requests_total. For others: plan limit - this_month. */
export function creditsRemaining(profile: Profile): number {
  if (isInTrial(profile)) {
    return Math.max(0, TRIAL_CREDITS - profile.ai_requests_total);
  }
  return Math.max(0, PLAN_LIMITS[profile.plan] - profile.ai_requests_this_month);
}

/**
 * Browser (client-side) Supabase client.
 * Uses the Publishable key (sb_publishable_...) — safe to expose in the browser.
 * Subject to Row Level Security.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // Publishable key
  );
}

export const supabase = createClient();
