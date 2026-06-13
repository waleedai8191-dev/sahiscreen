import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/plans";

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();

    // Total companies
    const { count: totalCompanies } = await admin
      .from("companies")
      .select("*", { count: "exact", head: true });

    // All subscriptions (for revenue + breakdown)
    const { data: subs } = await admin
      .from("subscriptions")
      .select(
        "plan_tier, status, payment_status, cv_count_current, cv_limit_monthly",
      );

    const activeSubs = (subs ?? []).filter((s) => s.status === "active");

    // Revenue — sum of plan price for active paid subs
    const monthlyRevenue = activeSubs.reduce((sum, s) => {
      const plan = PLANS[s.plan_tier as keyof typeof PLANS];
      return sum + (plan?.price ?? 0);
    }, 0);

    // Plan breakdown
    const planBreakdown = {
      free: (subs ?? []).filter((s) => s.plan_tier === "free").length,
      essential: (subs ?? []).filter((s) => s.plan_tier === "essential").length,
      premium: (subs ?? []).filter((s) => s.plan_tier === "premium").length,
    };

    // CVs screened today (all companies)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: cvsToday } = await admin
      .from("cv_uploads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    // Total CVs ever screened
    const { count: totalCvs } = await admin
      .from("cv_uploads")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      totalCompanies: totalCompanies ?? 0,
      activeSubscriptions: activeSubs.length,
      monthlyRevenue,
      planBreakdown,
      cvsToday: cvsToday ?? 0,
      totalCvs: totalCvs ?? 0,
    });
  } catch (err) {
    console.error("GET /api/admin/stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
