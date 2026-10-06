import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/auth";
import { sendSignupNotificationOnce, sendWelcomeEmailOnce } from "@/lib/signup-notification";

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

  if (code) {
    const cookieStore = await cookies();
    const cookieNext = cookieStore.get("xv_auth_next")?.value;
    const requestedNext = searchParams.get("next") ?? (cookieNext ? decodeURIComponent(cookieNext) : "/dashboard");

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

          await Promise.all([
            sendWelcomeEmailOnce({
              id: user.id,
              email: user.email,
              name: typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : typeof user.user_metadata?.name === "string"
                  ? user.user_metadata.name
                  : null,
            }).catch((e) =>
              console.error("[callback] welcome email failed:", e)
            ),
            sendSignupNotificationOnce({
              id: user.id,
              email: user.email,
              createdAt: user.created_at,
              provider: typeof user.app_metadata?.provider === "string"
                ? user.app_metadata.provider
                : "email",
            }).catch((e) =>
              console.error("[callback] signup notification failed:", e)
            ),
          ]);
        }
      } catch (e) {
        // Email errors must never block the redirect
        console.error("[callback] welcome email check failed:", e);
      }
      // ─────────────────────────────────────────────────────────────────────

      const destination = requestedNext.startsWith("/") ? requestedNext : "/dashboard";
      const response = NextResponse.redirect(`${origin}${destination}`);
      response.cookies.delete("xv_auth_next");
      return response;
    }

    console.error("[callback] OAuth code exchange failed:", error.message);
  }

  // Something went wrong — send to auth with an error the user can act on.
  // The underlying error is intentionally logged only on the server: OAuth
  // exchange errors may include provider-specific implementation details.
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}
