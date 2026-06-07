// app/api/candidates/[id]/route.ts
//
// CONCEPT:
// HR uses this to shortlist or reject a candidate after viewing AI results.
// Uses cv_uploads table (your actual candidates table).
//
// PATCH → update status (shortlisted / rejected / new / hired)
// GET   → get single candidate detail with screening result
//
// The hr_decision and hr_notes fields in screening_results
// are also updated here so HR decisions are audited.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── GET /api/candidates/[id] ─────────────────────────────────────────────────
// Returns full candidate detail + their AI screening result.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: candidateId } = await params;
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

    // Fetch candidate from cv_uploads — verify company ownership
    const { data: candidate, error: cvErr } = await admin
      .from("cv_uploads")
      .select(
        `
        id,
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
        created_at
      `,
      )
      .eq("id", candidateId)
      .eq("company_id", profile.company_id) // ownership check
      .single();

    if (cvErr || !candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    // Fetch AI screening result
    const { data: screening } = await admin
      .from("screening_results")
      .select(
        `
        score,
        overall_score,
        relevance_score,
        achievement_score,
        red_flag_score,
        context_score,
        communication_score,
        summary,
        strengths,
        red_flags,
        justification,
        recommendation,
        hr_decision,
        hr_notes,
        status,
        screened_at,
        model_used
      `,
      )
      .eq("candidate_id", candidateId)
      .single();

    return NextResponse.json({ candidate, screening: screening ?? null });
  } catch (err) {
    console.error("GET /api/candidates/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/candidates/[id] ───────────────────────────────────────────────
// HR shortlists or rejects a candidate.
// Updates both cv_uploads.status AND screening_results.hr_decision.
//
// Request body:
// {
//   status: "shortlisted" | "rejected" | "hired" | "new"
//   hr_notes?: string   (optional note from HR)
// }
// ─── DELETE /api/candidates/[id] ─────────────────────────────────────────────
// Removes a candidate (cv_upload row) and their screening result.

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: candidateId } = await params;
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

    // Verify candidate belongs to this company
    const { data: candidate } = await admin
      .from("cv_uploads")
      .select("id, company_id, file_path")
      .eq("id", candidateId)
      .eq("company_id", profile.company_id)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    // Delete screening result first (foreign key)
    await admin
      .from("screening_results")
      .delete()
      .eq("candidate_id", candidateId);

    // Delete cv_upload row
    const { error: deleteErr } = await admin
      .from("cv_uploads")
      .delete()
      .eq("id", candidateId);

    if (deleteErr) {
      return NextResponse.json(
        { error: "Failed to delete candidate" },
        { status: 500 },
      );
    }

    // Delete file from storage if path exists
    if (candidate.file_path) {
      await admin.storage.from("cvs").remove([candidate.file_path]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/candidates/[id] error:", err);
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
  const { id: candidateId } = await params;
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
    const { status, hr_notes } = body;

    const validStatuses = [
      "new",
      "screening",
      "shortlisted",
      "rejected",
      "hired",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    // Verify candidate belongs to user's company
    const { data: candidate } = await admin
      .from("cv_uploads")
      .select("id, company_id")
      .eq("id", candidateId)
      .eq("company_id", profile.company_id)
      .single();

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    // Update cv_uploads status
    const { data: updated, error: updateErr } = await admin
      .from("cv_uploads")
      .update({ status })
      .eq("id", candidateId)
      .select("id, status, candidate_name")
      .single();

    if (updateErr) {
      console.error("candidate status update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 },
      );
    }

    // Update hr_decision in screening_results for audit trail
    await admin
      .from("screening_results")
      .update({
        hr_decision: status,
        hr_notes: hr_notes ?? null,
        decided_by: user.id,
        decided_at: new Date().toISOString(),
      })
      .eq("candidate_id", candidateId);

    return NextResponse.json({
      success: true,
      candidate: updated,
    });
  } catch (err) {
    console.error("PATCH /api/candidates/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
