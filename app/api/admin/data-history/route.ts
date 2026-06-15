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

    // REPLACE WITH
    if (tab === "jobs") {
      const { data, error } = await admin
        .from("jobs")
        .select(
          "id, company_id, title, department, location, job_type, status, candidate_count, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Count CVs live from cv_uploads where job_id matches
      const jobIds = (data ?? []).map((r) => r.id);
      const { data: cvCounts } = await admin
        .from("cv_uploads")
        .select("job_id")
        .in("job_id", jobIds);

      // Build a count map: { job_id: count }
      const cvCountMap = new Map<string, number>();
      (cvCounts ?? []).forEach((cv) => {
        if (cv.job_id) {
          cvCountMap.set(cv.job_id, (cvCountMap.get(cv.job_id) ?? 0) + 1);
        }
      });

      return NextResponse.json({
        data: (data ?? []).map((r) => ({
          ...r,
          company_name: companyMap.get(r.company_id) ?? "—",
          cv_count: cvCountMap.get(r.id) ?? 0, // ← live real count
        })),
      });
    }

    if (tab === "screenings") {
      const { data, error } = await admin
        .from("blind_screenings")
        .select("id, company_id, name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Count CVs live from cv_uploads where blind_screening_id matches
      const screeningIds = (data ?? []).map((r) => r.id);
      const { data: screeningCvCounts } = await admin
        .from("cv_uploads")
        .select("blind_screening_id")
        .in("blind_screening_id", screeningIds);

      // Build a count map: { screening_id: count }
      const screeningCvCountMap = new Map<string, number>();
      (screeningCvCounts ?? []).forEach((cv) => {
        if (cv.blind_screening_id) {
          screeningCvCountMap.set(
            cv.blind_screening_id,
            (screeningCvCountMap.get(cv.blind_screening_id) ?? 0) + 1,
          );
        }
      });

      return NextResponse.json({
        data: (data ?? []).map((r) => ({
          ...r,
          company_name: companyMap.get(r.company_id) ?? "—",
          cv_count: screeningCvCountMap.get(r.id) ?? 0, // ← live real count
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
