import { createBrowserClient } from "@supabase/ssr";

export type Plan = "free" | "hobbyist" | "scribe" | "pro" | "founder_circle";

export const TRIAL_DAYS = 14;
export const TRIAL_CREDITS = 100;

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
  referral_code: string;
  referred_by: string | null;
  bonus_credits: number;
  referral_count: number;
  welcome_email_sent: boolean;
  is_lifetime?: boolean;
  subscription_status?: string | null;
  dodo_subscription_id?: string | null;
}

/** Monthly credit limits per plan (post-trial). */
export const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  hobbyist: 300,
  scribe: 300,
  pro: 600,
  founder_circle: 600,
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  hobbyist: "Hobbyist",
  scribe: "Hobbyist",
  pro: "Pro",
  founder_circle: "Founder's Circle",
};

/** Credit costs per AI operation. */
export const CREDITS = {
  chat: 1,
  suggestShort: 1,
  suggestLong: 2,
  globalChange: 3,
  worldboardAuto: 4,
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

/** Get the monthly credit limit for a user. */
export function getCreditLimit(profile: {
  plan?: string | null;
  is_lifetime?: boolean | null;
  bonus_credits?: number | null;
}): number {
  // Founder's Circle / lifetime always get 600
  if (profile.is_lifetime || profile.plan === "founder_circle") {
    return 600 + (profile.bonus_credits ?? 0);
  }

  const base = PLAN_LIMITS[profile.plan ?? "free"] ?? 50;
  return base + (profile.bonus_credits ?? 0);
}

/**
 * Credits remaining.
 * - Trial users: (100 + bonus) - ai_requests_total
 * - Everyone else (including Founder's Circle): (plan limit + bonus) - this_month
 */
export function creditsRemaining(profile: Profile): number {
  const bonus = profile.bonus_credits ?? 0;

  if (isInTrial(profile)) {
    return Math.max(0, TRIAL_CREDITS + bonus - (profile.ai_requests_total ?? 0));
  }

  const limit = getCreditLimit(profile);
  return Math.max(0, limit - (profile.ai_requests_this_month ?? 0));
}

/** Total credit cap for display. */
export function creditsCap(profile: Profile): number {
  if (isInTrial(profile)) {
    return TRIAL_CREDITS + (profile.bonus_credits ?? 0);
  }
  return getCreditLimit(profile);
}

/**
 * Browser (client-side) Supabase client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabase = createClient();