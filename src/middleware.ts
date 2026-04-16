import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set(["/", "/sign-in", "/auth/callback", "/staff-clock"]);

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname) || pathname.startsWith("/api/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh the Supabase session (sets updated cookies)
  const { user, supabaseResponse } = await updateSession(request);

  // Authenticated user visiting sign-in or landing → redirect to dashboard
  if (user && (pathname === "/sign-in" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Unauthenticated user visiting protected route → redirect to sign-in
  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
