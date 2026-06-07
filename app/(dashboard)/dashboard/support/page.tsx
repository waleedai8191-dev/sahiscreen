"use client";

import { useState } from "react";
import {
  MessageSquare,
  Mail,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Search,
  ExternalLink,
  Send,
  CheckCircle2,
  Zap,
  FileText,
  Play,
  Users,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";

// ── FAQ Data ───────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I create my first job posting?",
        a: "Go to Jobs → New Job. Fill in the role title, department, location, and paste or type your job description. SahiScreen uses the description to define what the ideal candidate looks like — the more detail, the better the screening.",
      },
      {
        q: "How many CVs can I screen per month?",
        a: "It depends on your plan. Free Trial: 50 CVs. Essential: 500 CVs/month. Premium: 2,000 CVs/month. If you exceed your limit we'll notify you at 80% and 100% usage. You can upgrade at any time from the Billing page.",
      },
      {
        q: "What CV formats does SahiScreen support?",
        a: "We accept PDF, DOCX, and DOC files. Each file should be under 10MB. We recommend PDFs for best parsing accuracy. Scanned image-only PDFs may have reduced accuracy.",
      },
    ],
  },
  {
    category: "Screening & AI",
    questions: [
      {
        q: "How does the AI screening work?",
        a: "SahiScreen extracts structured data from each CV — skills, experience, education, and tenure — then scores each candidate against your job description using semantic matching. Candidates are ranked with a match score and a short explanation.",
      },
      {
        q: "Can I adjust the screening criteria?",
        a: "Yes. When creating or editing a job, you can set required skills, minimum years of experience, mandatory qualifications, and a custom scoring rubric. The AI will weigh these factors accordingly.",
      },
      {
        q: "How accurate is the AI screening?",
        a: "SahiScreen typically achieves 85–92% agreement with senior recruiters on structured roles. Accuracy is highest for technical roles (software, engineering, finance) and lower for creative or leadership roles where human judgment is more subjective. We always recommend a human review of the top shortlist.",
      },
    ],
  },
  {
    category: "Billing & Plans",
    questions: [
      {
        q: "What happens when my free trial ends?",
        a: "After your trial you can choose a paid plan to continue. Your data — jobs and screened candidates — is retained for 30 days after trial expiry. After that it is permanently deleted unless you upgrade.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, you can cancel any time from Billing & Plan. Your plan stays active until the end of the billing period. We do not offer pro-rated refunds for mid-cycle cancellations.",
      },
      {
        q: "Do unused CV screenings roll over?",
        a: "No. Monthly CV credits reset on your billing date and do not carry over. Annual plan holders receive their full yearly allocation upfront, which can be used at any pace.",
      },
    ],
  },
];

const QUICK_LINKS = [
  { icon: Play, label: "Video: Upload your first CVs", tag: "2 min" },
  { icon: FileText, label: "Quick-start guide (PDF)", tag: "Guide" },
  { icon: Users, label: "Setting up team members", tag: "Article" },
  { icon: Zap, label: "Understanding match scores", tag: "Article" },
];

// ── FAQ Accordion ──────────────────────────────────────────────────────────

