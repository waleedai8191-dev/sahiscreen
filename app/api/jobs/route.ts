import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── Helper: generate slug from title ────────────────────────────────────────

function generateSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  const suffix = id.replace(/-/g, "").slice(0, 6);
  return `${base}-${suffix}`;
}

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
// Returns all jobs for the logged-in user's company.
// Supports optional ?status=active|draft|closed filter.

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    // 1. Verify auth
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's company_id from users table
    const { data: profile } = await admin
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // 3. Build query — filter by company, optional status
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    let query = admin
      .from("jobs")
      .select(
        `
        id,
        title,
        slug,
        department,
        location,
        employment_type,
        experience_level,
        status,
        skills,
        candidate_count,
        screened_count,
        created_at,
        updated_at
      `,
      )
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (statusFilter && ["active", "draft", "closed"].includes(statusFilter)) {
      query = query.eq("status", statusFilter);
    }

    const { data: jobs, error: jobsErr } = await query;

    if (jobsErr) {
      console.error("jobs fetch error:", jobsErr);
      return NextResponse.json(
        { error: "Failed to fetch jobs" },
        { status: 500 },
      );
    }

    return NextResponse.json({ jobs: jobs ?? [] });
  } catch (err) {
    console.error("GET /api/jobs error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    // 1. Verify auth
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (!user || authErr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get profile — check role
    const { data: profile } = await admin
      .from("users")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    if (!["admin", "hr"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // 3. Parse and validate body
    const body = await req.json();
    const {
      title,
      department,
      location,
      employment_type,
      experience_level,
      description,
      requirements,
      skills,
      salary_min,
      salary_max,
      status = "draft",
    } = body;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json(
        { error: "Job title is required" },
        { status: 400 },
      );
    }

    // 4. Insert job — get the UUID first to build the slug
    const jobId = crypto.randomUUID();
    const slug = generateSlug(title.trim(), jobId);

    const { data: job, error: insertErr } = await admin
      .from("jobs")
      .insert({
        id: jobId,
        company_id: profile.company_id,
        created_by: user.id,
        title: title.trim(),
        slug,
        department: department ?? null,
        location: location ?? null,
        employment_type: employment_type ?? "full-time",
        experience_level: experience_level ?? "mid",
        description: description ?? null,
        requirements: requirements ?? null,
        skills: skills ?? [],
        salary_min: salary_min ?? null,
        salary_max: salary_max ?? null,
        status: ["draft", "active"].includes(status) ? status : "draft",
        candidate_count: 0,
        screened_count: 0,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("job insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to create job" },
        { status: 500 },
      );
    }

    // 5. Return the created job including the generated slug
    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    console.error("POST /api/jobs error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
