import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const admin = createSupabaseAdminClient();
    const body = await req.json();
    const { is_active, role } = body;

    const { data: target } = await admin
      .from("users")
      .select("role")
      .eq("id", id)
      .single();

    if (target?.role === "superadmin") {
      return NextResponse.json(
        { error: "Cannot modify a superadmin account" },
        { status: 403 },
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (is_active !== undefined) updateData.is_active = is_active;
    if (role !== undefined) {
      if (!["admin", "hr", "viewer"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updateData.role = role;
    }

    const { data, error } = await admin
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("user update error:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (err) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const admin = createSupabaseAdminClient();

    // Step 1 — Fetch the target user (need role + company_id)
    const { data: target } = await admin
      .from("users")
      .select("role, company_id")
      .eq("id", id)
      .single();

    if (target?.role === "superadmin") {
      return NextResponse.json(
        { error: "Cannot delete a superadmin account" },
        { status: 403 },
      );
    }

    const companyId = target?.company_id;

    // Step 2 — If user belongs to a company, wipe the entire company
    // (all teammates, all their data, subscription, and company row itself)
    // Think of it as: deleting one tenant triggers eviction of the whole unit
    if (companyId) {
      // 2a. Get all user IDs in this company (to delete their auth accounts later)
      const { data: teammates } = await admin
        .from("users")
        .select("id")
        .eq("company_id", companyId);

      const teammateIds = (teammates ?? []).map((u) => u.id);

      // 2b. Nullify created_by on blind_screenings (FK — can't delete company data while these reference users)
      await admin
        .from("blind_screenings")
        .update({ created_by: null })
        .eq("company_id", companyId);

      // 2c. Nullify created_by on jobs (same FK reason)
      await admin
        .from("jobs")
        .update({ created_by: null })
        .eq("company_id", companyId);

      // 2d. Delete all users in the company (public.users rows)
      await admin.from("users").delete().eq("company_id", companyId);

      // 2e. Delete subscription
      await admin.from("subscriptions").delete().eq("company_id", companyId);

      // 2f. Delete the company itself
      await admin.from("companies").delete().eq("id", companyId);

      // 2g. Delete all teammates from Supabase Auth (loop — admin API has no bulk delete)
      for (const uid of teammateIds) {
        await admin.auth.admin.deleteUser(uid);
      }
    } else {
      // Step 3 — User has no company (edge case: orphaned user)
      // Just nullify their created_by references and delete them alone
      await admin
        .from("blind_screenings")
        .update({ created_by: null })
        .eq("created_by", id);

      await admin
        .from("jobs")
        .update({ created_by: null })
        .eq("created_by", id);

      await admin.from("users").delete().eq("id", id);

      await admin.auth.admin.deleteUser(id);
    }

    // Step 4 — Sweep any companies that now have zero users
    // (catches edge cases where company existed without users before this fix)
    const { data: allCompanies } = await admin.from("companies").select("id");

    for (const company of allCompanies ?? []) {
      const { count } = await admin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);

      if (count === 0) {
        await admin.from("subscriptions").delete().eq("company_id", company.id);

        await admin.from("companies").delete().eq("id", company.id);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/users/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
