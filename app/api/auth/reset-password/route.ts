import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const token = req.cookies.get("reset_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Reset session expired. Please request a new link." },
        { status: 401 },
      );
    }

    // Validate token presence
    if (!token) {
      return NextResponse.json(
        { error: "Reset token is missing. Please request a new link." },
        { status: 400 },
      );
    }

    // Step 1 — Verify JWT token
    const secret = new TextEncoder().encode(
      process.env.OTP_SECRET ?? "fallback-secret",
    );

    let payload: {
      userId: string;
      email: string;
      purpose: string;
    };

    try {
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded as typeof payload;
    } catch (err) {
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 401 },
      );
    }

    // Step 2 — Confirm purpose is password-reset
    if (payload.purpose !== "password-reset") {
      return NextResponse.json(
        { error: "Invalid reset token." },
        { status: 401 },
      );
    }

    // Step 3 — Update password via admin
    const admin = createSupabaseAdminClient();

    const { error: updateError } = await admin.auth.admin.updateUserById(
      payload.userId,
      { password },
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 },
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("reset_token", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
    return response;
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
