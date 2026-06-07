import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { setupNewUser } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const plan = searchParams.get("plan") ?? "free";
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const user = data.user;
  const isGoogleOAuth = user.app_metadata?.provider === "google";

  // Check if user already completed onboarding
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, company_id")
    .eq("id", user.id)
    .single();

  // Already fully onboarded → dashboard
  if (existingUser?.company_id) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Google OAuth → still needs company name → onboarding
  if (isGoogleOAuth) {
    return NextResponse.redirect(`${origin}/onboarding?plan=${plan}`);
  }

  // Email user → has all data in metadata → setup automatically
  const fullName =
    user.user_metadata?.full_name || user.user_metadata?.name || "Unknown";

  const companyName = user.user_metadata?.company_name;

  if (!companyName) {
    // Metadata missing → fallback to onboarding
    return NextResponse.redirect(`${origin}/onboarding?plan=${plan}`);
  }

  const result = await setupNewUser({
    userId: user.id,
    email: user.email!,
    fullName,
    companyName,
    planTier: plan,
  });

  if (!result) {
    return NextResponse.redirect(`${origin}/login?error=setup_failed`);
  }

  // Paid plan → go to billing to complete payment
  const { isPaidPlan } = await import("@/lib/plans");

  // Paid plan → must pay before dashboard
  if (isPaidPlan(plan as any)) {
    return NextResponse.redirect(`${origin}/welcome?plan=${plan}&mustPay=true`);
  }

  // Free → straight to welcome
  return NextResponse.redirect(`${origin}/welcome?plan=${plan}`);
}
