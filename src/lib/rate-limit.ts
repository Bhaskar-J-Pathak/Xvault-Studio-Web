/**
 * Server-side rate limiting utilities.
 * All functions require the SERVICE-ROLE client — never call from the browser.
 *
 * Usage pattern (Option B — check then commit):
 *   1. checkRateLimit() before the AI call — validates quota, no deduction yet.
 *   2. commitRateLimit() after a successful AI response — deducts the credits.
 *
 * If the AI call fails, commitRateLimit is never called and no credits are lost.
 */

import { captureServerEvent, classifyAnalyticsError } from "@/lib/posthog-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RateLimitResult } from "@/types/database";

import { isContestEnabled } from "@/lib/contest";
export async function recordCreditFailure(
  userId: string,
  feature: string,
  credits: number,
  stage: string,
  error?: unknown,
  reason?: string
): Promise<void> {
  await captureServerEvent(userId, "credit_usage_failed", {
    feature,
    credits_requested: credits,
    failure_stage: stage,
    failure_category: reason || classifyAnalyticsError(error),
    outcome: "failure",
  });
}

/**
 * Read-only quota check. No credits are deducted.
 * Returns RateLimitResult — { allowed: true, remaining } or { allowed: false, reason }.
 */
export async function checkAiQuota(
  userId: string,
  client: SupabaseClient,
  credits = 1,
  projectId?: string
): Promise<RateLimitResult> {
  const params = {
    p_user_id: userId,
    p_credits: credits,
    ...(isContestEnabled() && projectId ? { p_project_id: projectId } : {}),
  };
  const { data, error } = await client.rpc("check_ai_quota", params);

  if (error) {
    throw new Error(`Quota check RPC failed: ${error.message}`);
  }

  return data as RateLimitResult;
}

/**
 * Deducts credits after a successful AI response.
 * Should only be called once the AI has returned a valid result.
 * Errors are logged but not re-thrown — the user already received their response.
 */
export async function commitAiRequest(
  userId: string,
  client: SupabaseClient,
  credits = 1,
  projectId?: string,
  feature = "unknown"
): Promise<void> {
  const params = {
    p_user_id: userId,
    p_credits: credits,
    ...(isContestEnabled() && projectId ? { p_project_id: projectId } : {}),
  };
  const { data, error } = await client.rpc("commit_ai_request", params);

  if (error) {
    await recordCreditFailure(userId, feature, credits, "credit_commit", error);
    console.error("[rate-limit] commit_ai_request failed (credits not deducted):", error.message);
    return;
  }

  const topupCreditsSpent = typeof data?.topup_spent === "number" ? data.topup_spent : 0;
  await captureServerEvent(userId, "credit_used", {
    feature,
    credits_charged: credits,
    included_credits_spent: Math.max(0, credits - topupCreditsSpent),
    topup_credits_spent: topupCreditsSpent,
    outcome: "success",
  });
}

/**
 * Convenience wrapper for API route handlers — quota check only.
 * Returns `{ block, remaining }`.
 * - `block` is a 429 Response if the user is over their limit, otherwise null.
 * - `remaining` is the credits left after this operation (based on the check).
 *
 * Call commitRateLimit() after a successful AI response to finalize the deduction.
 *
 * Usage:
 *   const { block, remaining } = await checkRateLimit(userId, serviceClient, 2);
 *   if (block) return block;
 *   const result = await aiCall();           // credits NOT yet deducted
 *   await commitRateLimit(userId, serviceClient, 2); // deduct now that it worked
 *   return Response.json({ result, remaining });
 */
export async function checkRateLimit(
  userId: string,
  client: SupabaseClient,
  credits = 1,
  projectId?: string,
  feature = "unknown"
): Promise<{ block: Response | null; remaining: number }> {
  let result: RateLimitResult;
  try {
    result = await checkAiQuota(userId, client, credits, projectId);
  } catch (error) {
    await recordCreditFailure(userId, feature, credits, "quota_check", error);
    throw error;
  }

  if (!result.allowed) {
    await recordCreditFailure(userId, feature, credits, "quota_denied", undefined, result.reason);
    const message = result.reason === "contest_limit"
      ? "You've used all the AI credits reserved for your contest manuscript. Your normal Xvault allowance is still available in your other projects."
      : result.reason === "trial_limit"
        ? "You've used all 100 trial credits. Upgrade to keep writing."
        : "Monthly AI credit limit reached. Upgrade your plan for more.";
    return {
      block: Response.json(
        { error: message, reason: result.reason, remaining: result.remaining },
        { status: 429 }
      ),
      remaining: result.remaining,
    };
  }

  return { block: null, remaining: result.remaining };
}

/**
 * Convenience wrapper to commit credits after a successful AI call.
 * Errors are swallowed and logged — never fails the request.
 */
export async function commitRateLimit(
  userId: string,
  client: SupabaseClient,
  credits = 1,
  projectId?: string,
  feature = "unknown"
): Promise<void> {
  await commitAiRequest(userId, client, credits, projectId, feature);
}
