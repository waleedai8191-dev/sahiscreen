"use client";

import { useState } from "react";
import {
  User,
  Building2,
  Mail,
  Save,
  Loader2,
  Check,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Props {
  initialData: {
    fullName: string;
    companyName: string;
    email: string;
  };
}

export default function SettingsClient({ initialData }: Props) {
  const [fullName, setFullName] = useState(initialData.fullName);
  const [companyName, setCompanyName] = useState(initialData.companyName);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isDirty =
    fullName.trim() !== initialData.fullName ||
    companyName.trim() !== initialData.companyName;

  const handleSave = async () => {
    if (!fullName.trim() || !companyName.trim()) {
      setErrorMsg("Both fields are required.");
      setSaveState("error");
      return;
    }

    setSaveState("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, companyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setSaveState("error");
        return;
      }

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setSaveState("error");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .settings-wrap {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f8fafc;
          min-height: 100vh;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .settings-inner {
          width: 100%;
          max-width: 580px;
        }

        /* Page header */
        .page-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        .page-sub {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 28px;
        }

        /* Card */
        .settings-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
        }

        .card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .card-header-icon {
          width: 36px; height: 36px;
          background: #f3f0ff;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }

        .card-header-text {}
        .card-header-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          justifycontent: center
        }
        .card-header-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 1px;
        }

        /* Form body */
        .card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Field */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          letter-spacing: 0.2px;
        }

        .field-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          pointer-events: none;
          display: flex;
        }

        .field-input {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px 14px 11px 38px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .field-input:focus {
          border-color: #7C3AED;
          background: white;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
        }

        .field-input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* Verified badge */
        .verified-badge {
          position: absolute;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #10b981;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 5px;
          padding: 3px 8px;
        }

        .field-hint {
          font-size: 11px;
          color: #94a3b8;
        }

        /* Error/success banners */
        .alert-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
        }

        /* Footer */
        .card-footer {
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dirty-hint {
          font-size: 12px;
          color: #94a3b8;
        }

        .dirty-hint.has-changes {
          color: #f59e0b;
          font-weight: 500;
        }

        /* Save button */
        .save-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #7C3AED;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-btn:hover:not(:disabled) {
          background: #6d28d9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
        }

        .save-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .save-btn.saved {
          background: #10b981;
        }

        .save-btn.error-state {
          background: #ef4444;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .settings-wrap { padding: 20px 16px; }
          .card-footer { flex-direction: column; gap: 10px; align-items: stretch; }
          .save-btn { justify-content: center; }
        }
      `}</style>

      <div className="settings-wrap">
        <div className="settings-inner">
          {/* Page header */}
          {/* <h1 className="page-title">Account Settings</h1> */}
          {/* <p className="page-sub">Manage your profile information</p> */}

          <div className="settings-card">
            {/* Card header */}
            <div className="card-header">
              <div className="card-header-icon">
                <User size={16} color="#7C3AED" />
              </div>
              <div className="card-header-text">
                <p className="card-header-title">Profile Information</p>
              </div>
            </div>

            {/* Form fields */}
            <div className="card-body">
              {/* Full Name */}
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <div className="field-input-wrap">
                  <span className="field-icon">
                    <User size={14} />
                  </span>
                  <input
                    className="field-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (saveState === "error") setSaveState("idle");
                    }}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="field-group">
                <label className="field-label">Company Name</label>
                <div className="field-input-wrap">
                  <span className="field-icon">
                    <Building2 size={14} />
                  </span>
                  <input
                    className="field-input"
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (saveState === "error") setSaveState("idle");
                    }}
                    placeholder="Your company name"
                    autoComplete="organization"
                  />
                </div>
              </div>

              {/* Email — read-only, always */}
              <div className="field-group">
                <label className="field-label">Email Address</label>
                <div className="field-input-wrap">
                  <span className="field-icon">
                    <Mail size={14} />
                  </span>
                  <input
                    className="field-input"
                    type="email"
                    value={initialData.email}
                    disabled
                  />
                  <span className="verified-badge">
                    <Check size={10} /> Verified
                  </span>
                </div>
                <p className="field-hint">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Inline feedback banners */}
              {saveState === "error" && errorMsg && (
                <div className="alert-banner alert-error">
                  <AlertCircle size={15} />
                  {errorMsg}
                </div>
              )}

              {saveState === "saved" && (
                <div className="alert-banner alert-success">
                  <CheckCircle2 size={15} />
                  Profile updated successfully!
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="card-footer">
              <p className={`dirty-hint ${isDirty ? "has-changes" : ""}`}>
                {isDirty ? "You have unsaved changes" : "All changes saved"}
              </p>

              <button
                className={`save-btn ${saveState === "saved" ? "saved" : ""} ${saveState === "error" ? "error-state" : ""}`}
                onClick={handleSave}
                disabled={saveState === "saving" || !isDirty}
              >
                {saveState === "saving" ? (
                  <>
                    <Loader2 size={14} className="spin" /> Saving…
                  </>
                ) : saveState === "saved" ? (
                  <>
                    <Check size={14} /> Saved!
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
