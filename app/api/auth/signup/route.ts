import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getVerificationEmailContent } from "@/lib/email/verification";
import { type PlanTier } from "@/lib/plans";
import { SignJWT } from "jose";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, companyName, planTier } =
      await req.json();

    // Validate
    if (!email || !password || !fullName || !companyName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient(); // Step 1 — Verify OTP_SECRET exists first
    const otpSecret = process.env.OTP_SECRET;
    if (!otpSecret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Step 2 — Generate OTP and JWT before creating user
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const secret = new TextEncoder().encode(otpSecret);
    const token = await new SignJWT({
      email: email.trim().toLowerCase(),
      otp: otpCode,
      planTier: "trial",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m")
      .sign(secret);

    // Step 3 — Send email FIRST before creating user
    const { subject, html } = getVerificationEmailContent(
      "free",
      otpCode,
      fullName.trim(),
    );
    const { error: emailError } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to:
        process.env.NODE_ENV === "production"
          ? email.trim().toLowerCase()
          : "waleedai8191@gmail.com",
      subject,
      html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 },
      );
    }

    // Step 4 — ONLY create user after email confirmed sent
    const { data: newUser, error: createError } =
      await admin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: false,
        user_metadata: {
          full_name: fullName.trim(),
          company_name: companyName.trim(),
        },
      });

    if (createError || !newUser?.user) {
      console.error("Create user error:", createError);
      return NextResponse.json(
        { error: createError?.message ?? "Failed to create account" },
        { status: 500 },
      );
    }

    // Step 5 — Update JWT with real userId now that user exists
    const finalToken = await new SignJWT({
      email: email.trim().toLowerCase(),
      otp: otpCode,
      userId: newUser.user.id,
      planTier: planTier ?? "free",
      password,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m")
      .sign(secret);

    // Step 6 — Set cookie with final token
    const response = NextResponse.json({ success: true });
    response.cookies.set("otp_token", finalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Signup route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
