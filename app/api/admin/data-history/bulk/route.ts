import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TABLES = ["cv_uploads", "jobs", "blind_screenings"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

export async function DELETE(req: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();
    const { table, company_id } = await req.json();

    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    if (table === "jobs") {
      // Nullify cv_uploads.job_id before deleting jobs
      const query = company_id
        ? admin
            .from("cv_uploads")
            .update({ job_id: null })
            .eq("company_id", company_id)
        : admin
            .from("cv_uploads")
            .update({ job_id: null })
            .not("job_id", "is", null);
      await query;
    }

    const { error } = company_id
      ? await admin
          .from(table as AllowedTable)
          .delete()
          .eq("company_id", company_id)
      : await admin
          .from(table as AllowedTable)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/data-history/bulk error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
