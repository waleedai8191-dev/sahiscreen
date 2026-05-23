"use client";
import founderPhoto from "../../public/images/founder.png";
export default function FounderSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .founder-section {
          padding: 96px 24px;
          background: #f8fafc;
          position: relative;
          overflow: hidden;
        }

        .founder-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.05) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 50%, rgba(16,185,129,0.03) 0%, transparent 55%);
          pointer-events: none;
        }

        .founder-inner {
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .founder-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .founder-header-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #7C3AED;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .founder-header-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          margin: 0;
          line-height: 1.15;
        }

        /* Main founder card */
        .founder-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 48px 52px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 48px;
          align-items: center;
          box-shadow: 0 8px 40px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
        }

        .founder-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: linear-gradient(to bottom, #7C3AED, #a78bfa);
          border-radius: 4px 0 0 4px;
        }

        /* Avatar side */
        .founder-avatar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          min-width: 140px;
        }

        .founder-avatar-ring {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED, #a78bfa);
          padding: 3px;
          box-shadow: 0 8px 28px rgba(124,58,237,0.3);
        }

        .founder-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #f3f0ff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 3px solid white;
        }

        .founder-avatar-initials {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #7C3AED;
          letter-spacing: -1px;
        }

        .founder-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          text-align: center;
          margin: 0;
          line-height: 1.3;
        }

        .founder-role {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #7C3AED;
          text-align: center;
          background: #f3f0ff;
          border: 1px solid #ddd6fe;
          border-radius: 100px;
          padding: 3px 12px;
          letter-spacing: 0.3px;
        }

        /* Quote side */
        .founder-quote-col {}

        .quote-mark-large {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 96px;
          line-height: 0.6;
          color: #7C3AED;
          opacity: 0.15;
          display: block;
          margin-bottom: 16px;
          user-select: none;
        }

        .founder-quote-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          font-weight: 500;
          color: #334155;
          line-height: 1.75;
          font-style: italic;
          margin: 0 0 24px 0;
        }

        .founder-quote-text strong {
          font-style: normal;
          font-weight: 700;
          color: #0f172a;
        }

        /* Tags below quote */
        .founder-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .founder-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 100px;
          border: 1px solid;
        }

        .founder-tag.purple {
          background: #f3f0ff;
          border-color: #ddd6fe;
          color: #7C3AED;
        }

        .founder-tag.blue {
          background: #e0f2fe;
          border-color: #bae6fd;
          color: #0284c7;
        }

        .founder-tag.green {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #16a34a;
        }

        /* Companies row */
        .founder-companies {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .founder-companies-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
        }

        .company-pill {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 3px 10px;
        }

        @media (max-width: 768px) {
          .founder-section { padding: 72px 24px; }
          .founder-card {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 36px 28px;
            text-align: center;
          }
          .founder-avatar-col {
            margin: 0 auto;
          }
          .founder-tags {
            justify-content: center;
          }
          .founder-companies {
            justify-content: center;
          }
          .founder-header-title { font-size: 28px; }
          .founder-quote-text { font-size: 16px; }
          .quote-mark-large { font-size: 64px; }
        }

        @media (max-width: 480px) {
          .founder-card { padding: 28px 20px; }
          .founder-header-title { font-size: 24px; }
          .founder-quote-text { font-size: 15px; }
          .founder-avatar-ring { width: 100px; height: 100px; }
          .founder-avatar-initials { font-size: 26px; }
        }
      `}</style>

      <section className="founder-section" id="security">
        <div className="founder-bg" />
        <div className="founder-inner">
          {/* Header */}
          <div className="founder-header">
            <p className="founder-header-label">Led by Experience</p>
            <h2 className="founder-header-title">
              Built by Someone Who Lived This Problem
            </h2>
          </div>

          {/* Founder Card */}
          <div className="founder-card">
            {/* Avatar Column */}
            <div className="founder-avatar-col">
              <div className="founder-avatar-ring">
                <div className="founder-avatar-inner">
                  <img
                    src={founderPhoto.src}
                    alt="Asad Ali Sahi"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
              <p className="founder-name">Asad Ali Sahi</p>
              <span className="founder-role">Founder — SahiHR</span>
            </div>

            {/* Quote Column */}
            <div className="founder-quote-col">
              <span className="quote-mark-large">"</span>
              <p className="founder-quote-text">
                After seeing thousands of CVs at companies like{" "}
                <strong>Nestle</strong> and <strong>Pepsi</strong>, I realized
                HR managers in Pakistan are drowning. SahiScreen was born from a
                need for local intelligence — understanding where a{" "}
                <strong>NUST grad</strong> fits better than an{" "}
                <strong>IBA grad</strong> for specific technical roles.
              </p>

              <div className="founder-tags">
                <span className="founder-tag purple"> NUST Alumni</span>
                <span className="founder-tag blue">Ex-Nestle HR</span>
                <span className="founder-tag green"> 10k+ CVs Reviewed</span>
              </div>

              {/* <div className="founder-companies">
                <span className="founder-companies-label">Previously at:</span>
                <span className="company-pill">Nestle</span>
                <span className="company-pill">Pepsi</span>
                <span className="company-pill">SahiHR</span>
              </div> */}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
