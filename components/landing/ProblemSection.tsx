"use client";

import { Users, Bot, Clock, DollarSign } from "lucide-react";

const problems = [
  {
    icon: Users,
    title: "Hundreds of CVs",
    description:
      "Popular roles in Pakistan receive 500+ applications, burying your best candidates in noise.",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
  },
  {
    icon: Bot,
    title: "AI-Generated Fakes",
    description:
      "Applicants now use ChatGPT to game keyword-based ATS systems with perfect-looking but fake CVs.",
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
  },
  {
    icon: Clock,
    title: "Manual Waste",
    description:
      "HR teams spend 15+ hours per job opening just doing initial screening of unqualified profiles.",
    iconBg: "#e0f2fe",
    iconColor: "#0284c7",
  },
  {
    icon: DollarSign,
    title: "Expensive Legacy",
    description:
      "Standard ATS tools are too expensive for local SMEs and don't understand the Pakistani market.",
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
];

export default function ProblemSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .problem-section {
          padding: 96px 24px;
          background: #ffffff;
          position: relative;
        }

        .problem-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .problem-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .problem-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          margin: 0 0 0 0;
          line-height: 1.15;
        }

        .problem-title-underline {
          display: inline-block;
          position: relative;
        }

        .problem-title-underline::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -4px;
          height: 3px;
          background: #7C3AED;
          border-radius: 2px;
        }

        .problem-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 64px;
        }

        .problem-card {
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 28px 24px;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .problem-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(124,58,237,0.03), transparent);
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .problem-card:hover {
          border-color: #ddd6fe;
          box-shadow: 0 8px 32px rgba(124,58,237,0.1);
          transform: translateY(-4px);
        }

        .problem-card:hover::before {
          opacity: 1;
        }

        .problem-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .problem-card-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 10px 0;
        }

        .problem-card-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #64748b;
          line-height: 1.65;
          margin: 0;
        }

        /* Quote Banner */
        .quote-banner {
          background: #fafafa;
          border: 1px solid #f1f5f9;
          border-left: 4px solid #7C3AED;
          border-radius: 12px;
          padding: 28px 36px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          max-width: 820px;
          margin: 0 auto;
        }

        .quote-mark {
          font-family: Georgia, serif;
          font-size: 72px;
          line-height: 0.7;
          color: #7C3AED;
          opacity: 0.3;
          flex-shrink: 0;
          margin-top: 8px;
        }

        .quote-content {}

        .quote-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 17px;
          font-weight: 500;
          color: #334155;
          line-height: 1.65;
          font-style: italic;
          margin: 0 0 12px 0;
        }

        .quote-author {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.3px;
        }

        @media (max-width: 1024px) {
          .problem-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .problem-title { font-size: 32px; }
        }

        @media (max-width: 640px) {
          .problem-section { padding: 72px 24px; }
          .problem-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .problem-title { font-size: 26px; }
          .problem-header { margin-bottom: 40px; }
          .quote-banner {
            padding: 20px 20px;
            flex-direction: column;
            gap: 8px;
          }
          .quote-mark { font-size: 48px; }
          .quote-text { font-size: 15px; }
        }
      `}</style>

      <section className="problem-section" id="features">
        <div className="problem-inner">
          {/* Header */}
          <div className="problem-header">
            <h2 className="problem-title">
              Hiring in Pakistan Is{" "}
              <span className="problem-title-underline">
                Broken at the Screening Stage
              </span>
            </h2>
          </div>

          {/* Problem Cards */}
          <div className="problem-grid">
            {problems.map((problem) => {
              const Icon = problem.icon;
              return (
                <div className="problem-card" key={problem.title}>
                  <div
                    className="problem-icon-wrap"
                    style={{ background: problem.iconBg }}
                  >
                    <Icon
                      size={24}
                      style={{ color: problem.iconColor }}
                      strokeWidth={1.8}
                    />
                  </div>
                  <h3 className="problem-card-title">{problem.title}</h3>
                  <p className="problem-card-desc">{problem.description}</p>
                </div>
              );
            })}
          </div>

          {/* Quote Banner */}
          <div className="quote-banner">
            <div className="quote-mark">"</div>
            <div className="quote-content">
              <p className="quote-text">
                We were missing top talent from smaller cities because our
                manual review process was too slow to keep up with the volume.
              </p>
              <span className="quote-author">
                — HR Manager, Pakistani Tech Company
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
