/**
 * Server-side rate limiting utilities.
 * All functions require the SERVICE-ROLE client — never call from the browser.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RateLimitResult } from "@/types/database";

/**
 * Atomically checks if the user is within their AI credit quota and
 * deducts the credit cost if they are.
 *
 * Uses a row-level FOR UPDATE lock inside a Postgres transaction so
 * concurrent requests from the same user cannot double-spend.
 *
 * @param userId  - The authenticated user's UUID
 * @param client  - Supabase service-role client (from createServiceClient())
 * @param credits - How many credits this operation costs (default 1)
 * @returns RateLimitResult — { allowed: true, remaining } or { allowed: false, reason }
 * @throws  If the DB call itself fails (network error, missing profile, etc.)
 */
export async function consumeAiRequest(
  userId: string,
  client: SupabaseClient,
  credits = 1
): Promise<RateLimitResult> {
  const { data, error } = await client.rpc("consume_ai_request", {
    p_user_id: userId,
    p_credits: credits,
  });

  if (error) {
    throw new Error(`Rate limit RPC failed: ${error.message}`);
  }

  return data as RateLimitResult;
}

/**
 * Convenience wrapper for API route handlers.
 * Returns `{ block, remaining }`.
 * - `block` is a 429 Response if the user is over their limit, otherwise null.
 * - `remaining` is the credits left after this call (0 when blocked, real value when allowed).
 *
 * Usage in an API route:
 *   const { block, remaining } = await checkRateLimit(userId, serviceClient, 2);
 *   if (block) return block;
 *   // ... proceed with AI call, then include `remaining` in the success response
 */
export async function checkRateLimit(
  userId: string,
  client: SupabaseClient,
  credits = 1
): Promise<{ block: Response | null; remaining: number }> {
  const result = await consumeAiRequest(userId, client, credits);

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
