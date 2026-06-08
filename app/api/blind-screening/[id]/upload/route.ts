import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkCvLimitServer } from "@/lib/limitChecks";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;

  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    // Auth check
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

    if (!profile?.company_id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify session belongs to this company and is not archived
    const { data: session } = await admin
      .from("blind_screenings")
      .select("id, status, cv_count")
      .eq("id", sessionId)
      .eq("company_id", profile.company_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "archived") {
      return NextResponse.json(
        { error: "Cannot upload to an archived session" },
        { status: 400 },
      );
    }

    // Check CV monthly limit before accepting upload
    // If limit reached → return 403 with upgrade info
    const cvLimitCheck = await checkCvLimitServer(profile.company_id);
    if (!cvLimitCheck.allowed) {
      return cvLimitCheck.response!;
    }

    // Parse request body
    const body = await req.json();
    const { file_base64, original_filename, file_type, file_size_kb } = body;

    if (!file_base64 || !original_filename) {
      return NextResponse.json(
        { error: "file_base64 and original_filename are required" },
        { status: 400 },
      );
    }

    // Validate file type — only PDF and DOCX allowed
    const ext = original_filename.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "docx"].includes(ext)) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 },
      );
    }

    // Upload to Supabase Storage
    // Path: company_id/blind/session_id/cv_id.ext
    const cvId = crypto.randomUUID();
    const filePath = `${profile.company_id}/blind/${sessionId}/${cvId}.${ext}`;
    const fileBuffer = Buffer.from(file_base64, "base64");

    const { error: storageErr } = await admin.storage
      .from("cvs")
      .upload(filePath, fileBuffer, {
        contentType: file_type ?? "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (storageErr) {
      console.error("Storage upload error:", storageErr);
      return NextResponse.json(
        { error: "Storage upload failed: " + storageErr.message },
        { status: 500 },
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = admin.storage.from("cvs").getPublicUrl(filePath);

    // Derive candidate name from filename
    // e.g. "john_smith_cv.pdf" → "john_smith_cv"
    const candidateName = original_filename
      .replace(/\.(pdf|docx)$/i, "")
      .replace(/[_-]/g, " ")
      .trim();

    // Insert into cv_uploads
    // job_id is NULL — blind screening has no job posting
    const { data: candidate, error: insertErr } = await admin
      .from("cv_uploads")
      .insert({
        id: cvId,
        job_id: null,
        blind_screening_id: sessionId,
        screening_mode: "blind",
        company_id: profile.company_id,
        candidate_name: candidateName,
        candidate_email: "",
        cv_url: urlData.publicUrl,
        file_path: filePath,
        original_filename,
        file_size_kb: file_size_kb ?? 0,
        file_type: ext,
        status: "new",
        screening_status: "pending",
        extraction_status: "pending",
        source: "manual",
      })
      .select("id")
      .single();

    if (insertErr) {
      // Rollback storage upload if DB insert fails
      await admin.storage.from("cvs").remove([filePath]);
      console.error("cv_uploads insert error:", insertErr);
      return NextResponse.json(
        { error: "Database insert failed: " + insertErr.message },
        { status: 500 },
      );
    }

    // Increment session cv_count
    await admin
      .from("blind_screenings")
      .update({ cv_count: (session.cv_count ?? 0) + 1 })
      .eq("id", sessionId);

    return NextResponse.json({
      success: true,
      cvId: candidate?.id,
      filePath,
      candidateName,
    });
  } catch (err) {
    console.error("POST /api/blind-screening/[id]/upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
