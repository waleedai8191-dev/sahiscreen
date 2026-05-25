// import { createServerClient } from "@supabase/ssr";
// import { createClient } from "@supabase/supabase-js";
// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
// import type { User, Session } from "@supabase/supabase-js";

// // ─── Types ────────────────────────────────────────────────

// export type AuthUser = User;
// export type AuthSession = Session;

// export interface UserProfile {
//   id: string;
//   email: string;
//   full_name: string | null;
//   company_id: string | null;
//   company_name: string | null;
//   role: "admin" | "hr" | "viewer";
//   avatar_url: string | null;
//   created_at: string;
// }

// export interface SubscriptionStatus {
//   plan: "trial" | "essential" | "premium" | "expired" | "cancelled";
//   status: "active" | "trialing" | "paused" | "cancelled" | "expired";
//   trial_ends_at: string | null;
//   current_period_end: string | null;
//   cvs_used_this_month: number;
//   cv_limit: number;
// }

// export interface AuthResult {
//   user: AuthUser | null;
//   session: AuthSession | null;
//   error: string | null;
// }

// // ─── Plan limits ──────────────────────────────────────────

// export const PLAN_LIMITS = {
//   trial: { cv_limit: 50, label: "Free Trial", ai_model: "gemini" },
//   essential: { cv_limit: 1000, label: "Essential", ai_model: "gemini" },
//   premium: { cv_limit: 2000, label: "Premium", ai_model: "claude" },
//   expired: { cv_limit: 0, label: "Expired", ai_model: null },
//   cancelled: { cv_limit: 0, label: "Cancelled", ai_model: null },
// } as const;

// // ─── Server-side Supabase client (SSR) ───────────────────

