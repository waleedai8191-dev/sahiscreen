import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — SahiScreen",
  description: "How SahiScreen collects, uses, and protects your data.",
};

export default function PrivacyPage() {
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

      {/* Hero */}
      <div className="legal-hero">
        <div className="legal-hero-badge">Legal</div>
        <h1 className="legal-hero-title">Privacy Policy</h1>
        <p className="legal-hero-sub">Last updated: June 8, 2026</p>
      </div>

      <div className="legal-body">
        <Link href="/" className="legal-back">
          ← Back to SahiScreen
        </Link>

        <div className="legal-updated">
          Effective date: June 8, 2026 · Applies to SahiScreen platform and
          services
        </div>

        {/* Table of Contents */}
        <div className="legal-toc">
          <p className="legal-toc-title">Contents</p>
          <ul className="legal-toc-list">
            {[
              ["#collect", "Information We Collect"],
              ["#use", "How We Use Your Information"],
              ["#sharing", "Data Sharing"],
              ["#storage", "Data Storage & Security"],
              ["#candidates", "Candidate Data"],
              ["#rights", "Your Rights"],
              ["#cookies", "Cookies"],
              ["#contact", "Contact Us"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href}>{label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Intro */}
        <div className="legal-section">
          <p className="legal-p">
            SahiScreen ("we", "us", "our") operates an AI-powered CV screening
            platform. This Privacy Policy explains how we collect, use,
            disclose, and safeguard information when you use our service. By
            using SahiScreen, you agree to the practices described here.
          </p>
          <div className="legal-highlight">
            <p>
              SahiScreen processes CV data on behalf of hiring companies. We act
              as a data processor — the company using our platform is the data
              controller responsible for how candidate data is used.
            </p>
          </div>
        </div>

        {/* 1 */}
        <div className="legal-section" id="collect">
          <p className="legal-section-number">01</p>
          <h2 className="legal-section-title">Information We Collect</h2>
          <p className="legal-p">
            <strong>Account Information:</strong>
          </p>
          <ul className="legal-list">
            <li>Full name and company name provided at registration</li>
            <li>Work email address and encrypted password</li>
            <li>
              Billing information (processed securely — we do not store card
              numbers)
            </li>
            <li>Plan tier and subscription status</li>
          </ul>
          <p className="legal-p">
            <strong>Usage Data:</strong>
          </p>
          <ul className="legal-list">
            <li>Pages visited and features used within the dashboard</li>
            <li>Number of CVs uploaded and screened</li>
            <li>Job postings created and their status</li>
            <li>Browser type, device type, and IP address (for security)</li>
          </ul>
          <p className="legal-p">
            <strong>Candidate CV Data (processed on your behalf):</strong>
          </p>
          <ul className="legal-list">
            <li>
              CV files uploaded by you or submitted via your public apply link
            </li>
            <li>Extracted text from CVs for AI analysis</li>
            <li>Candidate name, email, and phone number if provided</li>
          </ul>
        </div>

        {/* 2 */}
        <div className="legal-section" id="use">
          <p className="legal-section-number">02</p>
          <h2 className="legal-section-title">How We Use Your Information</h2>
          <ul className="legal-list">
            <li>To provide, operate, and improve the SahiScreen platform</li>
            <li>To process CV screening using AI models (Claude, Gemini)</li>
            <li>
              To send transactional emails (account verification, screening
              results)
            </li>
            <li>To process billing and manage your subscription</li>
            <li>To detect and prevent fraud or abuse</li>
            <li>To respond to your support requests</li>
            <li>To send product updates and newsletters (opt-out available)</li>
          </ul>
          <div className="legal-highlight">
            <p>
              We do not use candidate CV data to train our AI models. CV content
              is processed in real-time and is never used to improve or retrain
              any underlying AI system.
            </p>
          </div>
        </div>

        {/* 3 */}
        <div className="legal-section" id="sharing">
          <p className="legal-section-number">03</p>
          <h2 className="legal-section-title">Data Sharing</h2>
          <p className="legal-p">
            We do not sell your data. We share data only with:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Supabase</strong> — database and file storage (hosted in
              EU region)
            </li>
            <li>
              <strong>Anthropic (Claude)</strong> — AI screening for Premium
              plan users
            </li>
            <li>
              <strong>Google (Gemini)</strong> — AI screening for Essential plan
              users
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery
            </li>
            <li>
              <strong>Payment processor</strong> — billing only, we never see
              full card details
            </li>
          </ul>
          <p className="legal-p">
            All third-party providers are contractually bound to process data
            only as instructed and maintain appropriate security measures.
          </p>
        </div>

        {/* 4 */}
        <div className="legal-section" id="storage">
          <p className="legal-section-number">04</p>
          <h2 className="legal-section-title">Data Storage & Security</h2>
          <ul className="legal-list">
            <li>All data is encrypted at rest and in transit (TLS 1.3)</li>
            <li>CV files are stored in private Supabase Storage buckets</li>
            <li>Passwords are hashed — we cannot see them</li>
            <li>Access controls ensure only your company sees your data</li>
            <li>We retain account data for 90 days after account deletion</li>
            <li>CV data is retained for 12 months from upload date</li>
          </ul>
        </div>

        {/* 5 */}
        <div className="legal-section" id="candidates">
          <p className="legal-section-number">05</p>
          <h2 className="legal-section-title">Candidate Data</h2>
          <p className="legal-p">
            If you are a job candidate who submitted a CV via a company's
            SahiScreen apply link, your CV was processed by our AI screening
            system on behalf of that company.
          </p>
          <ul className="legal-list">
            <li>
              Your CV is stored securely and visible only to the hiring company
            </li>
            <li>SahiScreen staff do not read individual CVs</li>
            <li>
              To request deletion of your CV data, contact the company directly
              or email us at privacy@sahiscreen.com with the company name
            </li>
            <li>We will process deletion requests within 30 days</li>
          </ul>
        </div>

        {/* 6 */}
        <div className="legal-section" id="rights">
          <p className="legal-section-number">06</p>
          <h2 className="legal-section-title">Your Rights</h2>
          <p className="legal-p">You have the right to:</p>
          <ul className="legal-list">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data in your account settings</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your data in a machine-readable format</li>
            <li>Opt out of marketing emails at any time</li>
            <li>
              Withdraw consent for data processing (this will terminate your
              account)
            </li>
          </ul>
          <p className="legal-p">
            To exercise these rights, email{" "}
            <strong>privacy@sahiscreen.com</strong>.
          </p>
        </div>

        {/* 7 */}
        <div className="legal-section" id="cookies">
          <p className="legal-section-number">07</p>
          <h2 className="legal-section-title">Cookies</h2>
          <ul className="legal-list">
            <li>
              <strong>Session cookies</strong> — required for authentication,
              expire on logout
            </li>
            <li>
              <strong>Preference cookies</strong> — remember your dashboard
              settings
            </li>
            <li>We do not use advertising or third-party tracking cookies</li>
            <li>
              You can disable cookies in your browser but this will break
              authentication
            </li>
          </ul>
        </div>

        {/* 8 */}
        <div className="legal-section" id="contact">
          <p className="legal-section-number">08</p>
          <h2 className="legal-section-title">Contact Us</h2>
          <p className="legal-p">
            For privacy-related questions or data requests:
          </p>
          <div className="legal-highlight">
            <p>
              Email: privacy@sahiscreen.com
              <br />
              Response time: within 5 business days
              <br />
              SahiScreen Inc. · Lahore, Pakistan
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
