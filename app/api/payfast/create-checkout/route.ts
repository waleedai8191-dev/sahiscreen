import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { buildPaymentData } from "@/lib/payfast";
import { getPlan, isPaidPlan, type PlanTier } from "@/lib/plans";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { planTier, companyId } = await req.json();

    // ── Validate inputs ──
    if (!planTier || !companyId) {
      return NextResponse.json(
        { error: "planTier and companyId are required" },
        { status: 400 },
      );
    }

    const plan = getPlan(planTier);

    if (!isPaidPlan(plan.tier as PlanTier)) {
      return NextResponse.json(
        { error: "Free plan does not require payment" },
        { status: 400 },
      );
    }

    // ── Auth check ──
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Get user profile ──
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("full_name, email, company_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Security: verify company belongs to user ──
    if (profile.company_id !== companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ── Build payment ID ──
    const internalPaymentId = `sahi_${companyId}_${plan.tier}_${Date.now()}`;

    // ── Parse name ──
    const nameParts = (profile.full_name ?? "SahiScreen User").split(" ");
    const firstName = nameParts[0] ?? "User";
    const lastName = nameParts.slice(1).join(" ") || "-";

    // ── Build PayFast payment data ──
    const { url, data } = buildPaymentData({
      companyId,
      userId: user.id,
      planTier: plan.tier,
      planName: plan.name,
      amount: plan.price, // PKR e.g. 14999
      userFirstName: firstName,
      userLastName: lastName,
      userEmail: profile.email ?? user.email!,
      internalPaymentId,
    });

    // ── Store pending payment record ──
    await admin.from("billing_history").insert({
      company_id: companyId,
      amount: plan.price,
      plan_tier: plan.tier,
      status: "pending",
      internal_payment_id: internalPaymentId,
    });

    return NextResponse.json({
      success: true,
      url, // PayFast URL
      data, // form fields to POST
      paymentId: internalPaymentId,
    });
  } catch (err: any) {
    console.error("[create-checkout] error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
