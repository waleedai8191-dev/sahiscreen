import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  cvSubmittedNotif,
  screeningCompleteNotif,
  usageWarningNotif,
  milestonNotif,
  type AppNotification,
} from "@/lib/supabase/notifications";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    // 1. Auth
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get company_id
    const { data: profile } = await admin
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ notifications: [] });
    }

    const companyId = profile.company_id;
    const notifications: AppNotification[] = [];

    // 3. Recent CV submissions via public apply link (last 10)
    const { data: recentCvs } = await admin
      .from("cv_uploads")
      .select("id, candidate_name, original_filename, created_at, job_id")
      .eq("company_id", companyId)
      .eq("source", "apply_link")
      .order("created_at", { ascending: false })
      .limit(10);

    (recentCvs ?? []).forEach((row) => {
      notifications.push(cvSubmittedNotif(row));
    });

    // 4. Recent completed screenings (last 10)
    const { data: recentScreenings } = await admin
      .from("screening_results")
      .select(
        `
        id, candidate_id, score, recommendation, screened_at, created_at,
        cv_uploads!inner ( candidate_name, company_id )
      `,
      )
      .eq("cv_uploads.company_id", companyId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);

    (recentScreenings ?? []).forEach((row: any) => {
      const candidateName = row.cv_uploads?.candidate_name ?? "Candidate";
      notifications.push(screeningCompleteNotif(row, candidateName));
    });

    // 5. Usage warning — check current subscription
    const { data: sub } = await admin
      .from("subscriptions")
      .select("cv_count_current, cv_limit_monthly")
      .eq("company_id", companyId)
      .maybeSingle();

    if (sub) {
      const pct = sub.cv_count_current / sub.cv_limit_monthly;
      // Only add if at 80%+ threshold
      if (pct >= 0.8) {
        notifications.push(
          usageWarningNotif(sub.cv_count_current, sub.cv_limit_monthly),
        );
      }

      // 6. Milestone check — every 100 CVs screened total
      const totalScreened = sub.cv_count_current;
      if (totalScreened > 0 && totalScreened % 100 === 0) {
        notifications.push(milestonNotif(totalScreened));
      }
    }

    // 7. Sort all by createdAt desc, return top 20
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ notifications: notifications.slice(0, 20) });
  } catch (err: any) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
