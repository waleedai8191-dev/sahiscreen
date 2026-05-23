"use client";

import Link from "next/link";
import { useState } from "react";
import { Send } from "lucide-react";

const footerLinks = {
  platform: [
    { label: "Pricing", href: "#pricing" },
    { label: "AI Tech", href: "#ai-tech" },
    { label: "Security Status", href: "#security" },
  ],
  company: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Contact Support", href: "/contact" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .footer {
          background: #0a0f1a;
          padding: 64px 24px 32px;
          position: relative;
          overflow: hidden;
        }

        .footer-top-border {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #7C3AED 30%, #a78bfa 50%, #7C3AED 70%, transparent);
        }

        .footer-glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 200px;
          background: radial-gradient(ellipse at top, rgba(124,58,237,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Top grid */
        .footer-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1.4fr;
          gap: 48px;
          margin-bottom: 48px;
        }

        /* Brand col */
        .footer-brand {}

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          margin-bottom: 16px;
        }

        .footer-logo-icon {
          width: 32px;
          height: 32px;
          background: #7C3AED;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .footer-logo-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
        }

        .footer-brand-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #475569;
          line-height: 1.7;
          margin: 0 0 20px 0;
          max-width: 240px;
        }

        .footer-brand-tagline {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .footer-brand-tagline::before {
          content: '';
          width: 16px;
          height: 1px;
          background: #7C3AED;
          display: inline-block;
        }

        /* Link cols */
        .footer-col-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin: 0 0 20px 0;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-links a {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .footer-links a:hover {
          color: #a78bfa;
        }

        .footer-links a::before {
          content: '';
          width: 0;
          height: 1px;
          background: #7C3AED;
          transition: width 0.2s ease;
          display: inline-block;
        }

        .footer-links a:hover::before {
          width: 8px;
        }

        /* Newsletter col */
        .footer-newsletter {}

        .footer-newsletter-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #64748b;
          font-weight: 400;
          line-height: 1.6;
          margin: 0 0 16px 0;
        }

        .newsletter-form {
          display: flex;
          gap: 0;
          border: 1px solid #1e293b;
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .newsletter-form:focus-within {
          border-color: #7C3AED;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
        }

        .newsletter-input {
          flex: 1;
          background: #0f172a;
          border: none;
          outline: none;
          padding: 11px 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #e2e8f0;
          min-width: 0;
        }

        .newsletter-input::placeholder {
          color: #334155;
        }

        .newsletter-btn {
          background: #7C3AED;
          border: none;
          cursor: pointer;
          padding: 11px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }

        .newsletter-btn:hover {
          background: #6d28d9;
        }

        .newsletter-success {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 0;
        }

        .footer-newsletter-note {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          color: #334155;
          margin-top: 10px;
          font-weight: 400;
        }

        /* Divider */
        .footer-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #1e293b 20%, #1e293b 80%, transparent);
          margin-bottom: 28px;
        }

        /* Bottom bar */
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-copyright {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #334155;
          font-weight: 400;
          line-height: 1.6;
        }

        .footer-copyright span {
          color: #475569;
          font-weight: 500;
        }

        .footer-bottom-right {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #334155;
          font-weight: 400;
        }

        .footer-flag {
          font-size: 16px;
        }

        .footer-heart {
          color: #7C3AED;
          font-size: 14px;
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 36px;
          }
        }

        @media (max-width: 640px) {
          .footer { padding: 48px 24px 28px; }
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .footer-brand-desc { max-width: 100%; }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>

      <footer className="footer">
        <div className="footer-top-border" />
        <div className="footer-glow" />

        <div className="footer-inner">
          {/* Main Grid */}
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand">
              <Link href="/" className="footer-logo">
                <div className="footer-logo-icon">
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
                <span className="footer-logo-text">SahiScreen</span>
              </Link>
              <p className="footer-brand-desc">
                The intelligent backbone for Pakistan's most efficient hiring
                teams. Screen smarter, hire better.
              </p>
              <span className="footer-brand-tagline">
                Get Pakistani HR insights
              </span>
            </div>

            {/* Platform */}
            <div>
              <p className="footer-col-title">Platform</p>
              <ul className="footer-links">
                {footerLinks.platform.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="footer-col-title">Company</p>
              <ul className="footer-links">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="footer-newsletter">
              <p className="footer-col-title">Newsletter</p>
              <p className="footer-newsletter-desc">
                Get Pakistani HR insights delivered to your inbox monthly.
              </p>

              {subscribed ? (
                <div className="newsletter-success">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  You're subscribed!
                </div>
              ) : (
                <>
                  <form className="newsletter-form" onSubmit={handleSubscribe}>
                    <input
                      type="email"
                      className="newsletter-input"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="newsletter-btn"
                      aria-label="Subscribe"
                    >
                      <Send size={14} color="white" />
                    </button>
                  </form>
                  <p className="footer-newsletter-note">
                    No spam. Unsubscribe anytime.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="footer-divider" />

          {/* Bottom bar */}
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2026 <span>SahiScreen Inc.</span> All rights reserved. Built for
              the future of intelligence in Pakistan.
            </p>
            <div className="footer-bottom-right">
              Built with <span className="footer-heart">♥</span> in Pakistan
              <span className="footer-flag">🇵🇰</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
