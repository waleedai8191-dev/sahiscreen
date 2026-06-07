import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SignJWT, jwtVerify } from "jose";
import { getVerificationEmailContent } from "@/lib/email/verification";
import { type PlanTier } from "@/lib/plans";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, plan } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const secret = new TextEncoder().encode(
      process.env.OTP_SECRET ?? "fallback-secret",
    );

    // Step 1 — Read existing JWT to get userId
    const existingToken = req.cookies.get("otp_token")?.value;
    let userId: string | null = null;
    let planTier = plan ?? "free";

    if (existingToken) {
      try {
        const { payload } = await jwtVerify(existingToken, secret);
        userId = payload.userId as string;
        planTier = (payload.planTier as string) ?? plan ?? "free";
      } catch {
        // Token expired — find user by email
      }
    }

    // Step 2 — If no userId from token, find user by email
    if (!userId) {
      const admin = createSupabaseAdminClient();
      const { data: users } = await admin.auth.admin.listUsers();
      const user = users?.users?.find(
        (u) => u.email === email.trim().toLowerCase(),
      );

      if (!user) {
        return NextResponse.json(
          { error: "Account not found. Please sign up again." },
          { status: 404 },
        );
      }

      userId = user.id;
      planTier = user.user_metadata?.plan_tier ?? plan ?? "free";
    }

    // Step 3 — Generate new 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Step 4 — Sign new JWT
    const token = await new SignJWT({
      email: email.trim().toLowerCase(),
      otp: otpCode,
      userId,
      planTier,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m")
      .sign(secret);

    // Step 5 — Get user's full name for email
    const admin = createSupabaseAdminClient();
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const fullName = userData?.user?.user_metadata?.full_name ?? "there";

    // Step 6 — Send new OTP email
    const { subject, html } = getVerificationEmailContent(
      planTier as PlanTier,
      otpCode,
      fullName,
    );

    const { error: emailError } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email.trim().toLowerCase(),
      subject,
      html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { error: "Failed to send code. Please try again." },
        { status: 500 },
      );
    }

    // Step 7 — Set new JWT cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("otp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Resend OTP error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
