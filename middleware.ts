import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Public routes — always accessible
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/terms",
    "/privacy",
    "/plans",
    "/welcome",
  ];

  const isPublic =
    publicRoutes.some((r) => pathname === r || pathname.startsWith("/auth/")) ||
    (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin"));

  // Not logged in → redirect to login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in → redirect away from auth pages
  if (user && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Admin route protection ──────────────────────────────────
  // Think of this as the mall management office security guard
  // Only superadmin badge holders get through
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: adminProfile, error: adminErr } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (adminProfile?.role !== "superadmin") {
      // Logged in but not superadmin → back to their dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ── Admin API route protection ──────────────────────────────
  // Protects /api/admin/* endpoints too
  if (pathname.startsWith("/api/admin")) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  // ── Deactivated account check ───────────────────────────────
  // Like a revoked badge — even if you still have it in your pocket,
  // the door scanner won't let you in anymore
  if (user && pathname.startsWith("/dashboard")) {
    const { data: activeCheck } = await supabase
      .from("users")
      .select("is_active")
      .eq("id", user.id)
      .single();

    if (activeCheck?.is_active === false) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL("/login?deactivated=true", request.url),
      );
    }
  }

  // Block pending_payment users from dashboard (except billing)
  const isProtectedFromUnpaid =
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/dashboard/billing");

  if (user && isProtectedFromUnpaid) {
    const { data: userRow } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (userRow?.company_id) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("company_id", userRow.company_id)
        .single();

      if (sub?.status === "pending_payment") {
        return NextResponse.redirect(
          new URL("/dashboard/billing?mustPay=true", request.url),
        );
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
