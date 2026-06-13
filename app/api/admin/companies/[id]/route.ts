import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanTier } from "@/lib/plans";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const admin = createSupabaseAdminClient();

    const { data: company, error: companyErr } = await admin
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    if (companyErr || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data: subscription } = await admin
      .from("subscriptions")
      .select("*")
      .eq("company_id", id)
      .single();

    const { data: users } = await admin
      .from("users")
      .select("id, full_name, email, role, designation, is_active, created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: true });

    // Quick CV stats
    const { count: totalCvs } = await admin
      .from("cv_uploads")
      .select("*", { count: "exact", head: true })
      .eq("company_id", id);

    const { count: jobCount } = await admin
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", id);

    return NextResponse.json({
      company,
      subscription: subscription ?? null,
      users: users ?? [],
      totalCvs: totalCvs ?? 0,
      jobCount: jobCount ?? 0,
    });
  } catch (err) {
    console.error("GET /api/admin/companies/[id] error:", err);
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
    const admin = createSupabaseAdminClient();
    const body = await req.json();
    const { plan_tier, status, cv_limit_monthly, job_limit, cv_count_current } =
      body;

    // Check subscription exists
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id, company_id")
      .eq("company_id", id)
      .single();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (plan_tier !== undefined) {
      if (!["free", "essential", "premium"].includes(plan_tier)) {
        return NextResponse.json(
          { error: "Invalid plan tier" },
          { status: 400 },
        );
      }
      updateData.plan_tier = plan_tier;

      // Auto-sync limits with plan defaults unless explicitly overridden
      const plan = PLANS[plan_tier as PlanTier];
      if (cv_limit_monthly === undefined)
        updateData.cv_limit_monthly = plan.cvLimit;
      if (job_limit === undefined) updateData.job_limit = plan.jobLimit;
    }

    if (status !== undefined) updateData.status = status;
    if (cv_limit_monthly !== undefined)
      updateData.cv_limit_monthly = cv_limit_monthly;
    if (job_limit !== undefined) updateData.job_limit = job_limit;
    if (cv_count_current !== undefined)
      updateData.cv_count_current = cv_count_current;

    let result;
    if (existing) {
      result = await admin
        .from("subscriptions")
        .update(updateData)
        .eq("company_id", id)
        .select()
        .single();
    } else {
      // No subscription row exists — create one
      result = await admin
        .from("subscriptions")
        .insert({ company_id: id, ...updateData })
        .select()
        .single();
    }

    if (result.error) {
      console.error("subscription update error:", result.error);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, subscription: result.data });
  } catch (err) {
    console.error("PATCH /api/admin/companies/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
