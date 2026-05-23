"use client";

import { Upload, Files, Cpu, ListOrdered, Download } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Upload,
    title: "Upload JD",
    description:
      "Paste your job description or requirements directly into SahiScreen.",
    color: "#0284c7",
    bg: "#e0f2fe",
    active: false,
  },
  {
    number: 2,
    icon: Files,
    title: "Bulk CVs",
    description:
      "Drag and drop 500 PDFs at once. We handle extraction automatically.",
    color: "#d97706",
    bg: "#fef3c7",
    active: false,
  },
  {
    number: 3,
    icon: Cpu,
    title: "AI Screening",
    description:
      "Our models read, evaluate and analyse every candidate with depth.",
    color: "#7C3AED",
    bg: "#f3f0ff",
    active: true,
  },
  {
    number: 4,
    icon: ListOrdered,
    title: "Ranked List",
    description:
      "Get a 1–100 ranked list with detailed justifications per candidate.",
    color: "#16a34a",
    bg: "#f0fdf4",
    active: false,
  },
  {
    number: 5,
    icon: Download,
    title: "Export",
    description: "Directly export the top 10 shortlist to your team instantly.",
    color: "#dc2626",
    bg: "#fee2e2",
    active: false,
  },
];

export default function HowItWorks() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .hiw-section {
          padding: 96px 24px;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }

        .hiw-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hiw-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .hiw-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          margin: 0 0 12px 0;
          line-height: 1.15;
        }

        .hiw-subtitle {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #64748b;
          margin: 0 0 64px 0;
        }

        .hiw-subtitle span {
          color: #7C3AED;
          font-weight: 600;
        }

        /* Steps row */
        .hiw-steps {
          display: flex;
          align-items: flex-start;
          gap: 0;
          position: relative;
          margin-bottom: 0;
        }

        /* Connector line between steps */
        .hiw-steps::before {
          content: '';
          position: absolute;
          top: 52px;
          left: calc(10% + 28px);
          right: calc(10% + 28px);
          height: 2px;
          background: linear-gradient(90deg, #e2e8f0, #ddd6fe 50%, #e2e8f0);
          z-index: 0;
        }

        .hiw-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0 12px;
          position: relative;
          z-index: 1;
        }

        /* Number badge */
        .step-number-wrap {
          position: relative;
          margin-bottom: 20px;
        }

        .step-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .step-circle.active {
          border-color: #7C3AED;
          box-shadow: 0 0 0 6px rgba(124,58,237,0.1), 0 4px 16px rgba(124,58,237,0.25);
          background: #7C3AED;
        }

        .step-circle.active svg {
          color: white !important;
        }

        .step-number {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 22px;
          height: 22px;
          background: #0f172a;
          color: white;
          border-radius: 50%;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          z-index: 2;
        }

        .step-circle.active + .step-number,
        .active-number {
          background: #7C3AED;
        }

        .step-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .step-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        /* Active step card */
        .hiw-step.active-step .step-card {
          background: #faf5ff;
          border: 1px solid #ddd6fe;
          border-radius: 14px;
          padding: 16px 12px;
          margin-top: -8px;
        }

        .hiw-step .step-card {
          padding: 16px 4px;
        }

        /* Mobile steps */
        .hiw-steps-mobile {
          display: none;
          flex-direction: column;
          gap: 0;
          position: relative;
        }

        .hiw-steps-mobile::before {
          content: '';
          position: absolute;
          left: 27px;
          top: 28px;
          bottom: 28px;
          width: 2px;
          background: linear-gradient(to bottom, #e2e8f0, #ddd6fe 50%, #e2e8f0);
          z-index: 0;
        }

        .hiw-step-mobile {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 0;
          position: relative;
          z-index: 1;
        }

        .step-mobile-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .step-mobile-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #e2e8f0;
          background: white;
          position: relative;
          z-index: 1;
        }

        .step-mobile-circle.active {
          border-color: #7C3AED;
          background: #7C3AED;
          box-shadow: 0 0 0 5px rgba(124,58,237,0.1);
        }

        .step-mobile-circle.active svg {
          color: white !important;
        }

        .step-mobile-num {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          margin-top: 4px;
        }

        .step-mobile-right {
          padding-top: 12px;
          flex: 1;
        }

        .step-mobile-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .step-mobile-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }

        .step-mobile-right.active {
          background: #faf5ff;
          border: 1px solid #ddd6fe;
          border-radius: 12px;
          padding: 14px 16px;
        }

        @media (max-width: 768px) {
          .hiw-section { padding: 72px 24px; }
          .hiw-title { font-size: 28px; }
          .hiw-steps { display: none; }
          .hiw-steps-mobile { display: flex; }
          .hiw-subtitle { margin-bottom: 40px; font-size: 14px; }
        }

        @media (max-width: 480px) {
          .hiw-title { font-size: 24px; }
        }
      `}</style>

      <section className="hiw-section" id="how-it-works">
        <div className="hiw-inner">
          {/* Header */}
          <div className="hiw-header">
            <h2 className="hiw-title">From Chaos to Shortlist in 4 Steps</h2>
            <p className="hiw-subtitle">
              Screening 500 candidates used to take 2 weeks.{" "}
              <span>Now it takes 10 minutes.</span>
            </p>
          </div>

          {/* Desktop Steps */}
          <div className="hiw-steps">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={`hiw-step ${step.active ? "active-step" : ""}`}
                >
                  <div className="step-number-wrap">
                    <div
                      className={`step-circle ${step.active ? "active" : ""}`}
                    >
                      <Icon
                        size={22}
                        strokeWidth={1.8}
                        style={{ color: step.active ? "white" : step.color }}
                      />
                    </div>
                    <div
                      className="step-number"
                      style={{
                        background: step.active ? "#7C3AED" : "#0f172a",
                      }}
                    >
                      {step.number}
                    </div>
                  </div>

                  <div
                    className={`step-card ${step.active ? "active-card" : ""}`}
                  >
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-desc">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Steps */}
          <div className="hiw-steps-mobile">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div className="hiw-step-mobile" key={step.number}>
                  <div className="step-mobile-left">
                    <div
                      className={`step-mobile-circle ${step.active ? "active" : ""}`}
                    >
                      <Icon
                        size={22}
                        strokeWidth={1.8}
                        style={{ color: step.active ? "white" : step.color }}
                      />
                    </div>
                    <span className="step-mobile-num">0{step.number}</span>
                  </div>
                  <div
                    className={`step-mobile-right ${step.active ? "active" : ""}`}
                  >
                    <h3 className="step-mobile-title">{step.title}</h3>
                    <p className="step-mobile-desc">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
