import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  cvSubmittedNotif,
  screeningCompleteNotif,
  usageWarningNotif,
  milestonNotif,
  type AppNotification,
  relativeTime,
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

    // 7. Upsert generated notifications into DB (preserves read/deleted state)
    if (notifications.length > 0) {
      await admin.from("notifications").upsert(
        notifications.map((n) => ({
          id: n.id,
          company_id: companyId,
          user_id: user.id,
          type: n.type,
          title: n.title,
          message: n.message,
          created_at: n.createdAt.toISOString(),
        })),
        {
          onConflict: "id",
          ignoreDuplicates: true, // never overwrite read/deleted state
        },
      );
    }

    // 8. Now read back from DB — this gives us the real read/deleted state
    const { data: persisted } = await admin
      .from("notifications")
      .select("id, type, title, message, read, created_at")
      .eq("company_id", companyId)
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(20);

    const final = (persisted ?? []).map((n) => ({
      id: n.id,
      type: n.type as AppNotification["type"],
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: new Date(n.created_at),
      time: relativeTime(new Date(n.created_at)),
    }));

    return NextResponse.json({ notifications: final });
  } catch (err: any) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} // PATCH /api/notifications
// Body: { ids: string[] } — mark specific IDs as read
// Body: { all: true }    — mark all as read for this company
export async function PATCH(req: NextRequest) {
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
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await req.json();

    if (body.all === true) {
      // Mark all read for this company
      await admin
        .from("notifications")
        .update({ read: true })
        .eq("company_id", profile.company_id)
        .eq("deleted", false);
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      // Mark specific IDs read
      await admin
        .from("notifications")
        .update({ read: true })
        .in("id", body.ids)
        .eq("company_id", profile.company_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/notifications
// Body: { id: string }   — delete one notification
// Body: { all: true }    — delete all read notifications
export async function DELETE(req: NextRequest) {
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
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await req.json();

    if (body.all === true) {
      // Soft delete all read notifications
      await admin
        .from("notifications")
        .update({ deleted: true })
        .eq("company_id", profile.company_id)
        .eq("read", true);
    } else if (body.id) {
      // Soft delete one
      await admin
        .from("notifications")
        .update({ deleted: true })
        .eq("id", body.id)
        .eq("company_id", profile.company_id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
