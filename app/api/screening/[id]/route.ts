import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── GET /api/screening/[id] ──────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    // 1. Verify auth
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's company_id
    const { data: profile } = await admin
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Fetch candidate from cv_uploads — verify ownership via company_id
    const { data: candidate, error: candidateErr } = await admin
      .from("cv_uploads")
      .select(
        `id,
         job_id,
         company_id,
         candidate_name,
         candidate_email,
         candidate_phone,
         original_filename,
         file_path,
         cv_url,
         file_size_kb,
         file_type,
         screening_status,
         extraction_status,
         status,
         source,
         created_at,
         updated_at`,
      )
      .eq("id", params.id)
      .eq("company_id", profile.company_id)
      .single();

    if (candidateErr || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found or access denied" },
        { status: 404 },
      );
    }

    // 4. Fetch screening result
    // candidate_id in screening_results = cv_uploads.id
    const { data: screening, error: screeningErr } = await admin
      .from("screening_results")
      .select(
        `id,
         score,
         overall_score,
         relevance_score,
         achievement_score,
         red_flag_score,
         context_score,
         communication_score,
         recommendation,
         summary,
         strengths,
         red_flags,
         justification,
         hr_decision,
         hr_notes,
         decided_by,
         decided_at,
         rank_position,
         status,
         model_used,
         screened_at,
         created_at`,
      )
      .eq("candidate_id", params.id)
      .single();

    // Screening result may not exist yet if still pending/processing
    // That's fine — return null for screening
    if (screeningErr && screeningErr.code !== "PGRST116") {
      // PGRST116 = row not found — that's acceptable
      console.error("screening fetch error:", screeningErr);
    }

    // 5. Build score label helper
    // Converts numeric score to human-readable label
    // 80-100 → Strong  60-79 → Good  40-59 → Fair  0-39 → Weak
    const overallScore = screening?.overall_score ?? screening?.score ?? null;
    const scoreLabel =
      overallScore !== null
        ? overallScore >= 80
          ? "Strong"
          : overallScore >= 60
            ? "Good"
            : overallScore >= 40
              ? "Fair"
              : "Weak"
        : null;

    return NextResponse.json({
      candidate,
      screening: screening ? { ...screening, score_label: scoreLabel } : null,
    });
  } catch (err) {
    console.error("GET /api/screening/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/screening/[id] ────────────────────────────────────────────────
// HR records their decision on a candidate after reviewing AI results.
// Updates both:
//   1. screening_results.hr_decision + hr_notes + decided_by + decided_at
//   2. cv_uploads.status (mirrors the decision)
//
// Request body:
// {
//   decision: "shortlisted" | "rejected" | "hired" | "new"
//   notes?: string
// }
//
// WHY UPDATE BOTH TABLES:
// screening_results.hr_decision = audit trail (who decided, when, notes)
// cv_uploads.status             = quick filter in candidate list UI

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    // 1. Auth check
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Profile + role check
    const { data: profile } = await admin
      .from("users")
      .select("company_id, role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "hr"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Admin or HR access required" },
        { status: 403 },
      );
    }

    // 3. Validate request body
    const body = await req.json();
    const { decision, notes } = body;

    const validDecisions = ["new", "shortlisted", "rejected", "hired"];
    if (!decision || !validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: `decision must be one of: ${validDecisions.join(", ")}` },
        { status: 400 },
      );
    }

    // 4. Verify candidate belongs to user's company
    const { data: candidate } = await admin
      .from("cv_uploads")
      .select("id, company_id, candidate_name")
      .eq("id", params.id)
      .eq("company_id", profile.company_id)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found or access denied" },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    // 5. Update cv_uploads.status
    await admin
      .from("cv_uploads")
      .update({
        status: decision,
        updated_at: now,
      })
      .eq("id", params.id);

    // 6. Update screening_results hr_decision (audit trail)
    const { error: screeningUpdateErr } = await admin
      .from("screening_results")
      .update({
        hr_decision: decision,
        hr_notes: notes ?? null,
        decided_by: user.id,
        decided_at: now,
      })
      .eq("candidate_id", params.id);

    if (screeningUpdateErr) {
      // Non-critical — cv_uploads already updated
      // Screening result might not exist yet (still pending)
      console.warn(
        "screening_results hr_decision update warning:",
        screeningUpdateErr,
      );
    }

    return NextResponse.json({
      success: true,
      candidateId: params.id,
      decision,
      decidedAt: now,
      message: `${candidate.candidate_name} marked as ${decision}`,
    });
  } catch (err) {
    console.error("PATCH /api/screening/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
