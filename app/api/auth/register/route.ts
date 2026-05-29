import { NextRequest, NextResponse } from "next/server";
import { setupNewUser } from "@/lib/supabase/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId, email, fullName, companyName } = await req.json();

    if (!userId || !email || !fullName || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await setupNewUser({ userId, email, fullName, companyName });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to set up user account" },
        { status: 500 },
      );
    }

    return NextResponse.json({ companyId: result.companyId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
