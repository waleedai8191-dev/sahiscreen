import TestimonialSlider from "@/components/TestimonialSlider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | SahiScreen",
    default: "SahiScreen — AI Resume Screening for Pakistan",
  },
  description:
    "Sign in or create your SahiScreen account. AI-powered CV screening built for Pakistani SMEs.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .auth-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Left panel — form side ── */
        .auth-form-panel {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #ffffff;
          position: relative;
          overflow-y: auto;
        }

        /* Top nav inside auth */
        .auth-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 40px;
          flex-shrink: 0;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .auth-logo-icon {
          width: 32px;
          height: 32px;
          background: #7C3AED;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .auth-logo-text {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .auth-topbar-link {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
        }

        .auth-topbar-link:hover {
          color: #7C3AED;
        }

        .auth-topbar-link span {
          color: #7C3AED;
          font-weight: 600;
        }

        /* Form content area */
        .auth-form-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 40px 48px;
        }

        .auth-form-inner {
          width: 100%;
          max-width: 440px;
        }

        /* ── Right panel — decorative ── */
        .auth-deco-panel {
          background: #0f172a;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 56px;
        }

        /* Blob glows */
        .deco-blob-1 {
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 65%);
          border-radius: 50%;
          pointer-events: none;
        }

        .deco-blob-2 {
          position: absolute;
          bottom: -80px;
          left: -80px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 65%);
          border-radius: 50%;
          pointer-events: none;
        }

        .deco-blob-3 {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 300px;
          background: radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Dot grid */
        .deco-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        /* Deco content */
        .deco-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
        }

        .deco-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(124,58,237,0.2);
          border: 1px solid rgba(124,58,237,0.35);
          border-radius: 100px;
          padding: 6px 16px;
          margin-bottom: 28px;
        }

        .deco-badge-dot {
          width: 6px;
          height: 6px;
          background: #a78bfa;
          border-radius: 50%;
          animation: pulse-deco 2s ease-in-out infinite;
        }

        @keyframes pulse-deco {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        .deco-badge-text {
          font-size: 12px;
          font-weight: 600;
          color: #a78bfa;
          letter-spacing: 0.3px;
        }

        .deco-headline {
          font-size: 36px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -1px;
          line-height: 1.15;
          margin-bottom: 16px;
        }

        .deco-headline .accent {
          color: #a78bfa;
        }

        .deco-subtext {
          font-size: 15px;
          font-weight: 400;
          color: #64748b;
          line-height: 1.7;
          margin-bottom: 40px;
        }

        /* Stats inside deco panel */
        .deco-stats {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .deco-stat-row {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 18px;
          transition: all 0.2s ease;
        }

        .deco-stat-row:hover {
          background: rgba(124,58,237,0.1);
          border-color: rgba(124,58,237,0.25);
        }

        .deco-stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(124,58,237,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 18px;
        }

        .deco-stat-info {}

        .deco-stat-num {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          display: block;
          line-height: 1.2;
        }

        .deco-stat-label {
          font-size: 12px;
          font-weight: 500;
          color: #475569;
        }

        /* Testimonial */
        .deco-testimonial {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-left: 3px solid #7C3AED;
          border-radius: 12px;
          padding: 18px 20px;
        }

        .deco-testimonial-text {
          font-size: 13px;
          font-weight: 400;
          color: #94a3b8;
          line-height: 1.65;
          font-style: italic;
          margin-bottom: 12px;
        }

        .deco-testimonial-author {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .deco-author-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED, #a78bfa);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .deco-author-name {
          font-size: 12px;
          font-weight: 600;
          color: #cbd5e1;
          display: block;
        }

        .deco-author-role {
          font-size: 11px;
          color: #475569;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .auth-deco-panel { padding: 40px 36px; }
          .deco-headline { font-size: 28px; }
          .auth-topbar { padding: 20px 28px; }
          .auth-form-content { padding: 28px 28px 40px; }
        }

        @media (max-width: 768px) {
          .auth-root {
            grid-template-columns: 1fr;
          }
          .auth-deco-panel {
            display: none;
          }
          .auth-form-panel {
            min-height: 100vh;
          }
          .auth-topbar { padding: 20px 24px; }
          .auth-form-content { padding: 24px 24px 40px; }
        }

        @media (max-width: 480px) {
          .auth-topbar { padding: 16px 20px; }
          .auth-form-content { padding: 20px 20px 36px; }
        }
      `}</style>

      <div className="auth-root">
        {/* Left — Form Panel */}
        <div className="auth-form-panel">
          {/* Topbar */}
          <div className="auth-topbar">
            <a href="/" className="auth-logo">
              <div className="auth-logo-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
              </div>
              <span className="auth-logo-text">SahiScreen</span>
            </a>
          </div>

          {/* Page content injected here */}
          <div className="auth-form-content">
            <div className="auth-form-inner">{children}</div>
          </div>
        </div>

        {/* Right — Decorative Panel */}
        <div className="auth-deco-panel">
          <div className="deco-blob-1" />
          <div className="deco-blob-2" />
          <div className="deco-blob-3" />
          <div className="deco-grid" />

          <div className="deco-content">
            <div className="deco-badge">
              <span className="deco-badge-dot" />
              <span className="deco-badge-text">
                🇵🇰 Trusted by 50+ HR Teams
              </span>
            </div>

            <h2 className="deco-headline">
              Screen Smarter.
              <br />
              Hire <span className="accent">Better.</span>
            </h2>

            <p className="deco-subtext">
              Join Pakistani companies already saving 15+ hours per job opening
              with AI-powered CV screening.
            </p>

            {/* Stats */}
            <div className="deco-stats">
              <div className="deco-stat-row">
                <div className="deco-stat-icon">⚡</div>
                <div className="deco-stat-info">
                  <span className="deco-stat-num">10x Faster</span>
                  <span className="deco-stat-label">
                    Than manual CV screening
                  </span>
                </div>
              </div>
              <div className="deco-stat-row">
                <div className="deco-stat-icon">🎯</div>
                <div className="deco-stat-info">
                  <span className="deco-stat-num">40% Better</span>
                  <span className="deco-stat-label">
                    Hire quality improvement
                  </span>
                </div>
              </div>
              <div className="deco-stat-row">
                <div className="deco-stat-icon">🛡️</div>
                <div className="deco-stat-info">
                  <span className="deco-stat-num">Anti-AI Detection</span>
                  <span className="deco-stat-label">
                    Catches fake & padded CVs
                  </span>
                </div>
              </div>
            </div>

            <TestimonialSlider />
          </div>
        </div>
      </div>
    </>
  );
}
