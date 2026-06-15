// app/api/apply/route.ts
//
// CONCEPT:
// This is the ONLY public API route — no auth token required.
//
// GET  /api/apply?slug=   → Returns job details for the apply page
// POST /api/apply         → Receives file as base64, uploads to storage
//                           via admin client, inserts into cv_uploads
//
// WHY STORAGE UPLOAD IS SERVER-SIDE:
// The anon key cannot upload to Supabase Storage from the browser
// even with public policies. Admin client bypasses RLS entirely.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// ─── GET /api/apply?slug= ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const { data: job, error } = await admin
      .from("jobs")
      .select(
        `
        id, title, department, location, employment_type,
        experience_level, salary_min, salary_max,
        description, requirements, skills, slug, status,
        company:companies (
          id, name, logo_url, industry, website
        )
      `,
      )
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Rename skills → skills_required so frontend type matches
    const jobWithSkills = {
      ...job,
      skills_required: (job as any).skills ?? [],
    };

    return NextResponse.json({ job: jobWithSkills });
  } catch (err) {
    console.error("GET /api/apply error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── POST /api/apply ──────────────────────────────────────────────────────────
// Public route — no authentication required.
//
// Request body (JSON):
//   job_id            string   (job UUID)
//   candidate_name    string
//   candidate_email   string
//   candidate_phone   string | null
//   original_filename string   (e.g. "john-cv.pdf")
//   file_base64       string   (base64 encoded file content)
//   file_type         string   (MIME type e.g. "application/pdf")
//   file_size_kb      number
//   source            string   ("apply_link")

export async function POST(req: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();

    // 1. Parse JSON body
    const body = await req.json();
    const {
      job_id,
      candidate_name,
      candidate_email,
      candidate_phone,
      original_filename,
      file_base64,
      file_type,
      file_size_kb,
      source,
    } = body;

    // 2. Validate required fields
    if (!job_id || !candidate_name || !candidate_email || !file_base64) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: job_id, candidate_name, candidate_email, file_base64",
        },
        { status: 400 },
      );
    }

    if (!candidate_email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // 3. Look up job by id — must be active
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, company_id, title, status, candidate_count")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "active") {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 410 },
      );
    }
    const { count: existingCount } = await admin
      .from("cv_uploads")
      .select("*", { count: "exact", head: true })
      .eq("job_id", job_id)
      .eq("candidate_email", candidate_email.trim().toLowerCase());

    if (existingCount && existingCount > 0) {
      return NextResponse.json(
        { error: "You have already applied for this position." },
        { status: 409 },
      );
    }
    // 4. Check company CV quota
    const { data: sub } = await admin
      .from("subscriptions")
      .select("cv_count_current, cv_limit_monthly, status")
      .eq("company_id", job.company_id)
      .maybeSingle();

    if (sub && sub.cv_count_current >= sub.cv_limit_monthly) {
      return NextResponse.json(
        { error: "This company has reached its CV screening limit" },
        { status: 429 },
      );
    }

    // 5. Upload CV to storage using admin client (bypasses RLS)
    const cvId = crypto.randomUUID();
    const ext = original_filename?.split(".").pop() ?? "pdf";
    const filePath = `${job.company_id}/${job.id}/${cvId}.${ext}`;

    const fileBuffer = Buffer.from(file_base64, "base64");

    const { error: storageErr } = await admin.storage
      .from("cvs")
      .upload(filePath, fileBuffer, {
        contentType: file_type ?? "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (storageErr) {
      console.error("storage upload error:", storageErr);
      return NextResponse.json(
        { error: "Failed to upload CV: " + storageErr.message },
        { status: 500 },
      );
    }

    // 6. Get public URL
    const { data: urlData } = admin.storage.from("cvs").getPublicUrl(filePath);

    // 7. Insert into cv_uploads
    const { data: cvRecord, error: insertErr } = await admin
      .from("cv_uploads")
      .insert({
        id: cvId,
        job_id: job.id,
        company_id: job.company_id,
        candidate_name: candidate_name.trim(),
        candidate_email: candidate_email.trim().toLowerCase(),
        candidate_phone: candidate_phone ?? null,
        original_filename: original_filename ?? null,
        file_path: filePath,
        cv_url: urlData.publicUrl,
        file_size_kb: file_size_kb ?? 0,
        file_type: ext.toLowerCase(),
        screening_status: "pending",
        extraction_status: "pending",
        status: "new",
        source: "apply_link",
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("cv_uploads insert error:", insertErr);
      // Clean up uploaded file if DB insert fails
      await admin.storage.from("cvs").remove([filePath]);
      return NextResponse.json(
        { error: "Failed to save application" },
        { status: 500 },
      );
    }

    // 8. Update job candidate_count
    await admin
      .from("jobs")
      .update({ candidate_count: (job.candidate_count ?? 0) + 1 })
      .eq("id", job.id);

    // 9. Update company CV quota
    if (sub) {
      await admin
        .from("subscriptions")
        .update({ cv_count_current: sub.cv_count_current + 1 })
        .eq("company_id", job.company_id);
    }

    // 10. Trigger AI screening (fire and forget — candidate doesn't wait)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    fetch(`${appUrl}/api/screening/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cvId: cvId,
        jobId: job.id,
        companyId: job.company_id,
      }),
    }).catch((err) => console.error("screening trigger failed:", err));

    // 11. Return success
    return NextResponse.json(
      {
        success: true,
        cvId: cvRecord?.id,
        message: "Application submitted successfully",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/apply error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
