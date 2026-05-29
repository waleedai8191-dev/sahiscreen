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
}: {
  userId: string;
  email: string;
  fullName: string;
  companyName: string;
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
    const { error: userError } = await admin.from("users").insert({
      id: userId,
      company_id: company.id,
      full_name: fullName,
      email,
      role: "admin",
    });

    if (userError) {
      await admin.from("companies").delete().eq("id", company.id);

      console.error("user insert failed", userError);

      return null;
    }

    // 3. Create subscription
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { error: subError } = await admin.from("subscriptions").insert({
      company_id: company.id,
      plan_tier: "essential",
      status: "trial",
      trial_start: new Date().toISOString(),
      trial_end: trialEnd.toISOString(),
      cv_count_current: 0,
      cv_limit_monthly: 50,
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
