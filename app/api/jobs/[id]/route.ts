import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Helper: verify job belongs to user's company ─────────────────────────────

async function getJobAndVerifyOwnership(
  jobId: string,
  companyId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { data: job, error } = await admin
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", companyId) // ← ownership check
    .single();

  if (error || !job) return null;
  return job;
}

// ─── GET /api/jobs/[id] ───────────────────────────────────────────────────────
// Returns full job details + live candidate counts from cv_uploads.
// Note: we use cv_uploads table (your actual candidates table).

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

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

    // Fetch job — ownership verified by company_id filter
    const job = await getJobAndVerifyOwnership(id, profile.company_id, admin);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Fetch candidates WITH screening results joined
    // One query instead of two — more efficient
    const { data: cvUploads } = await admin
      .from("cv_uploads")
      .select(
        `
    id,
    candidate_name,
    candidate_email,
    candidate_phone,
    cv_url,
    file_path,
    status,
    screening_status,
    source,
    created_at,
    screening_results (
      overall_score,
      summary,
      strengths,
      red_flags,
      justification,
      recommendation
    )
  `,
      )
      .eq("job_id", id)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    // Build stats from the same data — no second DB call needed
    const cvList = cvUploads ?? [];

    const stats = {
      total: cvList.length,
      screened: cvList.filter((c) => c.screening_status === "completed").length,
      pending: cvList.filter((c) => c.screening_status === "pending").length,
      shortlisted: cvList.filter((c) => c.status === "shortlisted").length,
      rejected: cvList.filter((c) => c.status === "rejected").length,
    };

    // Shape data to match what the frontend page expects
    // The page uses ai_score, ai_summary etc — these come from screening_results
    const candidates = cvList.map((c) => {
      // screening_results is returned as array by Supabase — take first element
      const sr = Array.isArray(c.screening_results)
        ? c.screening_results[0]
        : c.screening_results;

      return {
        id: c.id,
        candidate_name: c.candidate_name,
        candidate_email: c.candidate_email,
        candidate_phone: c.candidate_phone ?? null,
        cv_url: c.cv_url ?? c.file_path, // fallback to file_path if cv_url empty
        status: c.status ?? "new",
        screening_status: c.screening_status ?? "pending",
        source: c.source ?? "manual",
        applied_at: c.created_at,

        // AI fields — from screening_results join
        ai_score: sr?.overall_score ?? null,
        ai_summary: sr?.summary ?? null,
        ai_strengths: sr?.strengths ?? null,
        ai_red_flags: sr?.red_flags ?? null,
        ai_justification: sr?.justification ?? null,
      };
    });

    // Fetch subscription quota for upload page
    const { data: sub } = await admin
      .from("subscriptions")
      .select("cv_count_current, cv_limit_monthly")
      .eq("company_id", profile.company_id)
      .maybeSingle();

    return NextResponse.json({
      job,
      stats,
      candidates,
      companyId: profile.company_id,
      quota: {
        used: sub?.cv_count_current ?? 0,
        limit: sub?.cv_limit_monthly ?? 50,
      },
    });
  } catch (err) {
    console.error("GET /api/jobs/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await admin
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "hr"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Verify ownership
    const job = await getJobAndVerifyOwnership(id, profile.company_id, admin);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Only allow safe fields to be updated — never company_id or slug
    const body = await req.json();
    const allowedFields = [
      "title",
      "department",
      "location",
      "employment_type",
      "experience_level",
      "description",
      "requirements",
      "skills",
      "salary_min",
      "salary_max",
      "status",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Validate status if provided
    if (
      updates.status &&
      !["draft", "active", "closed"].includes(updates.status as string)
    ) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const { data: updated, error: updateErr } = await admin
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (updateErr) {
      console.error("job update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update job" },
        { status: 500 },
      );
    }

    return NextResponse.json({ job: updated });
  } catch (err) {
    console.error("PATCH /api/jobs/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/jobs/[id] ────────────────────────────────────────────────────
// Admin only. Deletes job and all associated cv_uploads + screening_results
// (cascade delete handles this via FK constraints in the database).
// Returns 204 No Content on success.

export async function DELETE(
  req: NextRequest,

  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await admin
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    // Only admin can delete jobs
    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const job = await getJobAndVerifyOwnership(id, profile.company_id, admin);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { error: deleteErr } = await admin
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (deleteErr) {
      console.error("job delete error:", deleteErr);
      return NextResponse.json(
        { error: "Failed to delete job" },
        { status: 500 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/jobs/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