function FAQAccordion() {
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = FAQ_ITEMS.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (q) =>
        search.trim() === "" ||
        q.q.toLowerCase().includes(search.toLowerCase()) ||
        q.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.questions.length > 0);

  return (
    <div className="faq-wrap">
      <div className="faq-search-wrap">
        <Search size={14} className="faq-search-icon" />
        <input
          className="faq-search"
          placeholder="Search help articles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="faq-empty">
          <AlertCircle size={20} color="#94a3b8" />
          <p>No results for "{search}"</p>
        </div>
      ) : (
        filtered.map((cat) => (
          <div key={cat.category} className="faq-category">
            <p className="faq-category-label">{cat.category}</p>
            {cat.questions.map((item) => {
              const key = item.q;
              const isOpen = open === key;
              return (
                <div key={key} className={`faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    className="faq-question"
                    onClick={() => setOpen(isOpen ? null : key)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={16}
                      className="faq-chevron"
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                      }}
                    />
                  </button>
                  {isOpen && <div className="faq-answer">{item.a}</div>}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

// ── Contact Form ───────────────────────────────────────────────────────────

function ContactForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="sent-state">
        <div className="sent-icon">
          <CheckCircle2 size={28} color="#10b981" />
        </div>
        <h3 className="sent-title">Message sent!</h3>
        <p className="sent-sub">
          We typically respond within 4–8 business hours. You'll receive a reply
          at your registered email address.
        </p>
        <button
          className="outline-btn"
          onClick={() => {
            setSent(false);
            setSubject("");
            setMessage("");
            setCategory("general");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="contact-form">
      <div className="field-group">
        <label className="field-label">Category</label>
        <select
          className="field-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="general">General question</option>
          <option value="billing">Billing & payments</option>
          <option value="technical">Technical issue</option>
          <option value="feature">Feature request</option>
          <option value="account">Account management</option>
        </select>
      </div>
      <div className="field-group">
        <label className="field-label">Subject</label>
        <input
          className="field-input"
          placeholder="Brief summary of your issue"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="field-group">
        <label className="field-label">Message</label>
        <textarea
          className="field-textarea"
          placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, and your account email."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
        />
        <p className="char-count">{message.length} / 1000 characters</p>
      </div>
      <button
        className="send-btn"
        onClick={handleSubmit}
        disabled={sending || !subject.trim() || !message.trim()}
      >
        {sending ? (
          <>
            <Loader2 size={14} className="spin" /> Sending…
          </>
        ) : (
          <>
            <Send size={14} /> Send message
          </>
        )}
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type Tab = "faq" | "contact";

export default function SupportPage() {
  const [tab, setTab] = useState<Tab>("faq");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .support-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f8fafc;
          min-height: 100vh;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ── Hero banner ── */
        .support-hero {
          background: linear-gradient(135deg, #7C3AED 0%, #a78bfa 100%);
          border-radius: 20px;
          padding: 36px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          overflow: hidden;
          position: relative;
        }

        .support-hero::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.07);
          border-radius: 50%;
        }

        .support-hero::after {
          content: '';
          position: absolute;
          bottom: -60px; right: 100px;
          width: 140px; height: 140px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }

        .hero-text {}

        .hero-title {
          font-size: 24px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .hero-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          line-height: 1.6;
          max-width: 480px;
        }

        .hero-stats {
          display: flex;
          gap: 28px;
          flex-shrink: 0;
        }

        .hero-stat {
          text-align: center;
        }

        .hero-stat-value {
          font-size: 28px;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 4px;
        }

        .hero-stat-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          letter-spacing: 0.3px;
        }

        /* ── Body layout ── */
        .support-body {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: flex-start;
        }

        /* ── Main content card ── */
        .support-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
        }

        .support-tabs {
          display: flex;
          border-bottom: 1px solid #f1f5f9;
          padding: 0 6px;
          gap: 2px;
        }

        .support-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 18px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: -1px;
        }

        .support-tab:hover { color: #475569; }

        .support-tab.active {
          color: #7C3AED;
          border-bottom-color: #7C3AED;
        }

        .support-tab-content {
          padding: 24px 28px;
        }

        /* ── FAQ ── */
        .faq-search-wrap {
          position: relative;
          margin-bottom: 24px;
        }

        .faq-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .faq-search {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px 10px 36px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s;
          background: #f8fafc;
        }

        .faq-search:focus {
          border-color: #7C3AED;
          background: white;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
        }

        .faq-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 40px 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .faq-category {
          margin-bottom: 24px;
        }

        .faq-category-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .faq-item {
          border: 1px solid #f1f5f9;
          border-radius: 10px;
          margin-bottom: 6px;
          overflow: hidden;
          transition: border-color 0.15s;
        }

        .faq-item.open {
          border-color: #ddd6fe;
        }

        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }

        .faq-item.open .faq-question {
          background: #faf5ff;
          color: #7C3AED;
        }

        .faq-chevron {
          flex-shrink: 0;
          transition: transform 0.2s ease;
          color: #94a3b8;
        }

        .faq-item.open .faq-chevron { color: #7C3AED; }

        .faq-answer {
          padding: 0 16px 16px;
          font-size: 13px;
          color: #475569;
          line-height: 1.7;
          background: #faf5ff;
          border-top: 1px solid #ede9fe;
        }

        /* ── Contact form ── */
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .field-input, .field-select, .field-textarea {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #0f172a;
          background: white;
          outline: none;
          transition: border-color 0.2s;
        }

        .field-input:focus, .field-select:focus, .field-textarea:focus {
          border-color: #7C3AED;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
        }

        .field-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          cursor: pointer;
        }

        .field-textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.6;
        }

        .char-count {
          font-size: 11px;
          color: #94a3b8;
          text-align: right;
          margin-top: 4px;
        }

        .send-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #7C3AED;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 11px 22px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          align-self: flex-start;
        }

        .send-btn:hover:not(:disabled) {
          background: #6d28d9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sent-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 0 20px;
          gap: 12px;
        }

        .sent-icon {
          width: 56px; height: 56px;
          background: #f0fdf4;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }

        .sent-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .sent-sub {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
          max-width: 380px;
        }

        .outline-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          color: #475569;
          border: 1.5px solid #e2e8f0;
          border-radius: 9px;
          padding: 9px 18px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .outline-btn:hover {
          border-color: #7C3AED;
          color: #7C3AED;
        }

        /* ── Sidebar cards ── */
        .sidebar-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .side-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
        }

        .side-card-header {
          padding: 16px 18px 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .side-card-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        .side-card-body {
          padding: 12px;
        }

        /* Contact options */
        .contact-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
          text-decoration: none;
          border: none;
          background: none;
          width: 100%;
          font-family: 'Plus Jakarta Sans', sans-serif;
          text-align: left;
        }

        .contact-option:hover { background: #f8fafc; }

        .contact-option-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .contact-option-text {}

        .contact-option-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .contact-option-desc {
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.4;
        }

        .contact-option-arrow {
          margin-left: auto;
          color: #cbd5e1;
          align-self: center;
          flex-shrink: 0;
        }

        /* Status card */
        .status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 9px;
          margin-bottom: 4px;
          background: #f8fafc;
        }

        .status-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-label {
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          flex: 1;
          margin-left: 8px;
        }

        .status-ok {
          font-size: 11px;
          font-weight: 600;
          color: #10b981;
        }

        /* Quick links */
        .quick-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 9px;
          cursor: pointer;
          transition: background 0.15s;
          text-decoration: none;
          border: none;
          background: none;
          width: 100%;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .quick-link:hover { background: #f8fafc; }

        .ql-icon {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: #f3f0ff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .ql-label {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          flex: 1;
          text-align: left;
        }

        .ql-tag {
          font-size: 10px;
          font-weight: 600;
          color: #7C3AED;
          background: #f3f0ff;
          border-radius: 4px;
          padding: 2px 6px;
        }

        /* ── Spinner ── */
        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .support-body { grid-template-columns: 1fr; }
          .sidebar-stack { flex-direction: row; flex-wrap: wrap; }
          .side-card { flex: 1; min-width: 260px; }
        }

        @media (max-width: 640px) {
          .support-root { padding: 16px; }
          .support-hero { padding: 24px 20px; flex-direction: column; }
          .hero-stats { width: 100%; justify-content: space-around; }
          .support-tab-content { padding: 18px; }
          .sidebar-stack { flex-direction: column; }
          .side-card { min-width: unset; }
        }
      `}</style>

      <div className="support-root">
        {/* ── Hero ── */}
        <div className="support-hero">
          <div className="hero-text">
            <h1 className="hero-title">How can we help?</h1>
            <p className="hero-sub">
              Find answers in our FAQ, send us a message, or reach out via
              email. Our team is based in Lahore and responds within one
              business day.
            </p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <p className="hero-stat-value">&lt;4h</p>
              <p className="hero-stat-label">Avg response</p>
            </div>
            <div className="hero-stat">
              <p className="hero-stat-value">97%</p>
              <p className="hero-stat-label">Issues resolved</p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="support-body">
          {/* Main card */}
          <div className="support-card">
            <div className="support-tabs">
              <button
                className={`support-tab ${tab === "faq" ? "active" : ""}`}
                onClick={() => setTab("faq")}
              >
                <BookOpen size={14} /> FAQs
              </button>
              <button
                className={`support-tab ${tab === "contact" ? "active" : ""}`}
                onClick={() => setTab("contact")}
              >
                <MessageSquare size={14} /> Send a message
              </button>
            </div>
            <div className="support-tab-content">
              {tab === "faq" ? <FAQAccordion /> : <ContactForm />}
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar-stack">
            {/* Contact options */}
            <div className="side-card">
              <div className="side-card-header">
                <p className="side-card-title">Other ways to reach us</p>
              </div>
              <div className="side-card-body">
                <button className="contact-option">
                  <div
                    className="contact-option-icon"
                    style={{ background: "#eff6ff" }}
                  >
                    <Mail size={16} color="#3b82f6" />
                  </div>
                  <div className="contact-option-text">
                    <p className="contact-option-title">Email support</p>
                    <p className="contact-option-desc">
                      support@sahiscreen.com
                    </p>
                  </div>
                  <ExternalLink size={13} className="contact-option-arrow" />
                </button>
                <button className="contact-option">
                  <div
                    className="contact-option-icon"
                    style={{ background: "#f0fdf4" }}
                  >
                    <MessageSquare size={16} color="#10b981" />
                  </div>
                  <div className="contact-option-text">
                    <p className="contact-option-title">Live chat</p>
                    <p className="contact-option-desc">
                      Available Mon–Fri, 9am–6pm PKT
                    </p>
                  </div>
                  <ArrowRight size={13} className="contact-option-arrow" />
                </button>
              </div>
            </div>

            {/* System status */}
            <div className="side-card">
              <div className="side-card-header">
                <p className="side-card-title">System status</p>
              </div>
              <div className="side-card-body">
                {[
                  "CV screening API",
                  "Authentication",
                  "File uploads",
                  "Email delivery",
                ].map((service) => (
                  <div className="status-row" key={service}>
                    <div
                      className="status-dot"
                      style={{ background: "#10b981" }}
                    />
                    <p className="status-label">{service}</p>
                    <span className="status-ok">Operational</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="side-card">
              <div className="side-card-header">
                <p className="side-card-title">Quick resources</p>
              </div>
              <div className="side-card-body">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button key={link.label} className="quick-link">
                      <div className="ql-icon">
                        <Icon size={14} color="#7C3AED" />
                      </div>
                      <span className="ql-label">{link.label}</span>
                      <span className="ql-tag">{link.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
