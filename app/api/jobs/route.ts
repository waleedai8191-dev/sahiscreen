import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import sanitizeHtml from "sanitize-html";

// ── Sanitize config ───────────────────────────────────────────────────────────
// Plain text fields — strip ALL HTML tags
const sanitizePlain = (str: string): string =>
  sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} }).trim();

// Rich text fields — allow safe formatting only
const sanitizeRich = (str: string): string =>
  sanitizeHtml(str, {
    allowedTags: ["b", "i", "ul", "ol", "li", "p", "br", "strong", "em"],
    allowedAttributes: {},
  }).trim();

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

    const [jobsResult, activeResult, draftResult, closedResult] =
      await Promise.all([
        query,
        admin
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", profile.company_id)
          .eq("status", "active"),
        admin
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", profile.company_id)
          .eq("status", "draft"),
        admin
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", profile.company_id)
          .eq("status", "closed"),
      ]);

    if (jobsResult.error) {
      console.error("jobs fetch error:", jobsResult.error);
      return NextResponse.json(
        { error: "Failed to fetch jobs" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      jobs: jobsResult.data ?? [],
      counts: {
        total:
          (activeResult.count ?? 0) +
          (draftResult.count ?? 0) +
          (closedResult.count ?? 0),
        active: activeResult.count ?? 0,
        draft: draftResult.count ?? 0,
        closed: closedResult.count ?? 0,
      },
    });
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
      responsibilities,
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
        title: sanitizePlain(title), // ← plain text
        slug,
        department: department ? sanitizePlain(department) : null,
        location: location ? sanitizePlain(location) : null,
        employment_type: employment_type ?? "full_time",
        experience_level: experience_level ?? "mid",
        description: description ? sanitizeRich(description) : null,
        requirements: requirements ? sanitizeRich(requirements) : null,
        responsibilities: responsibilities
          ? sanitizeRich(responsibilities)
          : null,
        skills: (skills ?? []).map(sanitizePlain),
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
