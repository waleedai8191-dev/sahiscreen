"use client";

import Link from "next/link";
import { Check } from "lucide-react";

const essentialFeatures = [
  "1000 CVs Screened / Month",
  "Gemini Pro AI Engine",
  "Ranking & Justification",
  "Email Support",
];

const premiumFeatures = [
  "2,000 CVs Screened / Month",
  "Claude 3.5 Sonnet Engine",
  "Anti-AI Gaming Detection",
  "24/7 Priority Support",
];

export default function Pricing() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .pricing-section {
          padding: 96px 24px;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }

        .pricing-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 60%, rgba(124,58,237,0.04) 0%, transparent 65%);
          pointer-events: none;
        }

        .pricing-inner {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .pricing-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          margin: 0 0 10px 0;
          line-height: 1.15;
        }

        .pricing-subtitle {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          color: #64748b;
          font-weight: 400;
          margin: 0 0 56px 0;
        }

        /* Cards grid */
        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: stretch;
        }

        /* Essential Card */
        .pricing-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .pricing-card:hover {
          border-color: #c4b5fd;
          box-shadow: 0 12px 40px rgba(124,58,237,0.1);
          transform: translateY(-4px);
        }

        /* Premium Card */
        .pricing-card.premium {
          background: #0f172a;
          border-color: #1e293b;
          color: white;
        }

        .pricing-card.premium:hover {
          border-color: #7C3AED;
          box-shadow: 0 16px 48px rgba(124,58,237,0.25);
        }

        /* Popular badge */
        .popular-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #7C3AED;
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 0.3px;
        }

        .plan-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .plan-name.essential {
          color: #64748b;
        }

        .plan-name.premium-label {
          color: #a78bfa;
        }

        .plan-price {
          margin-bottom: 8px;
        }

        .plan-currency {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #64748b;
          vertical-align: top;
          line-height: 2;
        }

        .pricing-card.premium .plan-currency {
          color: #94a3b8;
        }

        .plan-amount {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 48px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -2px;
          line-height: 1;
        }

        .pricing-card.premium .plan-amount {
          color: #ffffff;
        }

        .plan-period {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
          margin-bottom: 28px;
        }

        .plan-divider {
          height: 1px;
          background: #f1f5f9;
          margin-bottom: 24px;
        }

        .pricing-card.premium .plan-divider {
          background: #1e293b;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 32px 0;
          flex: 1;
        }

        .features-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #334155;
          padding: 9px 0;
          border-bottom: 1px solid #f8fafc;
        }

        .pricing-card.premium .features-list li {
          color: #cbd5e1;
          border-bottom-color: #1e293b;
        }

        .feature-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #f0fdf4;
        }

        .pricing-card.premium .feature-check {
          background: rgba(124,58,237,0.2);
        }

        .pricing-card.premium .feature-check svg {
          color: #a78bfa !important;
        }

        /* CTA Buttons */
        .btn-essential {
          display: block;
          width: 100%;
          text-align: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 24px;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .btn-essential:hover {
          border-color: #7C3AED;
          color: #7C3AED;
          background: #faf5ff;
        }

        .btn-premium {
          display: block;
          width: 100%;
          text-align: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: white;
          background: #7C3AED;
          border: none;
          border-radius: 10px;
          padding: 14px 24px;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(124,58,237,0.4);
        }

        .btn-premium:hover {
          background: #6d28d9;
          box-shadow: 0 6px 28px rgba(124,58,237,0.5);
          transform: translateY(-1px);
        }

        /* Guarantee note */
        .pricing-note {
          text-align: center;
          margin-top: 32px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .pricing-note svg {
          color: #10b981;
        }

        @media (max-width: 768px) {
          .pricing-section { padding: 72px 24px; }
          .pricing-grid {
            grid-template-columns: 1fr;
            max-width: 440px;
            margin: 0 auto;
          }
          .pricing-title { font-size: 28px; }
          .pricing-card { padding: 28px 24px; }
          .plan-amount { font-size: 40px; }
        }

        @media (max-width: 480px) {
          .pricing-title { font-size: 24px; }
          .plan-amount { font-size: 36px; }
        }
      `}</style>

      <section className="pricing-section" id="pricing">
        <div className="pricing-bg" />
        <div className="pricing-inner">
          {/* Header */}
          <div className="pricing-header">
            <h2 className="pricing-title">Simple, Transparent Pricing</h2>
            <p className="pricing-subtitle">
              Built for the growth-focused Pakistani SME
            </p>
          </div>

          {/* Cards */}
          <div className="pricing-grid">
            {/* Essential */}
            <div className="pricing-card">
              <span className="plan-name essential">Essential</span>

              <div className="plan-price">
                <span className="plan-currency">PKR </span>
                <span className="plan-amount">14,999</span>
              </div>
              <p className="plan-period">/mo</p>

              <div className="plan-divider" />

              <ul className="features-list">
                {essentialFeatures.map((f) => (
                  <li key={f}>
                    <span className="feature-check">
                      <Check size={11} color="#16a34a" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/register" className="btn-essential">
                Get Started
              </Link>
            </div>

            {/* Premium */}
            <div className="pricing-card premium">
              <span className="popular-badge">MOST POPULAR</span>
              <span className="plan-name premium-label">Premium</span>

              <div className="plan-price">
                <span className="plan-currency">PKR </span>
                <span className="plan-amount">22,999</span>
              </div>
              <p className="plan-period">/mo</p>

              <div className="plan-divider" />

              <ul className="features-list">
                {premiumFeatures.map((f) => (
                  <li key={f}>
                    <span className="feature-check">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/register" className="btn-premium">
                Get Started
              </Link>
            </div>
          </div>

          {/* Note */}
          <p className="pricing-note">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            14-day free trial on all plans · No credit card required · Cancel
            anytime
          </p>
        </div>
      </section>
    </>
  );
}
