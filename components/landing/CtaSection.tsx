"use client";

import Link from "next/link";

export default function CtaSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .cta-section {
          padding: 96px 24px;
          background: #0f172a;
          position: relative;
          overflow: hidden;
        }

        /* Decorative background blobs */
        .cta-blob-1 {
          position: absolute;
          top: -120px;
          left: -120px;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .cta-blob-2 {
          position: absolute;
          bottom: -120px;
          right: -120px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .cta-blob-3 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          height: 300px;
          background: radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Grid dots overlay */
        .cta-grid {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        .cta-inner {
          max-width: 760px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          text-align: center;
        }

        /* Top badge */
        .cta-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(124,58,237,0.2);
          border: 1px solid rgba(124,58,237,0.35);
          border-radius: 100px;
          padding: 6px 18px;
          margin-bottom: 28px;
        }

        .cta-badge-dot {
          width: 7px;
          height: 7px;
          background: #a78bfa;
          border-radius: 50%;
          animation: pulse-cta 2s ease-in-out infinite;
        }

        @keyframes pulse-cta {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        .cta-badge-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #a78bfa;
          letter-spacing: 0.3px;
        }

        /* Headline */
        .cta-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 52px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -2px;
          line-height: 1.08;
          margin: 0 0 20px 0;
        }

        .cta-title .accent {
          color: #a78bfa;
        }

        /* Subtitle */
        .cta-subtitle {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 17px;
          font-weight: 400;
          color: #94a3b8;
          line-height: 1.65;
          margin: 0 0 40px 0;
        }

        .cta-subtitle strong {
          color: #cbd5e1;
          font-weight: 600;
        }

        /* Action buttons */
        .cta-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .btn-cta-primary {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: white;
          background: #7C3AED;
          border: none;
          cursor: pointer;
          padding: 16px 36px;
          border-radius: 12px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 24px rgba(124,58,237,0.5);
          transition: all 0.2s ease;
          letter-spacing: -0.2px;
        }

        .btn-cta-primary:hover {
          background: #6d28d9;
          box-shadow: 0 8px 32px rgba(124,58,237,0.6);
          transform: translateY(-2px);
        }

        .btn-cta-secondary {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #94a3b8;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          padding: 16px 28px;
          border-radius: 12px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .btn-cta-secondary:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: #e2e8f0;
        }

        /* Trust row */
        .cta-trust {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          flex-wrap: wrap;
        }

        .cta-trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }

        .cta-trust-item svg {
          color: #a78bfa;
          flex-shrink: 0;
        }

        /* Divider dots between trust items */
        .cta-trust-sep {
          width: 3px;
          height: 3px;
          background: #334155;
          border-radius: 50%;
        }

        /* Stats strip above button */
        .cta-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }

        .cta-stat {
          text-align: center;
        }

        .cta-stat-num {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -1px;
          display: block;
          line-height: 1;
          margin-bottom: 4px;
        }

        .cta-stat-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }

        .cta-stat-sep {
          width: 1px;
          height: 40px;
          background: #1e293b;
        }

        @media (max-width: 768px) {
          .cta-section { padding: 80px 24px; }
          .cta-title { font-size: 36px; letter-spacing: -1px; }
          .cta-subtitle { font-size: 15px; }
          .cta-stats { gap: 20px; }
          .cta-stat-num { font-size: 26px; }
          .cta-stat-sep { display: none; }
        }

        @media (max-width: 480px) {
          .cta-title { font-size: 28px; }
          .cta-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .btn-cta-primary,
          .btn-cta-secondary {
            justify-content: center;
          }
          .cta-trust { gap: 16px; }
          .cta-trust-sep { display: none; }
        }
      `}</style>

      <section className="cta-section">
        <div className="cta-blob-1" />
        <div className="cta-blob-2" />
        <div className="cta-blob-3" />
        <div className="cta-grid" />

        <div className="cta-inner">
          {/* Badge */}
          <div className="cta-badge">
            <span className="cta-badge-dot" />
            <span className="cta-badge-text">Join 50+ Pakistani HR Teams</span>
          </div>

          {/* Headline */}
          <h2 className="cta-title">
            Stop Reading <span className="accent">300 CVs</span>
            <br />
            Manually.
          </h2>

          {/* Subtitle */}
          <p className="cta-subtitle">
            Join <strong>50+ Pakistani HR teams</strong> who have reclaimed
            their time and improved their hiring quality by{" "}
            <strong>40%.</strong>
          </p>

          {/* Stats */}
          <div className="cta-stats">
            <div className="cta-stat">
              <span className="cta-stat-num">10x</span>
              <span className="cta-stat-label">Faster Screening</span>
            </div>
            <div className="cta-stat-sep" />
            <div className="cta-stat">
              <span className="cta-stat-num">40%</span>
              <span className="cta-stat-label">Better Hire Quality</span>
            </div>
            <div className="cta-stat-sep" />
            <div className="cta-stat">
              <span className="cta-stat-num">500+</span>
              <span className="cta-stat-label">CVs Per Batch</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="cta-actions">
            <Link href="/register" className="btn-cta-primary">
              Start Your Free Trial →
            </Link>
            <Link href="#pricing" className="btn-cta-secondary">
              View Pricing
            </Link>
          </div>

          {/* Trust items */}
          <div className="cta-trust">
            <div className="cta-trust-item">
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
              Free Trial
            </div>
            <div className="cta-trust-sep" />
            <div className="cta-trust-item">
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
              No Credit Card Required
            </div>
            <div className="cta-trust-sep" />
            <div className="cta-trust-item">
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
              Cancel Anytime
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
