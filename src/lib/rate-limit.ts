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

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RateLimitResult } from "@/types/database";

/**
 * Read-only quota check. No credits are deducted.
 * Returns RateLimitResult — { allowed: true, remaining } or { allowed: false, reason }.
 */
export async function checkAiQuota(
  userId: string,
  client: SupabaseClient,
  credits = 1
): Promise<RateLimitResult> {
  const { data, error } = await client.rpc("check_ai_quota", {
    p_user_id: userId,
    p_credits: credits,
  });

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
  credits = 1
): Promise<void> {
  const { error } = await client.rpc("commit_ai_request", {
    p_user_id: userId,
    p_credits: credits,
  });

  if (error) {
    console.error("[rate-limit] commit_ai_request failed (credits not deducted):", error.message);
  }
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
  credits = 1
): Promise<{ block: Response | null; remaining: number }> {
  const result = await checkAiQuota(userId, client, credits);

  if (!result.allowed) {
    const message =
      result.reason === "trial_limit"
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
  credits = 1
): Promise<void> {
  await commitAiRequest(userId, client, credits);
}
