import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SignJWT } from "jose";
import { getResetPasswordEmailContent } from "@/lib/email/reset-password";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Step 1 — Check user exists
    const { data: users } = await admin.auth.admin.listUsers();
    const user = users?.users?.find(
      (u) => u.email === email.trim().toLowerCase(),
    );

    // Always return success even if user not found (security best practice)
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Step 2 — Generate reset token (JWT)
    const secret = new TextEncoder().encode(
      process.env.OTP_SECRET ?? "fallback-secret",
    );

    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      purpose: "password-reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("15m")
      .sign(secret);

    // Step 3 — Build reset URL with token
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${origin}/reset-password`;

    // Step 4 — Send branded email via Resend
    const fullName = user.user_metadata?.full_name ?? "there";
    const { subject, html } = getResetPasswordEmailContent(fullName, resetUrl);

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
        { error: "Failed to send reset email. Please try again." },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("reset_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });
    return response;
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
