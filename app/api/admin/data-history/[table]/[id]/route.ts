import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TABLES = ["cv_uploads", "jobs", "blind_screenings"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  const { table, id } = await params;

  if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();

    // cv_uploads may have child records in blind_screenings — nullify first
    if (table === "cv_uploads") {
      await admin
        .from("blind_screenings")
        .update({ created_by: null })
        .eq("created_by", id);
    }

    // jobs may have cv_uploads referencing them — nullify job_id first
    if (table === "jobs") {
      await admin.from("cv_uploads").update({ job_id: null }).eq("job_id", id);
    }

    const { error } = await admin
      .from(table as AllowedTable)
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/admin/data-history/${table}/${id} error:`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
