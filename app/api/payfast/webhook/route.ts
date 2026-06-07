import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyITN, type PayFastITN } from "@/lib/payfast";
import { getPlan } from "@/lib/plans";

export async function POST(req: NextRequest) {
  console.log("[PayFast ITN] Received webhook");

  try {
    // ── Parse ITN data ──
    const body = await req.text();
    const params = new URLSearchParams(body);
    const itnData: Record<string, string> = {};
    params.forEach((value, key) => {
      itnData[key] = value;
    });

    console.log("[PayFast ITN] Data:", JSON.stringify(itnData, null, 2));

    // ── Get request IP ──
    const requestIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    // ── Verify ITN ──
    const { valid, reason } = await verifyITN(itnData, requestIp);

    if (!valid) {
      console.error("[PayFast ITN] Verification failed:", reason);
      // Return 200 to PayFast even on failure
      // (returning 4xx causes PayFast to retry repeatedly)
      return new NextResponse("INVALID", { status: 200 });
    }

    // ── Extract fields ──
    const paymentStatus = itnData.payment_status;
    const companyId = itnData.custom_str1;
    const planTier = itnData.custom_str2;
    const userId = itnData.custom_str3;
    const pfPaymentId = itnData.pf_payment_id;
    const internalPaymentId = itnData.m_payment_id;
    const amountGross = parseFloat(itnData.amount_gross ?? "0");

    if (!companyId || !planTier) {
      console.error("[PayFast ITN] Missing custom fields");
      return new NextResponse("MISSING_FIELDS", { status: 200 });
    }

    const admin = createSupabaseAdminClient();
    const plan = getPlan(planTier);

    // ── Handle payment status ──
    if (paymentStatus === "COMPLETE") {
      console.log(
        `[PayFast ITN] Payment COMPLETE for company ${companyId}, plan ${planTier}`,
      );

      // ── Update subscription ──
      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: subError } = await admin
        .from("subscriptions")
        .update({
          plan_tier: plan.tier,
          status: "active",
          payment_status: "paid",
          payfast_payment_id: pfPaymentId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cv_limit_monthly: plan.cvLimit, // ← restore limits after payment
          job_limit: plan.jobLimit, // ← restore limits after payment
          updated_at: now.toISOString(),
        })
        .eq("company_id", companyId);

      if (subError) {
        console.error("[PayFast ITN] Subscription update failed:", subError);
        return new NextResponse("DB_ERROR", { status: 200 });
      }

      // ── Update billing history ──
      await admin
        .from("billing_history")
        .update({
          status: "paid",
          payfast_payment_id: pfPaymentId,
          amount: Math.round(amountGross),
          paid_at: now.toISOString(),
        })
        .eq("internal_payment_id", internalPaymentId);

      console.log(
        `[PayFast ITN] ✅ Subscription activated for company ${companyId}`,
      );
    } else if (paymentStatus === "FAILED") {
      console.log(`[PayFast ITN] Payment FAILED for company ${companyId}`);

      await admin
        .from("billing_history")
        .update({ status: "failed" })
        .eq("internal_payment_id", internalPaymentId);

      // Keep subscription on current plan — don't downgrade here
      // User will see failed state on billing page
    } else if (paymentStatus === "CANCELLED") {
      console.log(`[PayFast ITN] Payment CANCELLED for company ${companyId}`);

      await admin
        .from("billing_history")
        .update({ status: "cancelled" })
        .eq("internal_payment_id", internalPaymentId);
    }

    // ── Always return 200 to PayFast ──
    return new NextResponse("OK", { status: 200 });
  } catch (err: any) {
    console.error("[PayFast ITN] Unexpected error:", err);
    // Still return 200 — PayFast retries on non-200
    return new NextResponse("ERROR", { status: 200 });
  }
}
