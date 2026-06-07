import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── GET /api/blind-screening ─────────────────────────────────────────────────
// Returns all blind screening sessions for the company

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: sessions, error } = await admin
      .from("blind_screenings")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 },
      );
    }

    return NextResponse.json({ sessions: sessions ?? [] });
  } catch (err) {
    console.error("GET /api/blind-screening error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── POST /api/blind-screening ────────────────────────────────────────────────
// Creates a new blind screening session

export async function POST(req: NextRequest) {
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

    if (!profile?.company_id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!["admin", "hr"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { name, description, job_requirements } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Session name is required" },
        { status: 400 },
      );
    }

    const { data: session, error: insertErr } = await admin
      .from("blind_screenings")
      .insert({
        company_id: profile.company_id,
        created_by: user.id,
        name: name.trim(),
        description: description?.trim() ?? null,
        job_requirements: job_requirements?.trim() ?? null,
        status: "active",
        cv_count: 0,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("blind screening insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("POST /api/blind-screening error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
