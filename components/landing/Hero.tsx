"use client";

import Link from "next/link";
import { Play, Shield, Clock } from "lucide-react";

export default function Hero() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .hero-section {
          padding-top: 120px;
          padding-bottom: 80px;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }

        .hero-bg-blob {
          position: absolute;
          top: -100px;
          right: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .hero-bg-blob-2 {
          position: absolute;
          bottom: -100px;
          left: -150px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f3f0ff;
          border: 1px solid #ddd6fe;
          border-radius: 100px;
          padding: 5px 14px 5px 8px;
          margin-bottom: 24px;
        }

        .hero-badge-dot {
          width: 6px;
          height: 6px;
          background: #7C3AED;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }

        .hero-badge-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #7C3AED;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .hero-headline {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 52px;
          font-weight: 800;
          line-height: 1.1;
          color: #0f172a;
          letter-spacing: -1.5px;
          margin: 0 0 20px 0;
        }

        .hero-headline .highlight {
          color: #7C3AED;
          position: relative;
        }

        .hero-headline .highlight::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #7C3AED, #a78bfa);
          border-radius: 2px;
          opacity: 0.4;
        }

        .hero-subtext {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 17px;
          font-weight: 400;
          color: #64748b;
          line-height: 1.7;
          margin: 0 0 36px 0;
          max-width: 480px;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 36px;
          flex-wrap: wrap;
        }

        .btn-primary {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: white;
          background: #7C3AED;
          border: none;
          cursor: pointer;
          padding: 14px 28px;
          border-radius: 10px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #6d28d9;
          box-shadow: 0 6px 24px rgba(124, 58, 237, 0.45);
          transform: translateY(-2px);
        }

        .btn-secondary {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #0f172a;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 14px 20px;
          border-radius: 10px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          color: #7C3AED;
        }

        .play-icon {
          width: 36px;
          height: 36px;
          background: #0f172a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover .play-icon {
          background: #7C3AED;
        }

        .play-icon svg {
          width: 14px;
          height: 14px;
          color: white;
          margin-left: 2px;
        }

        .hero-trust {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }

        .trust-item svg {
          width: 15px;
          height: 15px;
          color: #10b981;
          flex-shrink: 0;
        }

        /* Right side - CV Card mockup */
        .hero-visual {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-visual-bg {
          position: absolute;
          inset: -20px;
          background: linear-gradient(135deg, #f8f4ff 0%, #faf5ff 50%, #f0f9ff 100%);
          border-radius: 24px;
          z-index: 0;
        }

        .cv-card {
          position: relative;
          z-index: 1;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06);
          padding: 24px;
          width: 100%;
          max-width: 380px;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .cv-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .cv-card-dots {
          display: flex;
          gap: 6px;
        }

        .cv-card-dots span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot-red { background: #ff5f57; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #28ca41; }

        .cv-card-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .cv-candidate {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .cv-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #7C3AED, #a78bfa);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .cv-candidate-info {
          flex: 1;
        }

        .cv-candidate-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 2px 0;
        }

        .cv-candidate-role {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        /* Score circle */
        .score-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .score-circle-outer {
          position: relative;
          width: 110px;
          height: 110px;
        }

        .score-circle-outer svg {
          width: 110px;
          height: 110px;
          transform: rotate(-90deg);
        }

        .score-circle-bg {
          fill: none;
          stroke: #f1f5f9;
          stroke-width: 8;
        }

        .score-circle-fill {
          fill: none;
          stroke: #7C3AED;
          stroke-width: 8;
          stroke-linecap: round;
          stroke-dasharray: 283;
          stroke-dashoffset: 40;
          transition: stroke-dashoffset 1s ease;
        }

        .score-text {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-number {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }

        .score-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          color: #94a3b8;
          font-weight: 500;
        }

        .cv-bar-section {
          margin-bottom: 16px;
        }

        .cv-bar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .cv-bar-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
        }

        .cv-bar-pct {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
        }

        .cv-bar-track {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          margin-bottom: 10px;
          overflow: hidden;
        }

        .cv-bar-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #7C3AED, #a78bfa);
        }

        .cv-justification {
          background: #f8f4ff;
          border: 1px solid #ede9fe;
          border-radius: 10px;
          padding: 12px;
        }

        .cv-justification-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: #7C3AED;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .cv-justification-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          color: #475569;
          line-height: 1.5;
        }

        /* Floating badges */
        .badge-ai {
          position: absolute;
          top: -16px;
          right: -10px;
          background: #10b981;
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 100px;
          box-shadow: 0 4px 12px rgba(16,185,129,0.4);
          z-index: 2;
          animation: float-badge 3s ease-in-out infinite;
        }

        @keyframes float-badge {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
        }

        .badge-speed {
          position: absolute;
          bottom: -16px;
          left: -10px;
          background: white;
          border: 1px solid #e2e8f0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #0f172a;
          padding: 6px 14px;
          border-radius: 100px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: float-badge2 3.5s ease-in-out infinite;
        }

        @keyframes float-badge2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        .badge-speed-dot {
          width: 7px;
          height: 7px;
          background: #7C3AED;
          border-radius: 50%;
        }

        @media (max-width: 1024px) {
          .hero-headline { font-size: 42px; }
          .hero-inner { gap: 40px; }
        }

        @media (max-width: 768px) {
          .hero-section { padding-top: 100px; padding-bottom: 60px; }
          .hero-inner {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .hero-headline { font-size: 36px; letter-spacing: -1px; }
          .hero-subtext { font-size: 15px; }
          .hero-visual { order: -1; }
          .cv-card { max-width: 320px; }
        }

        @media (max-width: 480px) {
          .hero-headline { font-size: 30px; }
          .hero-actions { flex-direction: column; align-items: flex-start; }
          .btn-primary { width: 100%; justify-content: center; }
        }
      `}</style>

      <section className="hero-section">
        <div className="hero-bg-blob" />
        <div className="hero-bg-blob-2" />

        <div className="hero-inner">
          {/* Left - Text */}
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span className="hero-badge-text">🇵🇰 Pakistani HR Focused</span>
            </div>

            <h1 className="hero-headline">
              AI Resume Screening <span className="highlight">Built for</span>{" "}
              <span className="highlight">Pakistani SMEs</span>
            </h1>

            <p className="hero-subtext">
              Screen hundreds of CVs in minutes using contextual AI that detects
              real capability—not just keyword stuffing. Experience the future
              of recruitment in Pakistan.
            </p>

            <div className="hero-actions">
              <Link href="/register" className="btn-primary">
                Start Free Trial →
              </Link>
              <button className="btn-secondary">
                <span className="play-icon">
                  <Play size={13} fill="white" />
                </span>
                Watch Demo
              </button>
            </div>

            <div className="hero-trust">
              <div className="trust-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                14-Day Free Trial
              </div>
              <div className="trust-item">
                <svg
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
            </div>
          </div>

          {/* Right - CV Card Visual */}
          <div className="hero-visual">
            <div className="hero-visual-bg" />

            <div style={{ position: "relative" }}>
              <span className="badge-ai">✨ AI Verified</span>

              <div className="cv-card">
                <div className="cv-card-header">
                  <div className="cv-card-dots">
                    <span className="dot-red" />
                    <span className="dot-yellow" />
                    <span className="dot-green" />
                  </div>
                  <span className="cv-card-label">CV Analysis</span>
                </div>

                <div className="cv-candidate">
                  <div className="cv-avatar">AK</div>
                  <div className="cv-candidate-info">
                    <p className="cv-candidate-name">Ali Khan</p>
                    <p className="cv-candidate-role">
                      Full Stack Developer · 5 yrs exp
                    </p>
                  </div>
                </div>

                {/* Score Ring */}
                <div className="score-wrapper">
                  <div className="score-circle-outer">
                    <svg viewBox="0 0 100 100">
                      <circle
                        className="score-circle-bg"
                        cx="50"
                        cy="50"
                        r="45"
                      />
                      <circle
                        className="score-circle-fill"
                        cx="50"
                        cy="50"
                        r="45"
                      />
                    </svg>
                    <div className="score-text">
                      <span className="score-number">94</span>
                      <span className="score-label">/100</span>
                    </div>
                  </div>
                </div>

                {/* Bars */}
                <div className="cv-bar-section">
                  {[
                    { label: "Technical Skills", pct: 96 },
                    { label: "Experience Match", pct: 88 },
                    { label: "Communication", pct: 91 },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="cv-bar-row">
                        <span className="cv-bar-label">{bar.label}</span>
                        <span className="cv-bar-pct">{bar.pct}%</span>
                      </div>
                      <div className="cv-bar-track">
                        <div
                          className="cv-bar-fill"
                          style={{ width: `${bar.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Justification */}
                <div className="cv-justification">
                  <div className="cv-justification-label">AI Justification</div>
                  <p className="cv-justification-text">
                    Deep expertise in Full Stack Dev. Matches Fast Stack
                    requirements. Red flags: None at this time.
                  </p>
                </div>
              </div>

              <div className="badge-speed">
                <span className="badge-speed-dot" />
                Screened 500 CVs · 8 min
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
