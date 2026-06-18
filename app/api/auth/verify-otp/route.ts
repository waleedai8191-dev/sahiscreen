import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { setupNewUser } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
  try {
    const { otp, plan } = await req.json();

    if (!otp || otp.length !== 4) {
      return NextResponse.json(
        { error: "Please enter a valid 4-digit code" },
        { status: 400 },
      );
    }

    // Step 1 — Read JWT from cookie
    const token = req.cookies.get("otp_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Verification session expired. Please sign up again." },
        { status: 401 },
      );
    }

    // Step 2 — Verify and decode JWT
    const secret = new TextEncoder().encode(
      process.env.OTP_SECRET ?? "fallback-secret",
    );

    let payload: {
      email: string;
      otp: string;
      userId: string;
      planTier: string;
      password: string;
    };

    try {
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded as typeof payload;
    } catch (err) {
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 401 },
      );
    }

    // Step 3 — Compare OTP
    if (payload.otp !== otp) {
      return NextResponse.json(
        { error: "Incorrect code. Please try again." },
        { status: 400 },
      );
    }

    // Step 4 — Mark email as confirmed in Supabase
    const admin = createSupabaseAdminClient();

    const { error: confirmError } = await admin.auth.admin.updateUserById(
      payload.userId,
      { email_confirm: true },
    );

    if (confirmError) {
      console.error("Confirm error:", confirmError);
      return NextResponse.json(
        { error: "Failed to verify account. Please try again." },
        { status: 500 },
      );
    }

    // Step 5 — Get user metadata
    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(payload.userId);

    if (userError || !userData?.user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const fullName = userData.user.user_metadata?.full_name ?? "Unknown";
    const companyName = userData.user.user_metadata?.company_name;

    if (!companyName) {
      return NextResponse.json(
        { error: "Company info missing. Please sign up again." },
        { status: 400 },
      );
    }

    // Step 6 — Setup company + subscription
    const result = await setupNewUser({
      userId: payload.userId,
      email: payload.email,
      fullName,
      companyName,
      planTier: payload.planTier ?? plan ?? "free",
    });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to set up your account. Please contact support." },
        { status: 500 },
      );
    }
    // Step 7 — Create session using magic link token
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: payload.email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Generate link error:", linkError);
      return NextResponse.json(
        {
          error: "Account verified but sign-in failed. Please log in manually.",
        },
        { status: 500 },
      );
    }

    // Exchange the hashed token for a real session
    const { data: sessionData, error: sessionError } =
      await admin.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
      });

    if (sessionError || !sessionData?.session) {
      console.error("Session exchange error:", sessionError);
      return NextResponse.json(
        {
          error: "Account verified but sign-in failed. Please log in manually.",
        },
        { status: 500 },
      );
    }
    // Step 7+8 — Build response, sign user in via SSR client so cookies are set
    const { isPaidPlan } = await import("@/lib/plans");
    const resolvedPlan = payload.planTier ?? plan ?? "free";
    const requiresPayment = isPaidPlan(resolvedPlan as any);

    const response = NextResponse.json({
      success: true,
      planTier: resolvedPlan,
      requiresPayment,
    });

    // SSR client writes session cookies directly into the response
    const { createServerClient } = await import("@supabase/ssr");
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options); // ← writes into response
            });
          },
        },
      },
    );

    const { error: signInError } = await supabaseSSR.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (signInError) {
      console.error("Auto sign-in error:", signInError);
      // Don't block — user is verified, they can log in manually
    }

    // Clear OTP cookie
    response.cookies.set("otp_token", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
