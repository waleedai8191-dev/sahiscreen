"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  Zap,
  Shield,
  Star,
  FileText,
  Briefcase,
  Headphones,
  Brain,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type PlanTier = "free" | "essential" | "premium";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  tier: PlanTier;
  name: string;
  price: number;
  badge?: string;
  tagline: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  features: PlanFeature[];
}

// ── Plan Data ──────────────────────────────────────────────────────────────
const PLANS: Plan[] = [
  {
    tier: "free",
    name: "Free",
    price: 0,
    tagline: "Perfect to get started",
    icon: <FileText size={20} />,
    accentColor: "#64748b",
    accentBg: "rgba(100,116,139,0.1)",
    features: [
      { text: "30 CVs screened /15 Days  ", included: true },
      { text: "Basic AI screening", included: true },
      { text: "1 active job", included: true },
      { text: "Community support", included: true },
      { text: "Gemini Pro AI engine", included: false },
      { text: "Anti-AI detection", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    tier: "essential",
    name: "Essential",
    price: 14999,
    tagline: "For growing teams",
    icon: <Briefcase size={20} />,
    accentColor: "#3b82f6",
    accentBg: "rgba(59,130,246,0.1)",
    features: [
      { text: "1,000 CVs screened / month", included: true },
      { text: "Gemini Pro AI engine", included: true },
      { text: "20 qctive jods", included: true },
      { text: "Ranking & justification", included: true },
      { text: "Email support", included: true },
      { text: "Anti-AI detection", included: false },
      { text: "24/7 priority support", included: false },
    ],
  },
  {
    tier: "premium",
    name: "Premium",
    price: 22999,
    badge: "MOST POPULAR",
    tagline: "For serious hiring",
    icon: <Star size={20} />,
    accentColor: "#7c3aed",
    accentBg: "rgba(124,58,237,0.1)",
    features: [
      { text: "2,000 CVs screened / month", included: true },
      { text: "Claude Pro AI engine", included: true },
      { text: "35 active jobs", included: true },
      { text: "Ranking & justification", included: true },
      { text: "Anti-AI gaming detection", included: true },
      { text: "24/7 priority support", included: true },
      { text: "Early access to new features", included: true },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function PlansPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanTier>("free");

  const selectedPlan = PLANS.find((p) => p.tier === selected)!;

  const handleContinue = () => {
    router.push(`/register?plan=${selected}`);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .plans-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 24px 80px;
          position: relative;
          overflow: hidden;
        }

        /* subtle background blob matching dashboard */
        .plans-page::before {
          content: '';
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .plans-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 960px;
        }

        /* ── Nav ── */
        .plans-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 48px;
        }

        .plans-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .plans-logo-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .plans-logo-text {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .plans-login-link {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
        }

        .plans-login-link:hover { color: #7c3aed; }

        /* ── Header ── */
        .plans-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .plans-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(124,58,237,0.08);
          border: 1px solid rgba(124,58,237,0.15);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 700;
          color: #7c3aed;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 16px;
        }

        .plans-title {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          line-height: 1.15;
          margin-bottom: 10px;
        }

        .plans-subtitle {
          font-size: 15px;
          color: #64748b;
          font-weight: 500;
        }

        /* ── Cards Grid ── */
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        /* ── Plan Card ── */
        .plan-card {
          background: #fff;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          position: relative;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .plan-card:hover {
          border-color: #c4b5fd;
          box-shadow: 0 8px 28px rgba(124,58,237,0.1);
          transform: translateY(-2px);
        }

        .plan-card.selected-free {
          border-color: #64748b;
          box-shadow: 0 8px 24px rgba(100,116,139,0.15);
          transform: translateY(-2px);
        }

        .plan-card.selected-essential {
          border-color: #3b82f6;
          box-shadow: 0 8px 24px rgba(59,130,246,0.15);
          transform: translateY(-2px);
        }

        .plan-card.selected-premium {
          border-color: #7c3aed;
          box-shadow: 0 12px 32px rgba(124,58,237,0.2);
          transform: translateY(-3px);
        }

        /* ── Badge ── */
        .plan-badge {
          position: absolute;
          top: -1px;
          right: 20px;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 0 0 8px 8px;
        }

        /* ── Card Top ── */
        .plan-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .plan-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        /* custom radio */
        .plan-radio {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, background 0.2s;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .plan-radio.checked-free {
          border-color: #64748b;
          background: #64748b;
        }

        .plan-radio.checked-essential {
          border-color: #3b82f6;
          background: #3b82f6;
        }

        .plan-radio.checked-premium {
          border-color: #7c3aed;
          background: #7c3aed;
        }

        .plan-radio-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff;
        }

        /* ── Plan name & tagline ── */
        .plan-name {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
          margin-bottom: 2px;
        }

        .plan-tagline {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* ── Price ── */
        .plan-price-wrap {
          margin-bottom: 20px;
        }

        .plan-price-row {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }

        .plan-currency {
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          line-height: 1.8;
        }

        .plan-amount {
          font-size: 34px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1.5px;
          line-height: 1;
        }

        .plan-amount.free-amount {
          font-size: 30px;
        }

        .plan-period {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
          margin-top: 3px;
        }

        /* ── Divider ── */
        .plan-divider {
          height: 1px;
          background: #f1f5f9;
          margin-bottom: 18px;
        }

        /* ── Features ── */
        .plan-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 9px;
          flex: 1;
        }

        .plan-feature-item {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 500;
        }

        .plan-feature-item.included {
          color: #334155;
        }

        .plan-feature-item.excluded {
          color: #cbd5e1;
        }

        .feature-icon-wrap {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-icon-wrap.yes {
          background: #f0fdf4;
        }

        .feature-icon-wrap.no {
          background: #f8fafc;
        }

        /* ── Continue Button Area ── */
        .plans-cta-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .plans-continue-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 36px;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(124,58,237,0.35);
          transition: transform 0.18s, box-shadow 0.18s;
          letter-spacing: -0.2px;
        }

        .plans-continue-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124,58,237,0.45);
        }

        .plans-continue-btn:active {
          transform: translateY(0);
        }

        /* dynamic label inside button */
        .btn-plan-label {
          opacity: 0.85;
          font-weight: 600;
          font-size: 13px;
        }

        .plans-note {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .plans-note svg {
          color: #22c55e;
          flex-shrink: 0;
        }

        /* ── Stagger animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .reveal { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .reveal-1 { animation-delay: 0.05s; }
        .reveal-2 { animation-delay: 0.12s; }
        .reveal-3 { animation-delay: 0.19s; }
        .reveal-4 { animation-delay: 0.26s; }
        .reveal-5 { animation-delay: 0.33s; }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .plans-grid {
            grid-template-columns: 1fr;
            max-width: 440px;
            margin-left: auto;
            margin-right: auto;
          }
          .plans-title { font-size: 28px; }
        }

        @media (max-width: 480px) {
          .plans-page { padding: 32px 16px 64px; }
          .plans-title { font-size: 24px; }
          .plan-amount { font-size: 28px; }
        }
      `}</style>

      <div className="plans-page">
        <div className="plans-inner">
          {/* Nav */}
          <nav className="plans-nav reveal reveal-1">
            <Link href="/" className="plans-logo">
              <div className="plans-logo-icon">
                <Zap size={16} color="#fff" />
              </div>
              <span className="plans-logo-text">SahiScreen</span>
            </Link>
            <Link href="/login" className="plans-login-link">
              Already have an account? Sign in
            </Link>
          </nav>

          {/* Header */}
          <div className="plans-header reveal reveal-2">
            <div className="plans-eyebrow">
              <Shield size={10} />
              {selectedPlan.tier === "free"
                ? "No credit card required"
                : "Credit card required"}
            </div>
            <h1 className="plans-title">Choose your plan</h1>
            <p className="plans-subtitle">
              Start free, upgrade when you're ready
            </p>
          </div>

          {/* Cards */}
          <div className="plans-grid reveal reveal-3">
            {PLANS.map((plan) => {
              const isSelected = selected === plan.tier;
              const selectedClass = isSelected ? `selected-${plan.tier}` : "";

              return (
                <div
                  key={plan.tier}
                  className={`plan-card ${selectedClass}`}
                  onClick={() => setSelected(plan.tier)}
                >
                  {/* Popular badge */}
                  {plan.badge && <div className="plan-badge">{plan.badge}</div>}

                  {/* Card Top — icon + radio */}
                  <div className="plan-card-top">
                    <div
                      className="plan-icon-wrap"
                      style={{
                        background: plan.accentBg,
                        color: plan.accentColor,
                      }}
                    >
                      {plan.icon}
                    </div>
                    <div
                      className={`plan-radio ${isSelected ? `checked-${plan.tier}` : ""}`}
                    >
                      {isSelected && <div className="plan-radio-dot" />}
                    </div>
                  </div>

                  {/* Name + tagline */}
                  <div style={{ marginBottom: "14px" }}>
                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-tagline">{plan.tagline}</div>
                  </div>

                  {/* Price */}
                  <div className="plan-price-wrap">
                    {plan.price === 0 ? (
                      <div className="plan-price-row">
                        <span
                          className="plan-amount free-amount"
                          style={{ color: plan.accentColor }}
                        >
                          Free
                        </span>
                      </div>
                    ) : (
                      <div className="plan-price-row">
                        <span className="plan-currency">PKR</span>
                        <span className="plan-amount">
                          {plan.price.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="plan-period">
                      {plan.price === 0
                        ? "forever · no card needed"
                        : "/month · cancel anytime"}
                    </div>
                  </div>

                  <div className="plan-divider" />

                  {/* Features */}
                  <ul className="plan-features">
                    {plan.features.map((f) => (
                      <li
                        key={f.text}
                        className={`plan-feature-item ${f.included ? "included" : "excluded"}`}
                      >
                        <div
                          className={`feature-icon-wrap ${f.included ? "yes" : "no"}`}
                        >
                          {f.included ? (
                            <Check size={10} color="#16a34a" strokeWidth={3} />
                          ) : (
                            <X size={10} color="#cbd5e1" strokeWidth={3} />
                          )}
                        </div>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="plans-cta-area reveal reveal-4">
            <button className="plans-continue-btn" onClick={handleContinue}>
              {selectedPlan.price === 0 ? (
                <>
                  Start for Free
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Continue with {selectedPlan.name}
                  <span className="btn-plan-label">
                    · PKR {selectedPlan.price.toLocaleString()}/mo
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="plans-note">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              {selectedPlan.tier === "free"
                ? "Free forever · No credit card required"
                : "Credit card required · Secure payment via PayFast"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
