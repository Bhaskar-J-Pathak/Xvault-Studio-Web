import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require the user to be signed in (page redirects to /auth)
const PROTECTED_PAGES = ["/studio", "/dashboard", "/account"];

// API routes that return 401 JSON instead of redirecting
const PROTECTED_API = ["/api/ai/", "/api/account/"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always refresh the session — keeps access tokens alive, writes updated
  // cookies back to the browser on every request. Required by @supabase/ssr.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Gate protected page routes → redirect to /auth
  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));
  if (isProtectedPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Gate protected API routes → return 401 JSON (no redirect for API calls)
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p));
  if (isProtectedApi && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Signed-in user hitting /auth → send to dashboard
  if (user && pathname === "/auth") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on every request except Next.js internals and static files.
     * This ensures session cookies are refreshed on every page load.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
