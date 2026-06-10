import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * Handles OAuth and magic-link callbacks from Supabase.
 * Supabase redirects here with a ?code= param after Google OAuth
 * or email confirmation. We exchange the code for a session,
 * then send the user to their destination.
 *
 * Welcome email fires here — exactly once per new account.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ── Welcome email — fires once per new account ────────────────────────
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user?.email) {
          const service = createServiceClient();

          // Ensure profile row exists (guard against trigger failure)
          await service.from("profiles").upsert(
            {
              id: user.id,
              email: user.email,
              plan: "free",
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              referral_code: Array.from({ length: 8 }, () =>
                Math.floor(Math.random() * 36).toString(36)
              ).join("").toUpperCase(),
              welcome_email_sent: false,
            },
            { onConflict: "id", ignoreDuplicates: true }
          );

          // Atomically mark email as sent — only succeeds if it hasn't been sent yet.
          // If the update touches 0 rows (already true), skip the send.
          const { data: updated } = await service
            .from("profiles")
            .update({ welcome_email_sent: true })
            .eq("id", user.id)
            .eq("welcome_email_sent", false)
            .select("id");

          if (updated && updated.length > 0) {
            sendWelcomeEmail(user.email).catch((e) =>
              console.error("[callback] welcome email failed:", e)
            );
          }
        }
      } catch (e) {
        // Email errors must never block the redirect
        console.error("[callback] welcome email check failed:", e);
      }
      // ─────────────────────────────────────────────────────────────────────

      const destination = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Something went wrong — send to auth with an error hint
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}
