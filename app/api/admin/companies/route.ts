import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createSupabaseAdminClient();

    // 1. Fetch all companies
    const { data: companies, error: companiesErr } = await admin
      .from("companies")
      .select("id, name, size, industry, website, created_at")
      .order("created_at", { ascending: false });

    if (companiesErr) {
      console.error("companies fetch error:", companiesErr);
      return NextResponse.json(
        { error: "Failed to fetch companies" },
        { status: 500 },
      );
    }

    const companyList = companies ?? [];
    const companyIds = companyList.map((c) => c.id);

    // 2. Fetch subscriptions for these companies
    const { data: subs } =
      companyIds.length > 0
        ? await admin
            .from("subscriptions")
            .select(
              "company_id, plan_tier, status, payment_status, cv_count_current, cv_limit_monthly, job_limit, current_period_end",
            )
            .in("company_id", companyIds)
        : { data: [] };

    const subsMap = new Map((subs ?? []).map((s) => [s.company_id, s]));

    // 3. Fetch user counts per company
    const { data: users } =
      companyIds.length > 0
        ? await admin
            .from("users")
            .select("id, company_id, is_active")
            .select("id, company_id")
            .in("company_id", companyIds)
        : { data: [] };

    const userCountMap = new Map<string, number>();
    (users ?? []).forEach((u) => {
      if (!u.company_id) return;
      userCountMap.set(u.company_id, (userCountMap.get(u.company_id) ?? 0) + 1);
    });

    // 4. Shape response
    const result = companyList.map((c) => {
      const sub = subsMap.get(c.id);
      return {
        id: c.id,
        name: c.name,
        size: c.size,
        industry: c.industry,
        website: c.website,
        created_at: c.created_at,
        user_count: userCountMap.get(c.id) ?? 0,
        plan_tier: sub?.plan_tier ?? "free",
        status: sub?.status ?? "active",
        payment_status: sub?.payment_status ?? null,
        cv_count_current: sub?.cv_count_current ?? 0,
        cv_limit_monthly: sub?.cv_limit_monthly ?? 0,
        job_limit: sub?.job_limit ?? 0,
        current_period_end: sub?.current_period_end ?? null,
      };
    });

    return NextResponse.json({ companies: result });
  } catch (err) {
    console.error("GET /api/admin/companies error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
