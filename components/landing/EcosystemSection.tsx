"use client";
import nestleLogo from "../../public/images/nestle.png";
import engroLogo from "../../public/images/engro.png";
import alfalahLogo from "../../public/images/bank-alfalah.png";
import jazzLogo from "../../public/images/jazz.png";
// import systemsLogo from "@/assets/logos/systems.png";
import hblLogo from "../../public/images/hbl.png";

const brands = [
  { name: "Nestlé", src: nestleLogo.src },
  { name: "Engro", src: engroLogo.src },
  { name: "Bank Alfalah", src: alfalahLogo.src },
  { name: "Jazz", src: jazzLogo.src },
  { name: "HBL", src: hblLogo.src },
];

const bullets = [
  {
    text: "LUMS / IBA / NUST Ranking",
    color: "#7C3AED",
    bg: "#f3f0ff",
  },
  {
    text: "ACCA / ACAP Recognition",
    color: "#0284c7",
    bg: "#e0f2fe",
  },
  {
    text: "Local Gap (Engro, HBL, etc.)",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    text: "Regional Job Market Nuances",
    color: "#d97706",
    bg: "#fef3c7",
  },
];

export default function EcosystemSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .ecosystem-section {
          padding: 96px 24px;
          background: #f8fafc;
          position: relative;
          overflow: hidden;
        }

        .ecosystem-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.05) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 80%, rgba(16,185,129,0.04) 0%, transparent 55%);
          pointer-events: none;
        }

        .ecosystem-inner {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        /* Left side */
        .ecosystem-left {}

        .ecosystem-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f3f0ff;
          border: 1px solid #ddd6fe;
          border-radius: 100px;
          padding: 5px 14px;
          margin-bottom: 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #7C3AED;
          letter-spacing: 0.4px;
        }

        .ecosystem-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          line-height: 1.15;
          margin: 0 0 20px 0;
        }

        .ecosystem-title .highlight {
          color: #7C3AED;
        }

        .ecosystem-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #64748b;
          line-height: 1.7;
          margin: 0 0 36px 0;
          max-width: 460px;
        }

        .ecosystem-bullets {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .ecosystem-bullet {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          background: white;
          border: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .ecosystem-bullet:hover {
          border-color: #ddd6fe;
          box-shadow: 0 4px 12px rgba(124,58,237,0.08);
          transform: translateY(-2px);
        }

        .bullet-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .bullet-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          line-height: 1.4;
        }

        /* Right side - Brand grid card */
        .ecosystem-right {}

        .brand-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
        }

        .brand-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #7C3AED, #a78bfa, #7C3AED);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .brand-card-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 28px;
        }

        .brand-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .brand-row:last-child {
          margin-bottom: 0;
        }

        .brand-chip {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 22px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #334155;
          letter-spacing: -0.3px;
          transition: all 0.2s ease;
          cursor: default;
          min-width: 100px;
          text-align: center;
        }

        .brand-chip:hover {
          border-color: #7C3AED;
          color: #7C3AED;
          background: #faf5ff;
          transform: scale(1.04);
          box-shadow: 0 4px 16px rgba(124,58,237,0.12);
        }

        .brand-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin: 20px 0;
        }

        .brand-footer {
          text-align: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        .brand-footer span {
          color: #7C3AED;
          font-weight: 700;
        }

        /* Stats row inside card */
        .brand-stats {
          display: flex;
          gap: 0;
          border-top: 1px solid #f1f5f9;
          margin-top: 24px;
          padding-top: 20px;
        }

        .brand-stat {
          flex: 1;
          text-align: center;
          padding: 0 12px;
          border-right: 1px solid #f1f5f9;
        }

        .brand-stat:last-child {
          border-right: none;
        }

        .brand-stat-num {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #7C3AED;
          display: block;
          margin-bottom: 2px;
        }

        .brand-stat-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #94a3b8;
        }
          .marquee-wrapper {
  overflow: hidden;
  position: relative;
  margin-bottom: 12px;
   width: 100%;        
  max-width: 100%;  
}
.marquee-wrapper::before,
.marquee-wrapper::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  width: 48px;
  z-index: 2;
  pointer-events: none;
}
.marquee-wrapper::before { left: 0; background: linear-gradient(to right, #fff, transparent); }
.marquee-wrapper::after  { right: 0; background: linear-gradient(to left, #fff, transparent); }

.marquee-track {
  display: flex;
  gap: 14px;
  width: max-content;
  will-change: transform;
}
.marquee-track.ltr { animation: scroll-ltr 18s linear infinite; }
.marquee-track.rtl { animation: scroll-rtl 22s linear infinite; }

@keyframes scroll-ltr {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes scroll-rtl {
  0%   { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
.marquee-wrapper:hover .marquee-track { animation-play-state: paused; }

.logo-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 22px;
  min-width: 110px;
}
.logo-chip img {
  height: 28px;
  width: auto;
  max-width: 100px;
  object-fit: contain;
}

        @media (max-width: 1024px) {
          .ecosystem-inner { gap: 48px; }
          .ecosystem-title { font-size: 30px; }
        }

        @media (max-width: 768px) {
          .ecosystem-section { padding: 72px 24px; }
          .ecosystem-inner {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .ecosystem-title { font-size: 28px; }
          .ecosystem-desc { font-size: 15px; }
        }

        @media (max-width: 480px) {
          .ecosystem-bullets { grid-template-columns: 1fr; }
          .ecosystem-title { font-size: 24px; }
          .brand-chip { padding: 10px 14px; font-size: 13px; min-width: 80px; }
          .brand-card { padding: 24px 20px; }
        }
      `}</style>

      <section className="ecosystem-section" id="about">
        <div className="ecosystem-bg" />
        <div className="ecosystem-inner">
          {/* Left */}
          <div className="ecosystem-left">
            <div className="ecosystem-badge">🇵🇰 Built for Pakistan</div>

            <h2 className="ecosystem-title">
              Designed for the{" "}
              <span className="highlight">Pakistani Ecosystem</span>
            </h2>

            <p className="ecosystem-desc">
              Unlike generic global ATS, SahiScreen knows the local landscape.
              It understands the rigor of Pakistani degree programs and the
              weight of regional industry leaders.
            </p>

            <div className="ecosystem-bullets">
              {bullets.map((b) => (
                <div className="ecosystem-bullet" key={b.text}>
                  <span
                    className="bullet-dot"
                    style={{ background: b.color }}
                  />
                  <span className="bullet-text">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Brand Grid */}
          <div
            className="ecosystem-right"
            style={{ minWidth: 0, overflow: "hidden" }}
          >
            <div className="brand-card">
              <p className="brand-card-label">Trusted by teams from</p>

              {/* Row 1 — left to right */}
              <div className="marquee-wrapper">
                <div className="marquee-track ltr">
                  {[...brands, ...brands].map((b, i) => (
                    <div className="logo-chip" key={i}>
                      <img src={b.src} alt={b.name} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2 — right to left */}
              <div className="marquee-wrapper">
                <div className="marquee-track rtl">
                  {[...[...brands].reverse(), ...[...brands].reverse()].map(
                    (b, i) => (
                      <div className="logo-chip" key={i}>
                        <img src={b.src} alt={b.name} />
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="brand-divider" />
              <p className="brand-footer">
                + <span>40 more</span> Pakistani companies onboarded
              </p>

              <div className="brand-stats">
                <div className="brand-stat">
                  <span className="brand-stat-num">50+</span>
                  <span className="brand-stat-label">HR Teams</span>
                </div>
                <div className="brand-stat">
                  <span className="brand-stat-num">40%</span>
                  <span className="brand-stat-label">Better Hires</span>
                </div>
                <div className="brand-stat">
                  <span className="brand-stat-num">10x</span>
                  <span className="brand-stat-label">Faster Screen</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
