import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "./admin";

// ─── SERVER CLIENT ───────────────────────────────────────

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}

// ─── REQUIRE AUTH ────────────────────────────────────────

export async function requireAuth() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  }

  return user;
}

// ─── GET USER PROFILE ────────────────────────────────────

export async function getUserProfile(userId: string) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("users")
    .select("*, companies(*)")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("getUserProfile failed", error);
    return null;
  }

  return data;
}

// ─── GET SUBSCRIPTION STATUS ─────────────────────────────

export async function getSubscriptionStatus(companyId: string) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error || !data) {
    console.error("subscription fetch failed", error);
    return null;
  }

  const now = new Date();
  const trialEnd = data.trial_end ? new Date(data.trial_end) : null;
  const isTrialExpired = trialEnd ? trialEnd < now : false;

  return {
    plan: isTrialExpired
      ? "expired"
      : data.status === "trial"
        ? "trial"
        : data.plan_tier,

    status: isTrialExpired ? "expired" : data.status,

    trial_ends_at: data.trial_end ?? null,

    cv_limit: data.cv_limit_monthly ?? 0,

    cvs_used_this_month: data.cv_count_current ?? 0,
  };
}

export type UserProfile = Awaited<ReturnType<typeof getUserProfile>>;

export type SubscriptionStatus = Awaited<
  ReturnType<typeof getSubscriptionStatus>
>;
