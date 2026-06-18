"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Briefcase,
  Upload,
  Zap,
  ArrowRight,
  Sparkles,
  Building2,
  ChevronRight,
  CreditCard,
  Loader2,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PLANS, type PlanTier } from "@/lib/plans";

// ── Types ──────────────────────────────────────────────────────────────────
interface UserProfile {
  full_name: string | null;
  company_id: string | null;
  companies?: { name: string } | null;
}

// ── Steps config ──────────────────────────────────────────────────────────
const STEPS = [
  {
    icon: <Briefcase size={18} color="#7c3aed" />,
    iconBg: "rgba(124,58,237,0.1)",
    title: "Post your first job",
    desc: "Write a job description and let AI understand what you need",
    href: "/dashboard/jobs/new",
    cta: "Post a Job",
  },
  {
    icon: <Upload size={18} color="#3b82f6" />,
    iconBg: "rgba(59,130,246,0.1)",
    title: "Upload candidate CVs",
    desc: "Bulk upload up to hundreds of CVs in one go",
    href: "/dashboard/candidates",
    cta: "Upload CVs",
  },
  {
    icon: <Zap size={18} color="#f59e0b" />,
    iconBg: "rgba(245,158,11,0.1)",
    title: "Get AI rankings instantly",
    desc: "See every candidate ranked, scored and justified by AI",
    href: "/dashboard/candidates",
    cta: "View Results",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────
export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planTier = (searchParams.get("plan") ?? "free") as PlanTier;
  const plan = PLANS[planTier] ?? PLANS.free;
  const mustPay = searchParams.get("mustPay") === "true";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [checksDone, setChecksDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("full_name, company_id, companies(name)")
        .eq("id", user.id)
        .single();

      // If company not loaded yet — retry once after 1 second
      if (!(data as any)?.companies) {
        await new Promise((res) => setTimeout(res, 1000));
        const { data: retryData } = await supabase
          .from("users")
          .select("full_name, company_id, companies(name)")
          .eq("id", user.id)
          .single();
        setProfile(retryData as unknown as UserProfile);
        setCompanyId((retryData as any)?.company_id ?? null);
        setLoading(false);
        setTimeout(() => setChecksDone(true), 600);
        return;
      }

      setProfile(data as unknown as UserProfile);
      setCompanyId((data as any)?.company_id ?? null);

      setLoading(false);

      // Animate checks sequentially
      setTimeout(() => setChecksDone(true), 600);
    };

    load();
  }, [router]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const companyName = profile?.companies?.name ?? "your company";
  if (loading) {
    return (
      <div className="welcome-loading">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
            .welcome-loading {
              min-height: 100vh;
              background: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: 'Plus Jakarta Sans', sans-serif;
            }
            .welcome-loading-inner {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
            }
            .welcome-spinner {
              width: 40px; height: 40px;
              border: 3px solid #e2e8f0;
              border-top-color: #7c3aed;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            .welcome-loading-text {
              font-size: 14px;
              color: #64748b;
              font-weight: 500;
            }
          `}</style>
        <div className="welcome-loading-inner">
          <div className="welcome-spinner" />
          <p className="welcome-loading-text">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          .welcome-page {
            min-height: 100vh;
            background: #f8fafc;
            font-family: 'Plus Jakarta Sans', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 24px;
            position: relative;
            overflow: hidden;
          }

          /* Background glow — matches dashboard */
          .welcome-page::before {
            content: '';
            position: fixed;
            top: -180px;
            left: 50%;
            transform: translateX(-50%);
            width: 800px;
            height: 500px;
            background: radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
          }

          .welcome-inner {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 560px;
          }

          /* ── Animations ── */
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          @keyframes popIn {
            0%   { opacity: 0; transform: scale(0.6); }
            70%  { transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }

          @keyframes checkSlide {
            from { opacity: 0; transform: translateX(-8px); }
            to   { opacity: 1; transform: translateX(0); }
          }

          .reveal { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
          .reveal-1 { animation-delay: 0.05s; }
          .reveal-2 { animation-delay: 0.15s; }
          .reveal-3 { animation-delay: 0.25s; }
          .reveal-4 { animation-delay: 0.35s; }
          .reveal-5 { animation-delay: 0.45s; }

          /* ── Success icon ── */
          .welcome-icon-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 28px;
            animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
            animation-delay: 0.0s;
          }

          .welcome-icon-ring {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(91,33,182,0.08));
            border: 2px solid rgba(124,58,237,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: popIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
            animation-delay: 0.1s;
          }

          /* ── Header text ── */
          .welcome-header {
            text-align: center;
            margin-bottom: 32px;
          }

          .welcome-title {
            font-size: 30px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.8px;
            line-height: 1.2;
            margin-bottom: 8px;
          }

          .welcome-title span {
            background: linear-gradient(135deg, #7c3aed, #5b21b6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .welcome-subtitle {
            font-size: 15px;
            color: #64748b;
            font-weight: 500;
            line-height: 1.6;
          }

          /* ── Setup checklist card ── */
          .welcome-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 16px;
          }

          .welcome-card-header {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .welcome-card-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
          }

          /* ── Checklist items ── */
          .check-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 20px;
            border-bottom: 1px solid #f8fafc;
            opacity: 0;
          }

          .check-item:last-child { border-bottom: none; }

          .check-item.visible {
            animation: checkSlide 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
          }

          .check-item.visible:nth-child(1) { animation-delay: 0.1s; }
          .check-item.visible:nth-child(2) { animation-delay: 0.25s; }
          .check-item.visible:nth-child(3) { animation-delay: 0.4s; }

          .check-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #f0fdf4;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .check-text {
            flex: 1;
          }

          .check-label {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
          }

          .check-value {
            font-size: 12px;
            color: #64748b;
            margin-top: 1px;
            font-weight: 500;
          }

          /* ── Plan badge ── */
          .plan-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 10px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 700;
          }

          .plan-pill.free {
            background: rgba(100,116,139,0.1);
            color: #475569;
          }

          .plan-pill.essential {
            background: rgba(59,130,246,0.1);
            color: #2563eb;
          }

          .plan-pill.premium {
            background: rgba(124,58,237,0.1);
            color: #7c3aed;
          }

          /* ── Steps card ── */
          .steps-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 20px;
          }

          .steps-card-header {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
          }

          .steps-card-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
          }

          .steps-card-sub {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 1px;
          }

          /* ── Step row ── */
          .step-row {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 20px;
            border-bottom: 1px solid #f8fafc;
            text-decoration: none;
            transition: background 0.15s;
            cursor: pointer;
          }

          .step-row:last-child { border-bottom: none; }

          .step-row:hover {
            background: #f8fafc;
          }

          .step-num {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: rgba(124,58,237,0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            color: #7c3aed;
            flex-shrink: 0;
          }

          .step-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .step-text { flex: 1; }

          .step-title {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
          }

          .step-desc {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 2px;
          }

          /* ── Trial notice for paid plans ── */
          .trial-notice {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 18px;
            background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(91,33,182,0.04));
            border: 1px solid rgba(124,58,237,0.15);
            border-radius: 12px;
            margin-bottom: 16px;
          }

          .trial-notice-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: linear-gradient(135deg, #7c3aed, #5b21b6);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .trial-notice-title {
            font-size: 13px;
            font-weight: 700;
            color: #5b21b6;
          }

          .trial-notice-sub {
            font-size: 12px;
            color: #7c3aed;
            margin-top: 1px;
          }

          /* ── CTA button ── */
          .welcome-cta {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 14px 24px;
            background: linear-gradient(135deg, #7c3aed, #5b21b6);
            border: none;
            border-radius: 12px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 15px;
            font-weight: 700;
            color: #fff;
            cursor: pointer;
            text-decoration: none;
            box-shadow: 0 4px 16px rgba(124,58,237,0.35);
            transition: transform 0.18s, box-shadow 0.18s;
            letter-spacing: -0.2px;
          }

          .welcome-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(124,58,237,0.45);
          }

          .welcome-note {
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            margin-top: 12px;
            font-weight: 500;
          }

          /* ── Responsive ── */
          @media (max-width: 480px) {
            .welcome-title { font-size: 24px; }
            .welcome-page { padding: 32px 16px; }
          }
        `}</style>

      <div className="welcome-page">
        <div className="welcome-inner">
          {/* Success icon */}
          <div className="welcome-icon-wrap">
            <div className="welcome-icon-ring">
              <CheckCircle2 size={36} color="#7c3aed" />
            </div>
          </div>

          {/* Header */}
          <div className="welcome-header reveal reveal-1">
            <h1 className="welcome-title">
              Welcome to SahiScreen, <span>{firstName}!</span>
            </h1>
            <p className="welcome-subtitle">
              {mustPay && plan.tier !== "free"
                ? "One last step — complete payment to activate your plan."
                : "Your workspace is ready. Here's what was set up for you."}
            </p>
          </div>

          {/* Setup checklist */}
          <div className="welcome-card reveal reveal-2">
            <div className="welcome-card-header">
              <Sparkles size={14} color="#7c3aed" />
              <span className="welcome-card-title">Setup Complete</span>
            </div>

            {/* Check 1 — Account */}
            <div className={`check-item ${checksDone ? "visible" : ""}`}>
              <div className="check-icon">
                <CheckCircle2 size={16} color="#16a34a" />
              </div>
              <div className="check-text">
                <div className="check-label">Account created</div>
                <div className="check-value">Email verified ✓</div>
              </div>
            </div>

            {/* Check 2 — Company */}
            <div className={`check-item ${checksDone ? "visible" : ""}`}>
              <div className="check-icon">
                <CheckCircle2 size={16} color="#16a34a" />
              </div>
              <div className="check-text">
                <div className="check-label">Company workspace</div>
                <div className="check-value">{companyName}</div>
              </div>
            </div>

            {/* Check 3 — Plan */}
            <div className={`check-item ${checksDone ? "visible" : ""}`}>
              <div className="check-icon">
                <CheckCircle2 size={16} color="#16a34a" />
              </div>
              <div className="check-text">
                <div className="check-label">Plan activated</div>
                <div
                  className="check-value"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 3,
                  }}
                >
                  <span className={`plan-pill ${plan.tier}`}>{plan.name}</span>
                  <span>
                    {plan.tier === "free"
                      ? `· ${plan.cvLimit} CVs/mo · ${plan.jobLimit} active job`
                      : mustPay
                        ? `· ${plan.cvLimit.toLocaleString()} CVs/mo · ${plan.jobLimit} jobs · Payment required`
                        : `· ${plan.cvLimit.toLocaleString()} CVs/mo · ${plan.jobLimit} jobs`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trial notice for paid plans */}
          {mustPay && plan.tier !== "free" && (
            <div
              className="trial-notice reveal reveal-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <div
                className="trial-notice-icon"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                }}
              >
                <CreditCard size={16} color="#fff" />
              </div>
              <div>
                <div
                  className="trial-notice-title"
                  style={{ color: "#b45309" }}
                >
                  Payment required to activate
                </div>
                <div className="trial-notice-sub" style={{ color: "#d97706" }}>
                  PKR {plan.price.toLocaleString()}/mo · Full {plan.name} access
                  after payment
                </div>
              </div>
            </div>
          )}

          {/* Getting started steps */}
          {!mustPay && (
            <div className="steps-card reveal reveal-3">
              <div className="steps-card-header">
                <div className="steps-card-title">Get started in 3 steps</div>
                <div className="steps-card-sub">Takes less than 5 minutes</div>
              </div>

              {STEPS.map((step, i) => (
                <Link key={i} href={step.href} className="step-row">
                  <div className="step-num">{i + 1}</div>
                  <div
                    className="step-icon"
                    style={{ background: step.iconBg }}
                  >
                    {step.icon}
                  </div>
                  <div className="step-text">
                    <div className="step-title">{step.title}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                  <ChevronRight size={14} color="#cbd5e1" />
                </Link>
              ))}
            </div>
          )}

          {/* Main CTA */}
          {mustPay && plan.tier !== "free" ? (
            <>
              <PayNowButton companyId={companyId} planTier={plan.tier} />
              <p className="welcome-note">
                Secure payment via PayFast · Cancel anytime · PKR{" "}
                {plan.price.toLocaleString()}/mo
              </p>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="welcome-cta">
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
              <p className="welcome-note">
                Free forever · No credit card required
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
function PayNowButton({
  companyId,
  planTier,
}: {
  companyId: string | null;
  planTier: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payfast/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier, companyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Payment setup failed");
        setLoading(false);
        return;
      }
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
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <p
          style={{
            fontSize: 13,
            color: "#dc2626",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
      <button onClick={handlePay} disabled={loading} className="welcome-cta">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CreditCard size={16} />
        )}
        {loading ? "Redirecting to PayFast..." : "Complete Payment →"}
      </button>
    </>
  );
}
