import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// ─── Check Job Limit ──────────────────────────────────────────────────────────
export async function checkJobLimitServer(companyId: string): Promise<{
  allowed: boolean;
  response?: ReturnType<typeof NextResponse.json>;
}> {
  const admin = createSupabaseAdminClient();

  // Get subscription limits
  const { data: sub } = await admin
    .from("subscriptions")
    .select("job_limit, status, plan_tier")
    .eq("company_id", companyId)
    .single();

  if (!sub) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Subscription not found" },
        { status: 403 },
      ),
    };
  }

  // Block pending_payment users entirely
  if (sub.status === "pending_payment") {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "Payment required",
          code: "PAYMENT_REQUIRED",
          message: "Complete your payment to start posting jobs",
        },
        { status: 403 },
      ),
    };
  }

  // Count current active jobs
  const { count: activeJobs } = await admin
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "active");

  const currentActive = activeJobs ?? 0;
  const jobLimit = sub.job_limit ?? 1;

  if (currentActive >= jobLimit) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "Job limit reached",
          code: "JOB_LIMIT_REACHED",
          current: currentActive,
          limit: jobLimit,
          plan: sub.plan_tier,
          message: `Your ${sub.plan_tier} plan allows ${jobLimit} active job${jobLimit === 1 ? "" : "s"}. Upgrade to post more.`,
        },
        { status: 403 },
      ),
    };
  }

  return { allowed: true };
}

// ─── Check CV Limit ───────────────────────────────────────────────────────────
export async function checkCvLimitServer(companyId: string): Promise<{
  allowed: boolean;
  response?: ReturnType<typeof NextResponse.json>;
}> {
  const admin = createSupabaseAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("cv_limit_monthly, cv_count_current, status, plan_tier")
    .eq("company_id", companyId)
    .single();

  if (!sub) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Subscription not found" },
        { status: 403 },
      ),
    };
  }

  // Block pending_payment users entirely
  if (sub.status === "pending_payment") {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "Payment required",
          code: "PAYMENT_REQUIRED",
          message: "Complete your payment to start screening CVs",
        },
        { status: 403 },
      ),
    };
  }

  const used = sub.cv_count_current ?? 0;
  const limit = sub.cv_limit_monthly ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "CV limit reached",
          code: "CV_LIMIT_REACHED",
          current: used,
          limit: limit,
          plan: sub.plan_tier,
          message: `You've used ${used}/${limit} CVs this month. Upgrade for more.`,
        },
        { status: 403 },
      ),
    };
  }

  return { allowed: true };
}

// ─── Increment CV Count ───────────────────────────────────────────────────────
export async function incrementCvCount(
  companyId: string,
  count: number = 1,
): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { error } = await admin.rpc("increment_cv_count", {
    p_company_id: companyId,
    p_count: count,
  });

  if (error) {
    console.error("incrementCvCount failed:", error);
  }
}
