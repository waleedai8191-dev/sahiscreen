import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { setupNewUser } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = await createSupabaseAdminClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const user = data.user;

  // Check if user row already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingUser) {
    const fullName =
      user.user_metadata?.full_name || user.user_metadata?.name || "Unknown";

    // For Google OAuth — company name is unknown
    // Store a temporary placeholder and redirect to onboarding
    const isGoogleOAuth = user.app_metadata?.provider === "google";
    const companyName = isGoogleOAuth
      ? "__PENDING__"
      : user.user_metadata?.company_name || "My Company";

    await setupNewUser({
      userId: user.id,
      email: user.email!,
      fullName,
      companyName,
    });

    // Google users must complete onboarding
    if (isGoogleOAuth) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
