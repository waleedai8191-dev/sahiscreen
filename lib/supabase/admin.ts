import { createClient } from "@supabase/supabase-js";

// ─── ADMIN CLIENT ────────────────────────────────────────

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

// ─── SETUP NEW USER ──────────────────────────────────────

export async function setupNewUser({
  userId,
  email,
  fullName,
  companyName,
  planTier = "free",
}: {
  userId: string;
  email: string;
  fullName: string;
  companyName: string;
  planTier?: string;
}): Promise<{ companyId: string } | null> {
  const admin = createSupabaseAdminClient();

  try {
    // 1. Create company
    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({ name: companyName })
      .select("id")
      .single();

    if (companyError || !company) {
      console.error("company insert failed", companyError);
      return null;
    }

    // 2. Create user
    // 2. Create or update user (trigger may have already created the row)
    const { error: userError } = await admin.from("users").upsert(
      {
        id: userId,
        company_id: company.id,
        full_name: fullName,
        email,
        role: "admin",
      },
      { onConflict: "id" },
    );

    if (userError) {
      await admin.from("companies").delete().eq("id", company.id);

      console.error("user insert failed", userError);

      return null;
    }

    // 3. Create subscription
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { getPlan, isPaidPlan } = await import("@/lib/plans");
    const plan = getPlan(planTier);
    const isPaid = isPaidPlan(plan.tier);

    const { error: subError } = await admin.from("subscriptions").insert({
      company_id: company.id,
      plan_tier: plan.tier,
      status: isPaid ? "pending_payment" : "active",
      payment_status: isPaid ? "unpaid" : "unpaid",
      // plan_selected_at: now,
      trial_start: null,
      trial_end: null,
      cv_count_current: 0,
      cv_limit_monthly: isPaid ? 0 : plan.cvLimit, // 0 until paid
      job_limit: isPaid ? 0 : plan.jobLimit, // 0 until paid
    });
    if (subError) {
      await admin.from("users").delete().eq("id", userId);

      await admin.from("companies").delete().eq("id", company.id);

      console.error("subscription insert failed", subError);

      return null;
    }

    return {
      companyId: company.id,
    };
  } catch (err) {
    console.error("setupNewUser unexpected error", err);

    return null;
  }
}
