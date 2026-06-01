import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: jobId } = await params;

  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    // Verify HR is logged in
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await admin
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { file_base64, original_filename, file_type, file_size_kb } = body;

    if (!file_base64 || !original_filename) {
      return NextResponse.json(
        { error: "file_base64 and original_filename are required" },
        { status: 400 },
      );
    }

    // Upload via admin client — bypasses RLS
    const cvId = crypto.randomUUID();
    const ext = original_filename.split(".").pop() ?? "pdf";
    const filePath = `${profile.company_id}/${jobId}/${cvId}.${ext}`;
    const fileBuffer = Buffer.from(file_base64, "base64");

    const { error: storageErr } = await admin.storage
      .from("cvs")
      .upload(filePath, fileBuffer, {
        contentType: file_type ?? "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (storageErr) {
      return NextResponse.json(
        { error: "Storage upload failed: " + storageErr.message },
        { status: 500 },
      );
    }

    const { data: urlData } = admin.storage.from("cvs").getPublicUrl(filePath);

    // Insert into cv_uploads
    const { data: candidate, error: insertErr } = await admin
      .from("cv_uploads")
      .insert({
        id: cvId,
        job_id: jobId,
        company_id: profile.company_id,
        candidate_name: original_filename.replace(/\.(pdf|docx)$/i, ""),
        candidate_email: "",
        cv_url: urlData.publicUrl,
        file_path: filePath,
        original_filename,
        file_size_kb: file_size_kb ?? 0,
        file_type: ext.toLowerCase(),
        status: "new",
        screening_status: "pending",
        extraction_status: "pending",
        source: "manual",
      })
      .select("id")
      .single();

    if (insertErr) {
      await admin.storage.from("cvs").remove([filePath]);
      return NextResponse.json(
        { error: "Database insert failed: " + insertErr.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      cvId: candidate?.id,
      filePath,
    });
  } catch (err) {
    console.error("POST /api/jobs/[id]/upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
