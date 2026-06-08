import Link from "next/link";

export const metadata = {
  title: "Terms of Service — SahiScreen",
  description: "Terms and conditions for using SahiScreen.",
};

export default function TermsPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .legal-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #ffffff;
          min-height: 100vh;
        }

        .legal-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          padding: 80px 24px 60px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .legal-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 600px; height: 300px;
          background: radial-gradient(ellipse at top, rgba(124,58,237,0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        .legal-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(124,58,237,0.2);
          border: 1px solid rgba(124,58,237,0.3);
          border-radius: 100px;
          padding: 4px 14px;
          font-size: 11px;
          font-weight: 700;
          color: #a78bfa;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .legal-hero-title {
          font-size: 40px;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
          margin: 0 0 12px;
        }

        .legal-hero-sub {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .legal-body {
          max-width: 760px;
          margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .legal-toc {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px 28px;
          margin-bottom: 48px;
        }

        .legal-toc-title {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .legal-toc-list {
          list-style: none;
          padding: 0; margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .legal-toc-list a {
          font-size: 13px;
          font-weight: 500;
          color: #7C3AED;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legal-toc-list a:hover { text-decoration: underline; }

        .legal-toc-list a::before {
          content: '';
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #7C3AED;
          flex-shrink: 0;
        }

        .legal-section {
          margin-bottom: 48px;
          scroll-margin-top: 80px;
        }

        .legal-section-number {
          font-size: 11px;
          font-weight: 700;
          color: #7C3AED;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .legal-section-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.3px;
          margin: 0 0 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .legal-p {
          font-size: 14px;
          color: #475569;
          line-height: 1.8;
          margin: 0 0 14px;
        }

        .legal-p:last-child { margin-bottom: 0; }

        .legal-list {
          list-style: none;
          padding: 0; margin: 0 0 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .legal-list li {
          font-size: 14px;
          color: #475569;
          line-height: 1.7;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .legal-list li::before {
          content: '→';
          color: #7C3AED;
          font-weight: 600;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .legal-highlight {
          background: #f3f0ff;
          border: 1px solid #ddd6fe;
          border-left: 3px solid #7C3AED;
          border-radius: 0 8px 8px 0;
          padding: 14px 18px;
          margin: 16px 0;
        }

        .legal-highlight p {
          font-size: 13px;
          color: #5b21b6;
          line-height: 1.7;
          margin: 0;
          font-weight: 500;
        }

        .legal-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #7C3AED;
          text-decoration: none;
          margin-bottom: 40px;
          transition: gap 0.2s;
        }

        .legal-back:hover { gap: 10px; }

        .legal-updated {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 40px;
          padding: 10px 16px;
          background: #f8fafc;
          border-radius: 8px;
          display: inline-block;
        }

        @media (max-width: 640px) {
          .legal-hero-title { font-size: 28px; }
          .legal-body { padding: 40px 20px 60px; }
        }
      `}</style>

      <div className="legal-hero">
        <div className="legal-hero-badge">Legal</div>
        <h1 className="legal-hero-title">Terms of Service</h1>
        <p className="legal-hero-sub">Last updated: June 8, 2026</p>
      </div>

      <div className="legal-body">
        <Link href="/" className="legal-back">
          ← Back to SahiScreen
        </Link>
        <div className="legal-updated">
          Effective date: June 8, 2026 · By using SahiScreen you agree to these
          terms
        </div>

        <div className="legal-toc">
          <p className="legal-toc-title">Contents</p>
          <ul className="legal-toc-list">
            {[
              ["#service", "The Service"],
              ["#accounts", "Accounts & Access"],
              ["#use", "Acceptable Use"],
              ["#data", "Your Data"],
              ["#billing", "Billing & Refunds"],
              ["#ai", "AI Screening Disclaimer"],
              ["#liability", "Limitation of Liability"],
              ["#termination", "Termination"],
              ["#contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href}>{label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="legal-section">
          <p className="legal-p">
            These Terms of Service govern your use of the SahiScreen platform
            operated by SahiScreen Inc. By creating an account or using our
            service, you agree to be bound by these terms.
          </p>
        </div>

        <div className="legal-section" id="service">
          <p className="legal-section-number">01</p>
          <h2 className="legal-section-title">The Service</h2>
          <p className="legal-p">
            SahiScreen provides an AI-powered CV screening platform for
            businesses. We offer tools for job posting, CV upload and parsing,
            AI-based candidate scoring, and hiring management.
          </p>
          <ul className="legal-list">
            <li>Service is provided on a subscription basis (monthly)</li>
            <li>Features vary by plan tier (Free, Essential, Premium)</li>
            <li>
              We reserve the right to modify or discontinue features with 30
              days notice
            </li>
            <li>Uptime target is 99.5% — scheduled maintenance excluded</li>
          </ul>
        </div>

        <div className="legal-section" id="accounts">
          <p className="legal-section-number">02</p>
          <h2 className="legal-section-title">Accounts & Access</h2>
          <ul className="legal-list">
            <li>You must be 18 or older and represent a legitimate business</li>
            <li>
              One account per company — team members can be added under your
              account
            </li>
            <li>You are responsible for all activity under your account</li>
            <li>You must provide accurate company and contact information</li>
            <li>
              Sharing login credentials with external parties is prohibited
            </li>
            <li>
              You must notify us immediately of any unauthorized account access
            </li>
          </ul>
        </div>

        <div className="legal-section" id="use">
          <p className="legal-section-number">03</p>
          <h2 className="legal-section-title">Acceptable Use</h2>
          <p className="legal-p">You agree not to:</p>
          <ul className="legal-list">
            <li>
              Use SahiScreen to discriminate based on gender, religion,
              ethnicity, or age
            </li>
            <li>
              Upload CVs of individuals without a legitimate hiring purpose
            </li>
            <li>Attempt to reverse-engineer, scrape, or copy our AI systems</li>
            <li>Use the platform to process data unrelated to hiring</li>
            <li>
              Share apply links publicly for purposes other than genuine job
              postings
            </li>
            <li>Exceed your plan's CV limit through technical circumvention</li>
          </ul>
          <div className="legal-highlight">
            <p>
              You are solely responsible for ensuring your use of SahiScreen
              complies with Pakistan's employment laws and any applicable data
              protection regulations.
            </p>
          </div>
        </div>

        <div className="legal-section" id="data">
          <p className="legal-section-number">04</p>
          <h2 className="legal-section-title">Your Data</h2>
          <ul className="legal-list">
            <li>You retain ownership of all data you upload to SahiScreen</li>
            <li>
              You grant us a limited license to process that data to provide the
              service
            </li>
            <li>
              You are responsible for obtaining candidate consent where required
              by law
            </li>
            <li>
              On account termination, you have 30 days to export your data
            </li>
            <li>After 30 days, data is permanently deleted from our systems</li>
          </ul>
        </div>

        <div className="legal-section" id="billing">
          <p className="legal-section-number">05</p>
          <h2 className="legal-section-title">Billing & Refunds</h2>
          <ul className="legal-list">
            <li>Subscriptions are billed monthly in PKR</li>
            <li>
              No refunds for partial months — you keep access until period ends
            </li>
            <li>Free plan has no time limit — use it as long as you need</li>
            <li>Upgrading mid-month is prorated</li>
            <li>Downgrading takes effect at the next billing cycle</li>
            <li>
              If payment fails, account downgrades to Free after 7 days grace
              period
            </li>
          </ul>
        </div>

        <div className="legal-section" id="ai">
          <p className="legal-section-number">06</p>
          <h2 className="legal-section-title">AI Screening Disclaimer</h2>
          <div className="legal-highlight">
            <p>
              SahiScreen's AI scoring is a decision-support tool, not a final
              hiring decision. AI scores reflect pattern matching against job
              requirements — they are not a judgment of a person's worth or
              capabilities. Always apply human judgment before rejecting
              candidates.
            </p>
          </div>
          <ul className="legal-list">
            <li>AI scores may contain errors — we do not guarantee accuracy</li>
            <li>Scores vary based on CV quality and job description clarity</li>
            <li>
              We are not liable for hiring decisions made based on AI output
            </li>
            <li>
              You are responsible for compliance with fair hiring practices
            </li>
          </ul>
        </div>

        <div className="legal-section" id="liability">
          <p className="legal-section-number">07</p>
          <h2 className="legal-section-title">Limitation of Liability</h2>
          <p className="legal-p">
            To the maximum extent permitted by law, SahiScreen's liability is
            limited to the amount you paid us in the 3 months preceding any
            claim. We are not liable for indirect, incidental, or consequential
            damages including lost profits, data loss, or hiring outcomes.
          </p>
        </div>

        <div className="legal-section" id="termination">
          <p className="legal-section-number">08</p>
          <h2 className="legal-section-title">Termination</h2>
          <ul className="legal-list">
            <li>
              You can cancel your account at any time from Billing settings
            </li>
            <li>
              We may suspend accounts that violate these terms without notice
            </li>
            <li>
              We may terminate the service with 60 days notice to all users
            </li>
            <li>Upon termination, your data export window is 30 days</li>
          </ul>
        </div>

        <div className="legal-section" id="contact">
          <p className="legal-section-number">09</p>
          <h2 className="legal-section-title">Contact</h2>
          <div className="legal-highlight">
            <p>
              Email: legal@sahiscreen.com
              <br />
              SahiScreen Inc. · Lahore, Pakistan
              <br />
              Response time: within 5 business days
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