// /**
//  * Creates a Supabase client bound to the incoming request cookies.
//  * Use this in Server Components, Route Handlers, and Middleware.
//  */
// export async function createSupabaseServerClient() {
//   const cookieStore = await cookies();
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name: string) {
//           return cookieStore.get(name)?.value;
//         },
//         set(name: string, value: string, options: any) {
//           try {
//             cookieStore.set({ name, value, ...options });
//           } catch {}
//         },
//         remove(name: string, options: any) {
//           try {
//             cookieStore.set({ name, value: "", ...options });
//           } catch {}
//         },
//       },
//     },
//   );
// }

// /**
//  * Service-role admin client — bypasses RLS.
//  * ONLY use in trusted server-side code (webhooks, migrations).
//  * NEVER expose to client.
//  */
// export function createSupabaseAdminClient() {
//   return createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!,
//     {
//       auth: {
//         autoRefreshToken: false,
//         persistSession: false,
//       },
//     },
//   );
// }

// // ─── Session helpers ──────────────────────────────────────

// /**
//  * Get current session — server-side.
//  * Returns null if not authenticated.
//  */
// export async function getSession(): Promise<AuthSession | null> {
//   const supabase = await createSupabaseServerClient();
//   const {
//     data: { session },
//     error,
//   } = await supabase.auth.getSession();
//   if (error) return null;
//   return session;
// }

// /**
//  * Get current user — server-side.
//  * Returns null if not authenticated.
//  */
// export async function getCurrentUser(): Promise<AuthUser | null> {
//   const supabase = await createSupabaseServerClient();
//   const {
//     data: { user },
//     error,
//   } = await supabase.auth.getUser();
//   if (error) return null;
//   return user;
// }

// /**
//  * Require authentication in a Server Component or Route Handler.
//  * Redirects to /login if not authenticated.
//  */
// export async function requireAuth(): Promise<AuthUser> {
//   const user = await getCurrentUser();
//   if (!user) redirect("/login");
//   return user;
// }

// /**
//  * Require that the user is NOT authenticated.
//  * Redirects to /dashboard if already signed in.
//  * Use in login/register pages.
//  */
// export async function requireGuest(): Promise<void> {
//   const user = await getCurrentUser();
//   if (user) redirect("/dashboard");
// }

// // ─── Profile helpers ──────────────────────────────────────

// /**
//  * Fetch full user profile joined with company.
//  * Used in dashboard layouts and settings.
//  */
// export async function getUserProfile(
//   userId: string,
// ): Promise<UserProfile | null> {
//   const supabase = await createSupabaseServerClient();
//   const { data, error } = await supabase
//     .from("users")
//     .select(
//       `
//       id,
//       email,
//       full_name,
//       role,
//       avatar_url,
//       created_at,
//       company_id,
//       companies (
//         name
//       )
//     `,
//     )
//     .eq("id", userId)
//     .single();

//   if (error || !data) return null;

//   return {
//     id: data.id,
//     email: data.email,
//     full_name: data.full_name,
//     company_id: data.company_id,
//     company_name: (data.companies as any)?.name ?? null,
//     role: data.role,
//     avatar_url: data.avatar_url,
//     created_at: data.created_at,
//   };
// }

// /**
//  * Get company_id for the current authenticated user.
//  * Used in every API route to scope queries.
//  */
// export async function getCompanyId(userId: string): Promise<string | null> {
//   const supabase = await createSupabaseServerClient();
//   const { data, error } = await supabase
//     .from("users")
//     .select("company_id")
//     .eq("id", userId)
//     .single();
//   if (error || !data) return null;
//   return data.company_id;
// }

// // ─── Subscription helpers ─────────────────────────────────

// /**
//  * Get subscription status for a company.
//  * Used in billing page, AI router, and usage checks.
//  */
// export async function getSubscriptionStatus(
//   companyId: string,
// ): Promise<SubscriptionStatus | null> {
//   const supabase = await createSupabaseServerClient();
//   const { data, error } = await supabase
//     .from("subscriptions")
//     .select("*")
//     .eq("company_id", companyId)
//     .single();

//   if (error || !data) return null;

//   const plan = data.plan as keyof typeof PLAN_LIMITS;
//   const limit = PLAN_LIMITS[plan]?.cv_limit ?? 0;

//   return {
//     plan,
//     status: data.status,
//     trial_ends_at: data.trial_ends_at,
//     current_period_end: data.current_period_end,
//     cvs_used_this_month: data.cvs_used_this_month ?? 0,
//     cv_limit: limit,
//   };
// }

// /**
//  * Check if a company can screen more CVs this month.
//  * Returns true if under limit, false if over.
//  */
// export async function canScreenCV(companyId: string): Promise<boolean> {
//   const sub = await getSubscriptionStatus(companyId);
//   if (!sub) return false;
//   if (sub.status === "expired" || sub.status === "cancelled") return false;
//   if (sub.cvs_used_this_month >= sub.cv_limit) return false;
//   return true;
// }

// /**
//  * Get the AI model to use for a company based on their plan.
//  * Essential → Gemini, Premium → Claude
//  */
// export async function getAIModelForCompany(
//   companyId: string,
// ): Promise<"gemini" | "claude" | null> {
//   const sub = await getSubscriptionStatus(companyId);
//   if (!sub) return null;
//   if (sub.status === "expired" || sub.status === "cancelled") return null;
//   const plan = sub.plan as keyof typeof PLAN_LIMITS;
//   return (PLAN_LIMITS[plan]?.ai_model as "gemini" | "claude" | null) ?? null;
// }

// /**
//  * Check if trial has expired for a company.
//  */
// export async function isTrialExpired(companyId: string): Promise<boolean> {
//   const sub = await getSubscriptionStatus(companyId);
//   if (!sub) return true;
//   if (sub.plan !== "trial") return false;
//   if (!sub.trial_ends_at) return true;
//   return new Date(sub.trial_ends_at) < new Date();
// }

// // ─── Sign out ─────────────────────────────────────────────

// /**
//  * Sign out the current user server-side.
//  * Clears session cookies and redirects to /login.
//  */
// export async function signOut(): Promise<void> {
//   const supabase = await createSupabaseServerClient();
//   await supabase.auth.signOut();
//   redirect("/login");
// }

// // ─── Auth callback handler ────────────────────────────────

// /**
//  * Exchange OAuth code for session.
//  * Used in app/auth/callback/route.ts for Google OAuth.
//  *
//  * Create this file:
//  * app/auth/callback/route.ts
//  * ─────────────────────────
//  * import { createSupabaseServerClient } from "@/lib/auth";
//  * import { NextResponse } from "next/server";
//  *
//  * export async function GET(request: Request) {
//  *   const { searchParams, origin } = new URL(request.url);
//  *   const code = searchParams.get("code");
//  *   const next = searchParams.get("next") ?? "/dashboard";
//  *
//  *   if (code) {
//  *     const supabase = await createSupabaseServerClient();
//  *     const { error } = await supabase.auth.exchangeCodeForSession(code);
//  *     if (!error) return NextResponse.redirect(`${origin}${next}`);
//  *   }
//  *
//  *   return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
//  * }
//  */
// export async function handleAuthCallback(code: string): Promise<boolean> {
//   const supabase = await createSupabaseServerClient();
//   const { error } = await supabase.auth.exchangeCodeForSession(code);
//   return !error;
// }

// // ─── New user setup ───────────────────────────────────────

// /**
//  * Called after a new user signs up (via webhook or API route).
//  * Creates company + user row + trial subscription.
//  * Uses admin client to bypass RLS for initial setup.
//  */
// export async function setupNewUser({
//   userId,
//   email,
//   fullName,
//   companyName,
// }: {
//   userId: string;
//   email: string;
//   fullName: string;
//   companyName: string;
// }): Promise<{ companyId: string } | null> {
//   const admin = createSupabaseAdminClient();

//   // 1. Create company
//   const { data: company, error: companyError } = await admin
//     .from("companies")
//     .insert({ name: companyName, created_by: userId })
//     .select("id")
//     .single();

//   if (companyError || !company) return null;

//   const companyId = company.id;

//   // 2. Create user row
//   const { error: userError } = await admin.from("users").insert({
//     id: userId,
//     email,
//     full_name: fullName,
//     company_id: companyId,
//     role: "admin",
//   });

//   if (userError) return null;

//   // 3. Create 14-day trial subscription
//   const trialEnd = new Date();
//   trialEnd.setDate(trialEnd.getDate() + 14);

//   const { error: subError } = await admin.from("subscriptions").insert({
//     company_id: companyId,
//     plan: "trial",
//     status: "trialing",
//     trial_ends_at: trialEnd.toISOString(),
//     cv_limit: PLAN_LIMITS.trial.cv_limit,
//     cvs_used_this_month: 0,
//   });

//   if (subError) return null;

//   return { companyId };
// }

// // ─── Role helpers ─────────────────────────────────────────

// /**
//  * Check if a user has a specific role.
//  */
// export async function hasRole(
//   userId: string,
//   role: UserProfile["role"],
// ): Promise<boolean> {
//   const profile = await getUserProfile(userId);
//   if (!profile) return false;
//   return profile.role === role;
// }

// /**
//  * Require admin role. Redirects to /dashboard if not admin.
//  */
// export async function requireAdmin(): Promise<AuthUser> {
//   const user = await requireAuth();
//   const isAdmin = await hasRole(user.id, "admin");
//   if (!isAdmin) redirect("/dashboard");
//   return user;
// }

// // ─── Usage tracking ───────────────────────────────────────

// /**
//  * Increment CV screening count for a company.
//  * Called after every successful CV screen.
//  */
// export async function incrementCVUsage(companyId: string): Promise<void> {
//   const admin = createSupabaseAdminClient();
//   await admin.rpc("increment_cv_usage", { p_company_id: companyId });
// }

// /**
//  * Get remaining CV quota for a company this month.
//  */
// export async function getRemainingCVQuota(companyId: string): Promise<number> {
//   const sub = await getSubscriptionStatus(companyId);
//   if (!sub) return 0;
//   return Math.max(0, sub.cv_limit - sub.cvs_used_this_month);
// }

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// ─── SERVER CLIENT (uses session cookies) ────────────────
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

// ─── ADMIN CLIENT (service role — server only) ───────────
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// ─── SETUP NEW USER ──────────────────────────────────────
// Called after BOTH email signup AND Google OAuth
// Creates: company → user row → subscription (trial)
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
      console.error("setupNewUser: company insert failed", companyError);
      return null;
    }

    // 2. Create user row linked to company
    const { error: userError } = await admin.from("users").insert({
      id: userId,
      company_id: company.id,
      full_name: fullName,
      email: email,

      role: "admin", // First user of a company is always admin
    });

    if (userError) {
      // Rollback company
      await admin.from("companies").delete().eq("id", company.id);
      console.error("setupNewUser: user insert failed", userError);
      return null;
    }

    // 3. Create trial subscription
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
      // Rollback both
      await admin.from("users").delete().eq("id", userId);
      await admin.from("companies").delete().eq("id", company.id);
      console.error("setupNewUser: subscription insert failed", subError);
      return null;
    }

    return { companyId: company.id };
  } catch (err) {
    console.error("setupNewUser: unexpected error", err);
    return null;
  }
}
