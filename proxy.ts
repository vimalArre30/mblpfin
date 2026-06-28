import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getUserPlan, isOnboarded } from "@/lib/tracker/plan";

/**
 * Next.js 16 edge proxy (replaces middleware.ts) for all /tracker/* routes.
 *
 * 1. Unauthenticated user → /tracker/login
 * 2. Authenticated on login page → /tracker/dashboard
 * 3. Authenticated, not yet onboarded, not already on onboarding → /tracker/onboarding
 */
export async function proxy(request: NextRequest) {
  // Start with a passthrough response so cookies can be mutated
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage      = pathname.startsWith("/tracker/login");
  const isOnboardingPage = pathname === "/tracker/onboarding";

  // 1. Unauthenticated → send to login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/tracker/login";
    return NextResponse.redirect(url);
  }

  // 2. Authenticated + on login page → send to dashboard
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/tracker/dashboard";
    return NextResponse.redirect(url);
  }

  // 3. Authenticated + NOT on login/onboarding → gate on onboarding completion
  if (user && !isLoginPage && !isOnboardingPage) {
    const profile = await getUserPlan(supabase, user.id);
    if (!isOnboarded(profile)) {
      const url = request.nextUrl.clone();
      url.pathname = "/tracker/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/tracker", "/tracker/:path*"],
};
