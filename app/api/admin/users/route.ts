import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();

    const { data: users, error } = await admin
      .from("users")
      .select(
        "id, full_name, email, role, designation, is_active, company_id, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("users fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }

    const companyIds = [
      ...new Set((users ?? []).map((u) => u.company_id).filter(Boolean)),
    ];

    const { data: companies } =
      companyIds.length > 0
        ? await admin
            .from("companies")
            .select("id, name")
            .in("id", companyIds as string[])
        : { data: [] };

    const companyMap = new Map((companies ?? []).map((c) => [c.id, c.name]));

    const result = (users ?? []).map((u) => ({
      ...u,
      company_name: u.company_id
        ? (companyMap.get(u.company_id) ?? "Unknown")
        : "—",
    }));

    return NextResponse.json({ users: result });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
