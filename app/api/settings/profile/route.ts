import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    // 1. Get current session to identify the user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the update payload
    const { fullName, companyName } = await req.json();

    if (!fullName?.trim() || !companyName?.trim()) {
      return NextResponse.json(
        { error: "Full name and company name are required" },
        { status: 400 },
      );
    }

    // 3. Update user_metadata via admin client (same pattern as signup)
    const admin = createSupabaseAdminClient();
    const { data: updatedUser, error: updateError } =
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata, // preserve any other metadata
          full_name: fullName.trim(),
          company_name: companyName.trim(),
        },
      });

    if (updateError) {
      console.error("Update user error:", updateError);
      return NextResponse.json(
        { error: updateError.message ?? "Failed to update profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        fullName: updatedUser.user.user_metadata.full_name,
        companyName: updatedUser.user.user_metadata.company_name,
        email: updatedUser.user.email,
      },
    });
  } catch (err: any) {
    console.error("Settings PATCH error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
