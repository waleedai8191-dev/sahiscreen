import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getPlan, isPaidPlan, type PlanTier } from "@/lib/plans";

export async function POST(req: Request) {
  try {
    const { companyName, planTier = "free" } = await req.json();

    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: "Company name required" },
        { status: 400 },
      );
    }

    // Validate plan
    const plan = getPlan(planTier);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Check if user already has a company (prevent duplicates)
    const { data: existingUser } = await admin
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (existingUser?.company_id) {
      return NextResponse.json(
        { error: "Onboarding already completed" },
        { status: 409 },
      );
    }

    // Step 1 — Create company
    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({ name: companyName.trim() })
      .select("id")
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: companyError?.message ?? "Failed to create company" },
        { status: 500 },
      );
    }

    // Step 2 — Link user to company
    const { error: userError } = await admin
      .from("users")
      .update({ company_id: company.id })
      .eq("id", user.id);

    if (userError) {
      await admin.from("companies").delete().eq("id", company.id);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Step 3 — Create subscription
    const now = new Date().toISOString();

    const isTrial = isPaidPlan(plan.tier as PlanTier);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { error: subError } = await admin.from("subscriptions").insert({
      company_id: company.id,
      plan_tier: plan.tier,
      status: isTrial ? "trial" : "active",
      payment_status: "unpaid",
      plan_selected_at: now,
      trial_start: isTrial ? now : null,
      trial_end: isTrial ? trialEnd.toISOString() : null,
      cv_count_current: 0,
      cv_limit_monthly: plan.cvLimit,
      job_limit: plan.jobLimit,
    });

    if (subError) {
      await admin.from("users").update({ company_id: null }).eq("id", user.id);
      await admin.from("companies").delete().eq("id", company.id);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      companyId: company.id,
      planTier: plan.tier,
      requiresPayment: isPaidPlan(plan.tier as PlanTier),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
