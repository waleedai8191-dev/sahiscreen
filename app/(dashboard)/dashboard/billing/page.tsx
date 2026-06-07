"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X,
  Zap,
  CreditCard,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PLANS, type PlanTier } from "@/lib/plans";

// ── Types ──────────────────────────────────────────────────────────────────
interface Subscription {
  plan_tier: PlanTier;
  status: string;
  payment_status: string;
  cv_limit_monthly: number;
  cv_count_current: number;
  job_limit: number;
  trial_end: string | null;
  current_period_end: string | null;
}

interface BillingRecord {
  id: string;
  amount: number;
  plan_tier: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysLeft(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000),
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [upgrading, setUpgrading] = useState<PlanTier | null>(null);
  const [error, setError] = useState("");

  const [paymentResult, setPaymentResult] = useState<string | null>(null);
  const [welcomeMode, setWelcomeMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPaymentResult(params.get("payment"));
    setWelcomeMode(params.get("welcome") === "true");
  }, []);

  const load = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;
    setCompanyId(profile.company_id);

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("company_id", profile.company_id)
      .single();

    setSubscription(sub);

    const { data: history } = await supabase
      .from("billing_history")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(10);

    setBillingHistory(history ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (paymentResult === "success") {
      load();
    }
  }, [paymentResult]);
  const handleUpgrade = async (targetPlan: PlanTier) => {
    if (!companyId) return;
    setUpgrading(targetPlan);
    setError("");

    try {
      const res = await fetch("/api/payfast/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: targetPlan,
          companyId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create checkout");
        setUpgrading(null);
        return;
      }

      // Build and auto-submit form to PayFast
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.url;

      Object.entries(data.data).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      setUpgrading(null);
    }
  };

  const currentPlan = PLANS[subscription?.plan_tier ?? "free"];
  const usagePercent = subscription
    ? Math.min(
        (subscription.cv_count_current / subscription.cv_limit_monthly) * 100,
        100,
      )
    : 0;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <Loader2 size={24} color="#7c3aed" className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .billing-page {
          min-height: 100%;
          background: #f8fafc;
          padding: 28px 32px 48px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .reveal-1 { animation-delay: 0.05s; }
        .reveal-2 { animation-delay: 0.12s; }
        .reveal-3 { animation-delay: 0.19s; }
        .reveal-4 { animation-delay: 0.26s; }

        /* ── Page header ── */
        .billing-header { margin-bottom: 28px; }
        .billing-title {
          font-size: 24px; font-weight: 800; color: #0f172a;
          letter-spacing: -0.5px; margin-bottom: 4px;
        }
        .billing-sub { font-size: 14px; color: #64748b; font-weight: 500; }

        /* ── Alert banners ── */
        .alert-banner {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 18px; border-radius: 12px;
          margin-bottom: 20px; font-size: 13px; font-weight: 500;
        }
        .alert-success {
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2);
          color: #15803d;
        }
        .alert-error {
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.2);
          color: #dc2626;
        }
        .alert-warning {
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.2);
          color: #b45309;
        }

        /* ── Card shared ── */
        .b-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .b-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid #f1f5f9;
        }
        .b-card-title { font-size: 14px; font-weight: 700; color: #0f172a; }
        .b-card-sub { font-size: 12px; color: #94a3b8; margin-top: 1px; }

        /* ── Current plan card ── */
        .current-plan-body { padding: 20px; }

        .plan-status-row {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 16px;
          flex-wrap: wrap; gap: 12px;
        }

        .plan-name-big {
          font-size: 22px; font-weight: 800; color: #0f172a;
          letter-spacing: -0.5px;
        }

        .status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 100px;
          font-size: 12px; font-weight: 700;
        }
        .status-pill.active {
          background: rgba(34,197,94,0.1); color: #15803d;
        }
        .status-pill.trial {
          background: rgba(124,58,237,0.1); color: #7c3aed;
        }
        .status-pill.expired {
          background: rgba(239,68,68,0.1); color: #dc2626;
        }

        /* Usage bar */
        .usage-section { margin-bottom: 16px; }
        .usage-row {
          display: flex; justify-content: space-between;
          margin-bottom: 6px;
        }
        .usage-label { font-size: 12px; color: #64748b; font-weight: 500; }
        .usage-count { font-size: 12px; font-weight: 700; color: #0f172a; }
        .usage-track {
          height: 6px; background: #f1f5f9;
          border-radius: 99px; overflow: hidden;
        }
        .usage-fill {
          height: 100%; border-radius: 99px;
          transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
        }

        /* Plan meta */
        .plan-meta-row {
          display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px;
        }
        .plan-meta-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 8px; padding: 5px 10px;
          font-size: 12px; font-weight: 600; color: #374151;
        }

        /* ── Plans grid ── */
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 20px;
        }

        .plan-option {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px;
          position: relative;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }

        .plan-option:hover {
          border-color: #c4b5fd;
          box-shadow: 0 4px 16px rgba(124,58,237,0.1);
          transform: translateY(-1px);
        }

        .plan-option.current-plan {
          border-color: #7c3aed;
          background: rgba(124,58,237,0.02);
        }

        .plan-option.premium-plan {
          border-color: #e2e8f0;
        }

        .plan-option-badge {
          position: absolute; top: -1px; right: 14px;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          color: #fff; font-size: 9px; font-weight: 800;
          letter-spacing: 0.5px; text-transform: uppercase;
          padding: 3px 8px; border-radius: 0 0 6px 6px;
        }

        .plan-option-name {
          font-size: 15px; font-weight: 800; color: #0f172a;
          margin-bottom: 4px;
        }

        .plan-option-price {
          font-size: 20px; font-weight: 800; color: #0f172a;
          letter-spacing: -0.5px; margin-bottom: 12px;
        }

        .plan-option-price span {
          font-size: 13px; font-weight: 500; color: #94a3b8;
        }

        .plan-option-features {
          list-style: none; margin-bottom: 16px;
          display: flex; flex-direction: column; gap: 6px;
        }

        .plan-option-feature {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 500; color: #374151;
        }

        .plan-option-feature.excluded { color: #cbd5e1; }

        /* Plan action buttons */
        .btn-current {
          width: 100%; padding: 9px;
          background: rgba(124,58,237,0.06);
          border: 1.5px solid rgba(124,58,237,0.2);
          border-radius: 8px; font-size: 12px; font-weight: 700;
          color: #7c3aed; font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: default;
        }

        .btn-upgrade {
          width: 100%; padding: 9px;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          border: none; border-radius: 8px;
          font-size: 12px; font-weight: 700; color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(124,58,237,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
          display: flex; align-items: center;
          justify-content: center; gap: 5px;
        }

        .btn-upgrade:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 5px 16px rgba(124,58,237,0.4);
        }

        .btn-upgrade:disabled {
          opacity: 0.7; cursor: not-allowed; transform: none;
        }

        .btn-downgrade {
          width: 100%; padding: 9px;
          background: #fff; border: 1.5px solid #e2e8f0;
          border-radius: 8px; font-size: 12px; font-weight: 600;
          color: #64748b; font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .btn-downgrade:hover {
          border-color: #94a3b8; color: #374151;
        }

        /* ── Billing history ── */
        .history-row {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 13px 20px;
          border-bottom: 1px solid #f8fafc;
          font-size: 13px;
        }
        .history-row:last-child { border-bottom: none; }

        .history-left { display: flex; align-items: center; gap: 12px; }

        .history-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .history-plan { font-weight: 600; color: #0f172a; }
        .history-date { font-size: 12px; color: #94a3b8; margin-top: 1px; }

        .history-amount { font-weight: 700; color: #0f172a; }

        .history-status {
          font-size: 11px; font-weight: 700;
          padding: 2px 8px; border-radius: 20px;
        }
        .history-status.paid {
          background: rgba(34,197,94,0.1); color: #15803d;
        }
        .history-status.pending {
          background: rgba(245,158,11,0.1); color: #b45309;
        }
        .history-status.failed {
          background: rgba(239,68,68,0.1); color: #dc2626;
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .plans-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .billing-page { padding: 20px 16px 40px; }
        }
      `}</style>

      <div className="billing-page">
        {/* Header */}
        <div className="billing-header reveal reveal-1">
          <div className="billing-title">Billing & Subscription</div>
          <div className="billing-sub">
            Manage your plan, usage and payment history
          </div>
        </div>

        {/* Payment result banners */}
        {paymentResult === "success" && (
          <div className="alert-banner alert-success reveal reveal-1">
            <CheckCircle2 size={16} />
            Payment successful! Your plan has been upgraded.
          </div>
        )}
        {paymentResult === "cancelled" && (
          <div className="alert-banner alert-warning reveal reveal-1">
            <AlertCircle size={16} />
            Payment was cancelled. Your current plan remains active.
          </div>
        )}
        {welcomeMode && (
          <div className="alert-banner alert-success reveal reveal-1">
            <Sparkles size={16} />
            Welcome! Your workspace is ready. Choose a plan to get started.
          </div>
        )}
        {error && (
          <div className="alert-banner alert-error reveal reveal-1">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Current Plan Card */}
        <div className="b-card reveal reveal-2">
          <div className="b-card-header">
            <div>
              <div className="b-card-title">Current Plan</div>
              <div className="b-card-sub">Your active subscription details</div>
            </div>
            <CreditCard size={18} color="#94a3b8" />
          </div>

          <div className="current-plan-body">
            <div className="plan-status-row">
              <div className="plan-name-big">{currentPlan.name}</div>
              <div className="flex items-center gap-2">
                <span
                  className={`status-pill ${subscription?.status ?? "active"}`}
                >
                  {subscription?.status === "trial"
                    ? `Trial · ${daysLeft(subscription.trial_end)} days left`
                    : subscription?.status === "active"
                      ? "Active"
                      : "Expired"}
                </span>
              </div>
            </div>

            {/* CV Usage */}
            <div className="usage-section">
              <div className="usage-row">
                <span className="usage-label">CV Screenings this month</span>
                <span className="usage-count">
                  {subscription?.cv_count_current ?? 0} /
                  {subscription?.cv_limit_monthly ?? 0}
                </span>
              </div>
              <div className="usage-track">
                <div
                  className="usage-fill"
                  style={{
                    width: `${usagePercent}%`,
                    background:
                      usagePercent >= 90
                        ? "#ef4444"
                        : usagePercent >= 75
                          ? "#f59e0b"
                          : "#7c3aed",
                  }}
                />
              </div>
            </div>

            {/* Plan meta chips */}
            <div className="plan-meta-row">
              <span className="plan-meta-chip">
                <Zap size={11} color="#7c3aed" />
                {currentPlan.aiEngine}
              </span>
              <span className="plan-meta-chip">
                <Check size={11} color="#22c55e" />
                {currentPlan.jobLimit} active{" "}
                {currentPlan.jobLimit === 1 ? "job" : "jobs"}
              </span>
              {subscription?.current_period_end && (
                <span className="plan-meta-chip">
                  Next billing: {formatDate(subscription.current_period_end)}
                </span>
              )}
              {subscription?.trial_end && subscription.status === "trial" && (
                <span className="plan-meta-chip" style={{ color: "#7c3aed" }}>
                  Trial ends: {formatDate(subscription.trial_end)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Plan Options */}
        <div className="b-card reveal reveal-3">
          <div className="b-card-header">
            <div>
              <div className="b-card-title">Available Plans</div>
              <div className="b-card-sub">
                Upgrade or change your plan anytime
              </div>
            </div>
          </div>

          <div className="plans-grid">
            {Object.values(PLANS).map((plan) => {
              const isCurrent = subscription?.plan_tier === plan.tier;
              const isHigher =
                ["free", "essential", "premium"].indexOf(plan.tier) >
                ["free", "essential", "premium"].indexOf(
                  subscription?.plan_tier ?? "free",
                );

              return (
                <div
                  key={plan.tier}
                  className={`plan-option ${isCurrent ? "current-plan" : ""} ${plan.tier === "premium" ? "premium-plan" : ""}`}
                >
                  {plan.tier === "premium" && !isCurrent && (
                    <div className="plan-option-badge">Most Popular</div>
                  )}

                  <div className="plan-option-name">{plan.name}</div>

                  <div className="plan-option-price">
                    {plan.price === 0 ? (
                      "Free"
                    ) : (
                      <>
                        PKR {plan.price.toLocaleString()}
                        <span>/mo</span>
                      </>
                    )}
                  </div>

                  <ul className="plan-option-features">
                    {plan.features.map((f, i) => (
                      <li key={i} className={`plan-option-feature`}>
                        <Check size={10} color="#16a34a" strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button className="btn-current">✓ Current Plan</button>
                  ) : isHigher ? (
                    <button
                      className="btn-upgrade"
                      onClick={() => handleUpgrade(plan.tier as PlanTier)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === plan.tier ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Zap size={13} />
                      )}
                      {upgrading === plan.tier
                        ? "Redirecting..."
                        : `Upgrade to ${plan.name}`}
                    </button>
                  ) : (
                    <button className="btn-downgrade">Downgrade</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing History */}
        {billingHistory.length > 0 && (
          <div className="b-card reveal reveal-4">
            <div className="b-card-header">
              <div>
                <div className="b-card-title">Billing History</div>
                <div className="b-card-sub">Your past payments</div>
              </div>
            </div>

            {billingHistory.map((record) => (
              <div key={record.id} className="history-row">
                <div className="history-left">
                  <div
                    className="history-icon"
                    style={{ background: "rgba(124,58,237,0.08)" }}
                  >
                    <CreditCard size={15} color="#7c3aed" />
                  </div>
                  <div>
                    <div className="history-plan">
                      SahiScreen{" "}
                      {record.plan_tier.charAt(0).toUpperCase() +
                        record.plan_tier.slice(1)}
                    </div>
                    <div className="history-date">
                      {formatDate(record.paid_at ?? record.created_at)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="history-amount">
                    PKR {record.amount?.toLocaleString() ?? "—"}
                  </span>
                  <span className={`history-status ${record.status}`}>
                    {record.status.charAt(0).toUpperCase() +
                      record.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
