import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Handles OAuth and magic-link callbacks from Supabase.
 * Supabase redirects here with a ?code= param after Google OAuth
 * or email confirmation. We exchange the code for a session,
 * then send the user to their destination.
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
      // Ensure `next` is a relative path so we can't be used as an open redirect
      const destination = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Something went wrong — send to auth with an error hint
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}
