import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") ?? "cvs";

    const { data: companies } = await admin
      .from("companies")
      .select("id, name");
    const companyMap = new Map((companies ?? []).map((c) => [c.id, c.name]));

    if (tab === "cvs") {
      const { data, error } = await admin
        .from("cv_uploads")
        .select(
          "id, company_id, job_id, original_filename, candidate_name, candidate_email, file_size_kb, extraction_status, screening_status, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      return NextResponse.json({
        data: (data ?? []).map((r) => ({
          ...r,
          company_name: companyMap.get(r.company_id) ?? "—",
        })),
      });
    }

    if (tab === "jobs") {
      const { data, error } = await admin
        .from("jobs")
        .select(
          "id, company_id, title, department, location, job_type, status, cv_count, candidate_count, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      return NextResponse.json({
        data: (data ?? []).map((r) => ({
          ...r,
          company_name: companyMap.get(r.company_id) ?? "—",
        })),
      });
    }

    if (tab === "screenings") {
      const { data, error } = await admin
        .from("blind_screenings")
        .select("id, company_id, name, status, cv_count, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      return NextResponse.json({
        data: (data ?? []).map((r) => ({
          ...r,
          company_name: companyMap.get(r.company_id) ?? "—",
        })),
      });
    }

    return NextResponse.json({ data: [] });
  } catch (err) {
    console.error("GET /api/admin/data-history error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
