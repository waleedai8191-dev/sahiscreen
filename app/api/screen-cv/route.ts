import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runScreening, runBulkScreening } from "@/lib/ai/screening-engine";

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ──────────────────────────────────────────────────────
    // Internal calls from /api/screening/trigger pass a service key header
    // External calls (dashboard Re-screen button) need user session

    const serviceKey = req.headers.get("x-service-key");
    const isInternal = serviceKey === process.env.INTERNAL_SERVICE_KEY;

    let companyIdFromSession: string | null = null;

    if (!isInternal) {
      // Verify user session for external calls
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (!user || authErr) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get company from user profile
      const admin = createSupabaseAdminClient();
      const { data: profile } = await admin
        .from("users")
        .select("company_id, role")
        .eq("id", user.id)
        .single();

      if (!profile || !["admin", "hr"].includes(profile.role)) {
        return NextResponse.json(
          { error: "Admin or HR access required" },
          { status: 403 },
        );
      }

      companyIdFromSession = profile.company_id;
    }

    // ── 2. Parse request body ──────────────────────────────────────────────

    const body = await req.json();
    const { cvId, cvIds, jobId, companyId } = body;

    // Use company from session for external calls (security)
    // Use company from body for internal service calls
    const resolvedCompanyId = isInternal ? companyId : companyIdFromSession;

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 },
      );
    }

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // ── 3. Single CV screening ─────────────────────────────────────────────

    if (cvId && !cvIds) {
      const result = await runScreening({
        cvId,
        jobId,
        companyId: resolvedCompanyId,
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            cvId: result.cvId,
          },
          { status: 422 },
        );
      }

      return NextResponse.json({
        success: true,
        cvId: result.cvId,
        score: result.score,
        result: result.result,
        durationMs: result.durationMs,
      });
    }

    // ── 4. Bulk CV screening ───────────────────────────────────────────────

    if (cvIds && Array.isArray(cvIds)) {
      if (cvIds.length === 0) {
        return NextResponse.json(
          { error: "cvIds array is empty" },
          { status: 400 },
        );
      }

      // Cap bulk requests at 500 CVs per call
      if (cvIds.length > 500) {
        return NextResponse.json(
          { error: "Maximum 500 CVs per bulk screening request" },
          { status: 400 },
        );
      }

      const bulkResult = await runBulkScreening(
        cvIds,
        jobId,
        resolvedCompanyId,
      );

      return NextResponse.json({
        success: bulkResult.failed === 0,
        total: bulkResult.total,
        succeeded: bulkResult.succeeded,
        failed: bulkResult.failed,
        results: bulkResult.results.map((r) => ({
          cvId: r.cvId,
          success: r.success,
          score: r.score,
          error: r.error,
        })),
      });
    }

    // Neither cvId nor cvIds provided
    return NextResponse.json(
      { error: "Either cvId (single) or cvIds (bulk array) is required" },
      { status: 400 },
    );
  } catch (err) {
    console.error("POST /api/screen-cv error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
