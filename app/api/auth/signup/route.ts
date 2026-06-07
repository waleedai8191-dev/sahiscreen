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

    const admin = createSupabaseAdminClient();

    // Step 1 — Check if email already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
      (u) => u.email === email.trim().toLowerCase(),
    );

    if (alreadyExists) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 },
      );
    }

    // Step 2 — Create user in Supabase (no email sent by Supabase)
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
    // Step 3 — Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Step 4 — Sign OTP into JWT (no DB needed)
    const secret = new TextEncoder().encode(
      process.env.OTP_SECRET ?? "fallback-secret",
    );

    const token = await new SignJWT({
      email: email.trim().toLowerCase(),
      otp: otpCode,
      userId: newUser.user.id,
      planTier: planTier ?? "free",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("10m")
      .sign(secret);
    // Step 5 — Send branded email with OTP via Resend
    const { subject, html } = getVerificationEmailContent(
      (planTier ?? "free") as PlanTier,
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
        { error: "Account created but email failed. Please try again." },
        { status: 500 },
      );
    }

    // Step 6 — Set JWT as httpOnly cookie
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
    console.error("Signup route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
