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

    // Step 7 — Sign in user so session cookie is set
    // We use admin to create a session
    // const { data: sessionData, error: sessionError } =
    //   await admin.auth.admin.createSession({
    //     user_id: payload.userId,
    //   } as any);

    // Step 8 — Clear OTP cookie + return success
    // Step 8 — Clear OTP cookie + return success
    const { isPaidPlan } = await import("@/lib/plans");
    const resolvedPlan = payload.planTier ?? plan ?? "free";
    const requiresPayment = isPaidPlan(resolvedPlan as any);

    const response = NextResponse.json({
      success: true,
      planTier: resolvedPlan,
      requiresPayment, // ← frontend reads this
    });

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
