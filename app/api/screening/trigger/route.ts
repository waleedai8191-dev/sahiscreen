import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();
    const body = await req.json();

    const { jobId, companyId, cvId } = body;

    if (!jobId || !companyId) {
      return NextResponse.json(
        { error: "jobId and companyId are required" },
        { status: 400 },
      );
    }

    // 1. Fetch the job description (needed for AI scoring)
    const { data: job } = await admin
      .from("jobs")
      .select("id, title, description, requirements, skills")
      .eq("id", jobId)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 2. Fetch pending CVs — either one specific CV or all pending for job
    let query = admin
      .from("cv_uploads")
      .select(
        "id, file_path, candidate_name, candidate_email, parsed_text, screening_status",
      )
      .eq("job_id", jobId)
      .eq("company_id", companyId);

    if (cvId) {
      // Single CV trigger (from apply route)
      query = query.eq("id", cvId);
    } else {
      // Bulk trigger (from HR upload page)
      query = query.eq("screening_status", "pending");
    }

    const { data: cvList, error: fetchErr } = await query;

    if (fetchErr || !cvList || cvList.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending CVs to process",
        processed: 0,
      });
    }

    // 3. Mark all as 'processing' immediately
    const cvIds = cvList.map((cv) => cv.id);
    await admin
      .from("cv_uploads")
      .update({ screening_status: "processing" })
      .in("id", cvIds);

    // 4. Process each CV (calls your existing extract-cv + screen-cv routes)
    // Done asynchronously — we respond immediately and process in background
    processCVsInBackground(cvList, job, admin);

    return NextResponse.json({
      success: true,
      message: `Screening triggered for ${cvList.length} CV(s)`,
      processed: cvList.length,
    });
  } catch (err) {
    console.error("POST /api/screening/trigger error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── Background processor ─────────────────────────────────────────────────────
// Runs after HTTP response is sent. Processes each CV one by one.

async function processCV(
  cv: {
    id: string;
    file_path: string;
    candidate_name: string;
    parsed_text?: string;
  },
  job: {
    id: string;
    title: string;
    description?: string;
    requirements?: string;
    skills?: string[];
  },
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Step A: Extract CV text (uses your existing /api/extract-cv)
    // Skip if parsed_text already exists
    let cvText = cv.parsed_text ?? "";

    if (!cvText) {
      const extractRes = await fetch(`${appUrl}/api/extract-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: cv.file_path, cvId: cv.id }),
      });

      if (extractRes.ok) {
        const extractData = await extractRes.json();
        cvText = extractData.text ?? "";

        // Save extracted text back to cv_uploads
        await admin
          .from("cv_uploads")
          .update({
            parsed_text: cvText,
            extraction_status: "completed",
          })
          .eq("id", cv.id);
      }
    }

    // Step B: AI scoring (uses your existing /api/screen-cv)
    const screenRes = await fetch(`${appUrl}/api/screen-cv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cvText,
        cvId: cv.id,
        jobTitle: job.title,
        jobDescription: job.description ?? "",
        requirements: job.requirements ?? "",
        skills: job.skills ?? [],
      }),
    });

    if (!screenRes.ok) {
      throw new Error(`screen-cv returned ${screenRes.status}`);
    }

    const screenData = await screenRes.json();

    // Step C: Save result to screening_results table
    // Uses upsert — safe to call multiple times
    await admin.from("screening_results").upsert(
      {
        candidate_id: cv.id, // cv_uploads.id
        cv_id: cv.id, // your original column name
        job_id: job.id,
        company_id: screenData.companyId,
        score: screenData.overall_score ?? screenData.score,
        overall_score: screenData.overall_score,
        summary: screenData.summary ?? "",
        strengths: screenData.strengths ?? [],
        red_flags: screenData.red_flags ?? [],
        justification: screenData.justification ?? "",
        status: "completed",
        model_used: "claude-sonnet",
        screened_at: new Date().toISOString(),
      },
      {
        onConflict: "candidate_id",
      },
    );

    // Step D: Update cv_uploads screening_status to completed
    await admin
      .from("cv_uploads")
      .update({ screening_status: "completed" })
      .eq("id", cv.id);

    // Step E: Increment job screened_count
    const { data: jobRow } = await admin
      .from("jobs")
      .select("screened_count")
      .eq("id", job.id)
      .single();

    if (jobRow) {
      await admin
        .from("jobs")
        .update({ screened_count: (jobRow.screened_count ?? 0) + 1 })
        .eq("id", job.id);
    }
  } catch (err) {
    console.error(`screening failed for cv ${cv.id}:`, err);

    // Mark as failed so HR can see it in dashboard
    await admin
      .from("cv_uploads")
      .update({ screening_status: "failed" })
      .eq("id", cv.id);

    await admin.from("screening_results").upsert(
      {
        candidate_id: cv.id,
        cv_id: cv.id,
        job_id: job.id,
        status: "failed",
        screened_at: new Date().toISOString(),
      },
      {
        onConflict: "candidate_id",
      },
    );
  }
}

async function processCVsInBackground(
  cvList: Array<{
    id: string;
    file_path: string;
    candidate_name: string;
    parsed_text?: string;
  }>,
  job: {
    id: string;
    title: string;
    description?: string;
    requirements?: string;
    skills?: string[];
  },
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  for (const cv of cvList) {
    await processCV(cv, job, admin);
  }
}
