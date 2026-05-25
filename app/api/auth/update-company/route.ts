import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { companyName } = await req.json();
    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: "Company name required" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Get user's company_id
    const { data: userData } = await admin
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update company name
    await admin
      .from("companies")
      .update({ name: companyName.trim() })
      .eq("id", userData.company_id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
