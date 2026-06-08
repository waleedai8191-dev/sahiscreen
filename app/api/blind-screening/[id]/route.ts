import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── GET /api/blind-screening/[id] ───────────────────────────────────────────
// Returns single session + all candidates + their screening results

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

    if (!profile?.company_id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch session — ownership verified by company_id
    const { data: session, error: sessionErr } = await admin
      .from("blind_screenings")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    } // Fetch CVs for this session — simple query, no nested join
    const { data: cvUploads } = await admin
      .from("cv_uploads")
      .select(
        "id, candidate_name, candidate_email, cv_url, file_path, status, screening_status, created_at",
      )
      .eq("blind_screening_id", id)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    const cvList = cvUploads ?? [];

    // Fetch screening results separately
    const cvIds = cvList.map((c) => c.id);
    const { data: screeningResults } =
      cvIds.length > 0
        ? await admin
            .from("screening_results")
            .select(
              "candidate_id, overall_score, summary, strengths, red_flags, justification, interview_questions, recommendation, status",
            )
            .in("candidate_id", cvIds)
        : { data: [] };

    // ── Auto-heal: if screening_result exists and is completed but
    if (screeningResults && screeningResults.length > 0) {
      const completedResultIds = screeningResults
        .filter((sr) => sr.status === "completed" && sr.overall_score !== null)
        .map((sr) => sr.candidate_id);

      const stuckCvIds = cvList
        .filter(
          (cv) =>
            completedResultIds.includes(cv.id) &&
            (cv.screening_status === "processing" ||
              cv.screening_status === "pending"),
        )
        .map((cv) => cv.id);

      if (stuckCvIds.length > 0) {
        await admin
          .from("cv_uploads")
          .update({ screening_status: "completed" })
          .in("id", stuckCvIds);

        // Update local list so response reflects correct status
        cvList.forEach((cv) => {
          if (stuckCvIds.includes(cv.id)) {
            cv.screening_status = "completed";
          }
        });
      }
    }
    const resultsMap = new Map(
      (screeningResults ?? []).map((sr) => [sr.candidate_id, sr]),
    );

    // Build stats
    const stats = {
      total: cvList.length,
      screened: cvList.filter((c) => c.screening_status === "completed").length,
      pending: cvList.filter((c) => c.screening_status === "pending").length,
      shortlisted: cvList.filter((c) => c.status === "shortlisted").length,
      rejected: cvList.filter((c) => c.status === "rejected").length,
    };

    // Shape candidates for frontend
    const candidates = cvList.map((c) => {
      const sr = resultsMap.get(c.id);

      return {
        id: c.id,
        candidate_name: c.candidate_name,
        candidate_email: c.candidate_email,
        cv_url: c.cv_url ?? c.file_path,
        status: c.status ?? "new",
        screening_status: c.screening_status ?? "pending",
        applied_at: c.created_at,
        ai_score: sr?.overall_score ?? null,
        ai_summary: sr?.summary ?? null,
        ai_strengths: sr?.strengths ?? null,
        ai_red_flags: sr?.red_flags ?? null,
        ai_justification: sr?.justification ?? null,
        ai_recommendation: sr?.recommendation ?? null,
        interview_questions: sr?.interview_questions ?? [], // ← included
      };
    });

    // Fetch quota
    const { data: sub } = await admin
      .from("subscriptions")
      .select("cv_count_current, cv_limit_monthly, plan_tier")
      .eq("company_id", profile.company_id)
      .maybeSingle();

    return NextResponse.json({
      session,
      stats,
      candidates,
      companyId: profile.company_id,
      quota: {
        used: sub?.cv_count_current ?? 0,
        limit: sub?.cv_limit_monthly ?? 10,
        plan: sub?.plan_tier ?? "free",
      },
    });
  } catch (err) {
    console.error("GET /api/blind-screening/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/blind-screening/[id] ────────────────────────────────────────
// Hard delete — removes session, all CVs, results, and storage files

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

    if (!profile || !["admin", "hr"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Verify session belongs to this company
    const { data: session } = await admin
      .from("blind_screenings")
      .select("id")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get all CVs for this session to delete storage files
    const { data: cvList } = await admin
      .from("cv_uploads")
      .select("id, file_path")
      .eq("blind_screening_id", id);

    const cvIds = (cvList ?? []).map((cv) => cv.id);

    // Delete screening_results first (FK constraint)
    if (cvIds.length > 0) {
      await admin.from("screening_results").delete().in("candidate_id", cvIds);
    }

    // Delete cv_uploads
    if (cvIds.length > 0) {
      await admin.from("cv_uploads").delete().in("id", cvIds);
    }

    // Delete files from Supabase Storage
    const filePaths = (cvList ?? []).map((cv) => cv.file_path).filter(Boolean);

    if (filePaths.length > 0) {
      await admin.storage.from("cvs").remove(filePaths);
    }

    // Delete the session itself
    await admin
      .from("blind_screenings")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/blind-screening/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
// ─── PATCH /api/blind-screening/[id] ─────────────────────────────────────────
// Archive/unarchive or rename a session

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

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.name) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.job_requirements !== undefined) {
      updates.job_requirements = body.job_requirements;
    }
    if (body.status && ["active", "archived"].includes(body.status)) {
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await admin
      .from("blind_screenings")
      .update(updates)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ session: updated });
  } catch (err) {
    console.error("PATCH /api/blind-screening/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
